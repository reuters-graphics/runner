import Ajv from 'ajv';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import schema from '@reuters-graphics/runner/schema';

// Prefer the config rc file over package.json...
const getConfig = () => {
  const tasksConfigPath = path.resolve(process.cwd(), '.tasksrc.js');
  const packagePath = path.resolve(process.cwd(), 'package.json');

  if (!fs.existsSync(packagePath)) {
    throw new Error(chalk`{red runner:} {gray Can't find} {yellow package.json}{gray . Are you running from your project root?}`);
  }

  const pkg = require(packagePath);

  if (!fs.existsSync(tasksConfigPath)) {
    if ('tasks' in pkg) {
      return {
        scripts: pkg.scripts || {},
        tasks: pkg.tasks,
        inputs: {},
      };
    } else {
      throw new Error(chalk`{red runner:} {gray Can't find either a} {yellow .tasksrc.js} {gray in your project root or tasks config in} {yellow package.json}{gray .}`);
    }
  }
  const tasksConfig = require(tasksConfigPath);

  // combine scripts defs, tasksrc takes precedence
  tasksConfig.scripts = { ...pkg.scripts, ...tasksConfig.scripts };

  if (!('inputs' in tasksConfig)) {
    tasksConfig.inputs = {};
  }

  return tasksConfig;
};

export default () => {
  const config = getConfig();
  const ajv = new Ajv();

  const valid = ajv.validate(schema, config);

  if (!valid) {
    // Pull the longest data path, which should be the most specific.
    // There can be more than one error, but this gives you a place
    // to start looking...
    const mostSpecificPath = ajv.errors.map(({ dataPath }) => dataPath)
      .reduce((a, b) => a.length > b.length ? a : b);
    throw new Error(chalk`{red runner:} {gray Invalid tasks or scripts. Check config at:} {yellow ${mostSpecificPath}}`);
  }

  return config;
};
