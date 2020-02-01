import { name, version } from '../package.json';

import Runner from '@reuters-graphics/runner';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';

updateNotifier({ pkg: { name, version } }).notify();

console.log(chalk`\n🏃{red runner} {yellow v${version}}\n`);

const runCLI = async() => {
  try {
    const runner = new Runner();
    await runner.runTasks();
  } catch (e) {
    console.log(e.message);
    process.exit();
  }
};

runCLI();
