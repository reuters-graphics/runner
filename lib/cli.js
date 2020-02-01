import { name, version } from '../package.json';

import Runner from '@reuters-graphics/runner';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';

updateNotifier({ pkg: { name, version } }).notify();

console.log(chalk`\n🏃{red runner} {yellow v${version}}\n`);

const runner = new Runner();

try {
  runner.runTasks();
} catch (e) {
  console.log(e.message);
  process.exit();
}
