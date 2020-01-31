import { name, version } from '../package.json';

import { runTasks } from '@reuters-graphics/runner';
import updateNotifier from 'update-notifier';

updateNotifier({ pkg: { name, version } }).notify();

runTasks();
