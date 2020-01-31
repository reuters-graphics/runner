import flattenDeep from 'lodash/flattenDeep';
import getRc from './getRc';
import setEnv from './setEnv';
import spawn from 'cross-spawn';
import standardizeCmd from './standardize/cmd';
import standardizeTask from './standardize/task';
import yargs from 'yargs';

const argv = yargs.argv;

// Capture process exit explicitly
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') process.abort();
});

export const runTasks = (testConfig = null, testArgs = null) => {
  const { tasks, scripts } = testConfig || getRc();

  const args = testArgs || { ...argv };

  const task = args._[0];

  const runnerPosArgs = args._.slice(1);
  const runnerKeyArgs = { ...args };
  delete runnerKeyArgs._;
  delete runnerKeyArgs.$0;

  const { run, env } = standardizeTask(tasks[task]);

  setEnv(env);

  const hoistArg = (arg) => {
    if (typeof arg !== 'string') return arg;

    // Environment variable
    if (/^\$\d+$/.test(arg) || /^\$\w+/.test(arg)) {
      if (arg.slice(1) in process.env) return process.env[arg.slice(1)];
    }
    // Positional arg passed to runner
    if (/^\$\d+$/.test(arg)) {
      const i = parseInt(arg.slice(1)) - 1;
      return runnerPosArgs[i] || null;
    // Keyword arg passed to runner
    } else if (/^\$\w+/.test(arg)) {
      return runnerKeyArgs[arg.slice(1)] || null;
    // Just an arg...
    } else {
      return arg;
    }
  };

  const construePosArgs = (posArgs) =>
    posArgs
      .map(arg => hoistArg(arg))
      .filter(a => a !== null);

  const construeKeyArgs = (keyArgs) => {
    return flattenDeep(Object.keys(keyArgs).map(key => {
      const args = [];
      if (key.length === 1) {
        args.push(`-${key}`);
      } else {
        args.push(`--${key}`);
      }
      const hoisted = hoistArg(keyArgs[key]);
      if (hoisted === null) return hoisted;
      args.push(hoisted);
      return args;
    }).filter(arg => arg !== null));
  };

  const spawnedCommands = [];

  for (const i in run) {
    const taskCommand = standardizeCmd(run[i]);
    const cmd = taskCommand[0];
    const cmdPosArgs = construePosArgs(taskCommand[1]);
    const cmdKeyArgs = construeKeyArgs(taskCommand[2]);

    const script = scripts[cmd] ?
      scripts[cmd].split(' ')[0] : cmd;

    const scriptPosArgs = scripts[cmd] ?
      scripts[cmd].split(' ').slice(1) : [];

    const scriptArgs = [
      ...scriptPosArgs,
      ...cmdPosArgs,
      ...cmdKeyArgs,
    ];

    if (!testConfig) spawn.sync(script, scriptArgs, { stdio: 'inherit' });
    spawnedCommands.push([script, scriptArgs]);
  }
  return spawnedCommands;
};

export { default as schema } from './schema';
