import { GraphQLClient as Client, ClientError } from 'graphql-request';
import { type DocumentNode } from 'graphql';
import TimeoutPromise from '../utils/timeout-promise';
import type { Debugger } from '../utils/debug';

/**
 * An interface for GraphQL clients for Sitecore APIs
 */
export interface GraphQLClient {
  /**
   * Execute graphql request
   * @param {string | DocumentNode} query graphql query
   * @param {Object} variables graphql variables
   */
  request<T>(query: string | DocumentNode, variables?: { [key: string]: unknown }): Promise<T>;
}

/**
 * Minimum configuration options for classes that implement @see GraphQLClient
 */
export type GraphQLRequestClientConfig = {
  /**
   * The API key to use for authentication. This will be added as an 'sc_apikey' header.
   */
  apiKey?: string;
    /**
     * Override debugger for logging. Uses 'sitecore-jss:http' by default.
     */
  debugger?: Debugger;
  /**
   * Override fetch method. Uses 'graphql-request' library default otherwise ('cross-fetch').
   */
  fetch?: typeof fetch;
  /**
   * GraphQLClient request timeout
   */
  timeout?: number;
  /**
   * Number of retries for client. Will be used if endpoint responds with 429 (rate limit reached) error
   */
  retries?: number;
};

/**
 * A GraphQL Client Factory is a function that accepts configuration and returns an instance of a GraphQLRequestClient.
 * This factory function is used to create and configure GraphQL clients for making GraphQL API requests.
 * @param config - The configuration object that specifies how the GraphQL client should be set up.
 * @returns An instance of a GraphQL Request Client ready to send GraphQL requests.
 */
export type GraphQLRequestClientFactory = (
  config: Omit<GraphQLRequestClientConfig, 'apiKey'>
) => GraphQLRequestClient;

/**
 * Configuration type for @type GraphQLRequestClientFactory
 */
export type GraphQLRequestClientFactoryConfig = { endpoint: string; apiKey?: string };

/**
 * A GraphQL client for Sitecore APIs that uses the 'graphql-request' library.
 * https://github.com/prisma-labs/graphql-request
 */
export class GraphQLRequestClient implements GraphQLClient {
  private client: Client;
  private headers: Record<string, string> = {};
  private retries: number;
  private abortTimeout?: TimeoutPromise;
  private timeout?: number;

  /**
   * Provides ability to execute graphql query using given `endpoint`
   * @param {string} endpoint The Graphql endpoint
   * @param {GraphQLRequestClientConfig} [clientConfig] GraphQL request client configuration.
   */
  constructor(endpoint: string, clientConfig: GraphQLRequestClientConfig = {}) {
    if (clientConfig.apiKey) {
      this.headers.sc_apikey = clientConfig.apiKey;
    }

    if (!endpoint || !new URL(endpoint).hostname) {
      throw new Error(
        `Invalid GraphQL endpoint '${endpoint}'. Verify that 'layoutServiceHost' property in 'scjssconfig.json' file or appropriate environment variable is set`
      );
    }

    this.timeout = clientConfig.timeout;
    this.retries = clientConfig.retries || 0;
    this.client = new Client(endpoint, {
      headers: this.headers,
      fetch: clientConfig.fetch,
    });
  }

  /**
   * Factory method for creating a GraphQLRequestClientFactory.
   * @param {Object} config - client configuration options.
   * @param {string} config.endpoint - endpoint
   * @param {string} [config.apiKey] - apikey
   */
  static createClientFactory({
    endpoint,
    apiKey,
  }: GraphQLRequestClientFactoryConfig): GraphQLRequestClientFactory {
    return (config: Omit<GraphQLRequestClientConfig, 'apiKey'> = {}) =>
      new GraphQLRequestClient(endpoint, { ...config, apiKey });
  }

  /**
   * Execute graphql request
   * @param {string | DocumentNode} query graphql query
   * @param {Object} variables graphql variables
   */
  async request<T>(
    query: string | DocumentNode,
    variables?: { [key: string]: unknown }
  ): Promise<T> {
    let retriesLeft = this.retries;

    const retryer = async (): Promise<T> => {
      // Note we don't have access to raw request/response with graphql-request
      // (or nice hooks like we have with Axios), but we should log whatever we have.
      // const startTimestamp = Date.now();
      const fetchWithOptionalTimeout = [this.client.request(query, variables)];
      if (this.timeout) {
        this.abortTimeout = new TimeoutPromise(this.timeout);
        fetchWithOptionalTimeout.push(this.abortTimeout.start);
      }
      return Promise.race(fetchWithOptionalTimeout).then(
        (data: unknown) => {
          this.abortTimeout?.clear();
          return Promise.resolve(data as T);
        },
        (error: ClientError) => {
          this.abortTimeout?.clear();
          if (error.response?.status === 429 && retriesLeft > 0) {
            const rawHeaders = (error as ClientError)?.response?.headers as {[key: string]: string};
            const delaySeconds =
              rawHeaders && rawHeaders['Retry-After']
                ? Number.parseInt(rawHeaders['Retry-After'], 10)
                : 1;
            retriesLeft--;
            return new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000)).then(retryer);
          } else {
            return Promise.reject(error);
          }
        }
      );
    };

    return retryer();
  }
}