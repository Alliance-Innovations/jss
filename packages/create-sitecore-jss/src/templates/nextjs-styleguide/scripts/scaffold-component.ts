/*
  Component Scaffolding Script
  This is a script that enables scaffolding a new JSS component using `jss scaffold <ComponentName>`.
  The default convention is that component names must start with a capital letter, and can contain
  letters, number, underscores, or dashes.
  
  If the <ComponentName> parameter includes a path, it must be relative to the src/components folder.
  For example, `jss scaffold search/SearchBox` will create a component called `SearchBox` in
  `src/components/search/SearchBox.tsx`. Specifying a relative path is optional, and just providing
  the name is ok.

  Edit this script if you wish to use your own conventions for component storage in your JSS app.
*/

/* eslint-disable no-throw-literal,no-console */

import fs from 'fs';
import chalk from 'chalk';
import generateComponentSrc from './templates/component-src';
import generateComponentManifest from './templates/component-manifest';
import { scaffoldFile } from '@sitecore-jss/sitecore-jss-dev-tools';

const componentManifestDefinitionsPath = 'sitecore/definitions/components';

const componentRootPath = 'src/components';

// Matches component names that start with a capital letter, and contain only letters, number,
// underscores, or dashes. Optionally, the component name can be preceded by a relative path
const nameParamFormat = new RegExp(/^((?:[\w-]+\/)*)([A-Z][\w-]+)$/);
const componentArg = process.argv[2];

if (!componentArg) {
  throw 'Component name was not passed. Usage: jss scaffold <ComponentName>';
}

const regExResult = nameParamFormat.exec(componentArg);

if (regExResult === null) {
  throw `Component name should start with an uppercase letter and contain only letters, numbers,
dashes, or underscores. If specifying a path, it must be relative to src/components`;
}

const componentPath = regExResult[1];
const componentName = regExResult[2];
const filename = `${componentName}.tsx`;

const componentOutputPath = scaffoldFile(
  componentRootPath,
  generateComponentSrc(componentName),
  filename,
  componentPath
);

let manifestOutputPath = null;
if (fs.existsSync(componentManifestDefinitionsPath)) {
  const filename = `${componentName}.sitecore.ts`;

  manifestOutputPath = scaffoldFile(
    componentManifestDefinitionsPath,
    generateComponentManifest(componentName),
    filename,
    componentPath
  );
} else {
  console.log(
    chalk.red(`Not scaffolding manifest because ${componentManifestDefinitionsPath}
did not exist. This is normal for Sitecore-first workflow.`)
  );
}
console.log(
  chalk.green(`
Scaffolding of ${componentName} complete.
Next steps:`)
);

if (manifestOutputPath) {
  console.log(`* Define the component's data in ${chalk.green(manifestOutputPath)}`);
} else {
  console.log(
    `* Scaffold the component in Sitecore using '${chalk.green(
      `jss deploy component ${componentName} --allowedPlaceholders placeholder-for-component`
    )}, or create the rendering item and datasource template yourself.`
  );
}
if (componentOutputPath) {
  console.log(`* Implement the React component in ${chalk.green(componentOutputPath)}`);
}
if (manifestOutputPath) {
  console.log(
    `* Add the component to a route layout (/data/routes) and test it with ${chalk.green(
      'jss start'
    )}`
  );
} else {
  console.log(
    `* Deploy your app with the new component to Sitecore (${chalk.green(
      'jss deploy:watch'
    )} or ${chalk.green('jss deploy files')})`
  );
  console.log(`* Add the component to a route using Sitecore Experience Editor, and test it.`);
}
