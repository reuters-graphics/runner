import chalk from 'chalk';
import getConfig from './getConfig';
import parser from 'yargs-parser';
import setEnv from './setEnv';
import spawn from 'cross-spawn';
import standardizeCmd from './standardize/cmd';
import standardizeTask from './standardize/task';
import unparser from 'yargs-unparser';
import yargs from 'yargs';

const argv = yargs.argv;

// Capture process exit explicitly
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') process.exit();
});

export default class Runner {
  constructor(testConfig = null, testArgs = null) {
    this.testing = Boolean(testConfig);
    this.config = testConfig || getConfig();
    this.cliArgs = testArgs || { ...argv };

    this.spawnedCommands = [];

    this.task = this.cliArgs._[0];

    if (!this.task) throw new Error(chalk`Pass a task name to runner like: {yellow $ runner <task>}`);

    this.args = this.cliArgs._.slice(1);
    this.kwargs = { ...this.cliArgs };
    delete this.kwargs._;
    delete this.kwargs.$0;
  }

  runTasks() {
    this.runTask(this.task);
    return this.spawnedCommands;
  };

  overrideArgs(overrideArgs) {
    const args = this.args.slice();
    overrideArgs.forEach((arg, i) => {
      args[i] = arg;
    });
    return args;
  }

  overrideKwargs(overrideKwargs) {
    return { ...this.kwargs, ...overrideKwargs };
  }

  runTask(task, overrideArgs = [], overrideKwargs = {}) {
    const runArgs = this.overrideArgs(overrideArgs);
    const runKwargs = this.overrideKwargs(overrideKwargs);

    const { tasks, scripts } = this.config;

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
        return runArgs[i] || null;
      // Keyword arg passed to runner
      } else if (/^\$\w+/.test(arg)) {
        return runKwargs[arg.slice(1)] || null;
      // Just an arg...
      } else {
        return arg;
      }
    };

    const replaceArgs = (args) =>
      args
        .map(arg => hoistArg(arg))
        .filter(a => a !== null);

    const replaceKwargs = (kwargs) => {
      const newKwargs = { ...kwargs };

      Object.keys(kwargs).forEach((key) => {
        const arg = kwargs[key];
        if (Array.isArray(arg)) {
          newKwargs[key] = replaceArgs(arg);
        } else {
          newKwargs[key] = hoistArg(arg);
        }
      });
      return newKwargs;
    };

    for (const i in run) {
      const taskCommand = standardizeCmd(run[i]);

      const cmd = taskCommand[0];
      const cmdArgs = replaceArgs(taskCommand[1]);
      const cmdKwargs = replaceKwargs(taskCommand[2]);

      // If cmd is another task, run that and move on...
      if (cmd in tasks) {
        if (cmd !== task) this.runTask(cmd, cmdArgs, cmdKwargs);
        continue;
      };

      const unconstruedArgs = unparser({
        ...{ _: cmdArgs },
        ...cmdKwargs,
      });

      const script = scripts[cmd] ?
        parser(scripts[cmd])._[0] : cmd;

      const scriptPosArgs = scripts[cmd] ?
        unparser(
          parser(scripts[cmd].split(' ').slice(1).join(' '))
        ) : [];

      const scriptArgs = [
        ...scriptPosArgs,
        ...unconstruedArgs,
      ];

      if (!this.testing) spawn.sync(script, scriptArgs, { stdio: 'inherit' });
      this.spawnedCommands.push([script, scriptArgs]);
    }
  }
}
