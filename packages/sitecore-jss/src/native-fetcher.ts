import { HttpResponse } from './data-fetcher';
import debuggers, { Debugger } from './debug';
import TimeoutPromise from './utils/timeout-promise';

type NativeDataFetcherOptions = {
  /**
   * Override debugger for logging. Uses 'sitecore-jss:http' by default.
   */
  debugger?: Debugger;
  /**
   * Override fetch method. Uses native (or polyfilled) fetch by default.
   */
  fetch?: typeof fetch;
  /**
   * Optional request timeout.
   */
  timeout?: number;
};

export type NativeDataFetcherConfig = NativeDataFetcherOptions & RequestInit;

export class NativeDataFetcher {
  private abortTimeout?: TimeoutPromise;

  constructor(protected config: NativeDataFetcherConfig = {}) {}

  /**
   * Implements a data fetcher. @see HttpDataFetcher<T> type for implementation details/notes.
   * @param {string} url The URL to request; may include query string
   * @param {unknown} [data] Optional data to POST with the request.
   * @returns {Promise<HttpResponse<T>>} response
   */
  async fetch<T>(url: string, data?: unknown): Promise<HttpResponse<T>> {
    const { debugger: debugOverride, fetch: fetchOverride, ...init } = this.config;
    const fetchImpl = fetchOverride || fetch;
    const debug = debugOverride || debuggers.http;
    const requestInit = this.getRequestInit(init, data);

    const fetchWithOptionalTimeout = [fetchImpl(url, requestInit)];
    if (init.timeout) {
      this.abortTimeout = new TimeoutPromise(init.timeout);
      fetchWithOptionalTimeout.push(this.abortTimeout.start as Promise<Response>);
    }

    // Note a goal here is to provide consistent debug logging and error handling
    // as we do in AxiosDataFetcher and GraphQLRequestClient

    const { headers: reqHeaders, ...rest } = requestInit;

    debug('request: %o', { url, headers: this.extractDebugHeaders(reqHeaders), ...rest });
    const response = await Promise.race(fetchWithOptionalTimeout)
      .then((res) => {
        this.abortTimeout?.clear();
        return res;
      })
      .catch((error) => {
        this.abortTimeout?.clear();
        debug('request error: %o', error);
        throw error;
      });

    // Note even an error status may send useful json data in response (which we want for logging)
    let respData: unknown = undefined;
    const isJson = response.headers.get('Content-Type')?.includes('application/json');
    if (isJson) {
      respData = await response.json().catch((error) => {
        debug('response.json() error: %o', error);
      });
    }
    const debugResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: this.extractDebugHeaders(response.headers),
      url: response.url,
      redirected: response.redirected,
      data: respData,
    };

    if (!response.ok) {
      debug('response error: %o', debugResponse);
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    debug('response: %o', debugResponse);
    return {
      ...response,
      data: respData as T,
    };
  }

  /**
   * Determines settings for the request
   * @param {RequestInit} init Custom settings for request
   * @param {unknown} [data] Optional data to POST with the request
   * @returns {RequestInit} The final request settings
   */
  protected getRequestInit(init: RequestInit = {}, data?: unknown): RequestInit {
    // This is a focused implementation (GET or POST only using JSON input/output)
    // so we are opinionated about method, body, and Content-Type
    init.method = data ? 'POST' : 'GET';
    init.body = data ? JSON.stringify(data) : undefined;

    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    init.headers = headers;

    return init;
  }

  /**
   * Safely extract all headers for debug logging
   * @param {HeadersInit} incomingHeaders Incoming headers
   * @returns Object with headers as key/value pairs
   */
  protected extractDebugHeaders(incomingHeaders: HeadersInit = {}) {
    const headers = {} as { [key: string]: string | string[] };

    if (typeof incomingHeaders?.forEach !== 'string' && incomingHeaders.forEach) {
      incomingHeaders?.forEach((value, key) => {
        headers[key] = value;
      });
    }

    return headers;
  }
}
