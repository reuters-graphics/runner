import Ajv from 'ajv';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import schema from './schema';

const getConfig = () => {
  const tasksConfigPath = path.resolve(process.cwd(), '.tasksrc.js');
  const packagePath = path.resolve(process.cwd(), 'package.json');

  if (!fs.existsSync(packagePath)) {
    throw new Error(chalk`Can't find {yellow package.json}. Are you running runner from your project root directory?`);
  }

  const pkg = require(packagePath);

  if ('scripts' in pkg && 'tasks' in pkg) {
    return { scripts: pkg.scripts, tasks: pkg.tasks };
  }

  if (!fs.existsSync(tasksConfigPath)) {
    if ('scripts' in pkg && 'tasks' in pkg) {
      return { scripts: pkg.scripts, tasks: pkg.tasks };
    } else {
      throw new Error(chalk`Can't find {yellow .tasksrc.js} in your project root.`);
    }
  }
  const tasksConfig = require(tasksConfigPath);
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
    throw new Error(chalk`Invalid tasks or scripts. Check config at:\n{yellow ${mostSpecificPath}}.\n`);
  }

  return config;
};
