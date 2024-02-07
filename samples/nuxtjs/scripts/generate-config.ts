import 'dotenv/config';
import { jssConfigFactory } from './config';
const fs = require('fs');
const path = require('path');
const { constantCase } = require('constant-case');

/* eslint-disable no-console */
export interface JssConfig extends Record<string, string | undefined> {
  sitecoreApiKey?: string;
  sitecoreApiHost?: string;
  sitecoreSiteName?: string;
  graphQLEndpointPath?: string;
  defaultLanguage?: string;
  graphQLEndpoint?: string;
  layoutServiceConfigurationName?: string;
  publicUrl?: string;
}
const defaultConfig: JssConfig = {
  sitecoreApiKey: process.env[`${constantCase('nuxtSitecoreApiKey')}`],
  sitecoreApiHost: process.env[`${constantCase('nuxtSitecoreApiHost')}`],
  sitecoreSiteName:
    process.env[`${constantCase('nuxtSitecoreSiteName')}`] ||
    process.env[`${constantCase('jssAppName')}`],
  graphQLEndpointPath: process.env[`${constantCase('nuxtGraphQLEndpointPath')}`],
  defaultLanguage: process.env[`${constantCase('nuxtDefaultLanguage')}`],
  graphQLEndpoint: process.env[`${constantCase('nuxtGraphQLEndpoint')}`],
  layoutServiceConfigurationName:
    process.env[`${constantCase('nuxtLayoutServiceConfigurationName')}`],
  publicUrl: process.env[`${constantCase('nuxtPublicUrl')}`],
};
/*
  CONFIG GENERATION
  Generates the /src/temp/config.js file which contains runtime configuration
  that the app can import and use.
*/
generateConfig(defaultConfig);
/**
 * Generate config
 * The object returned from this function will be made available by importing temp/generated-config.js.
 * This is executed prior to the build running, so it's a way to inject environment or build config-specific
 * settings as variables into the JSS app.
 * NOTE! Any configs returned here will be written into the client-side JS bundle. DO NOT PUT SECRETS HERE.
 * @param {object} configOverrides Keys in this object will override any equivalent global config keys.
 * @param defaultConfig
 */
// NUXT_JSS_APP_NAME env variable has been deprecated since v.21.6, NUXT_SITECORE_SITE_NAME should be used instead
export function generateConfig(defaultConfig?: JssConfig): void {
  jssConfigFactory
    .create(defaultConfig)
    .then((config) => {
      writeConfig(config);
    })
    .catch((e) => {
      console.error('Error generating config');
      console.error(e);
      process.exit(1);
    });
}

/**
 * Writes the config object to disk with support for environment variables.
 * @param {JssConfig} config JSS configuration to write.
 */
function writeConfig(config: JssConfig): void {
  let configText = `/* eslint-disable */
// Do not edit this file, it is auto-generated at build time!
// See scripts/bootstrap.ts to modify the generation of this file.
const config = {};\n`;

  // Set configuration values, allowing override with environment variables
  Object.keys(config).forEach((prop) => {
    configText += `config.${prop} = process.env.${constantCase(prop)} || '${config[prop]}';\n`;
  });

  configText += 'export default config;';

  const configPath = path.resolve('temp/config.js');
  console.log(`Writing runtime config to ${configPath}`);
  fs.writeFileSync(configPath, configText, { encoding: 'utf8' });
}