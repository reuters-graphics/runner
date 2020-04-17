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
  if (key.ctrl && key.name === 'c') process.exit(0);
});
process.on('SIGINT', () => { process.exit(0); });
process.on('SIGTERM', () => { process.exit(0); });

export default class Runner {
  constructor(testConfig = null, testArgs = null) {
    this.testing = Boolean(testConfig);
    this.verbose = testArgs ? Boolean(testArgs.verbose) : Boolean(argv.verbose);
    this.config = testConfig ? { ...{ help: {}, inputs: {} }, ...testConfig } : getConfig();
    this.cliArgs = testArgs || { ...argv };

    this.spawnedCommands = [];

    this.task = this.cliArgs._[0];

    if (!this.task) {
      const helpCommands = Object.keys(this.config.help)
        .map(command => chalk`{yellow ${command}}: {gray ${this.config.help[command]}}`);
      const hasHelp = helpCommands.length > 0;

      const helpText = !hasHelp ? '' : chalk`\n{gray The following tasks are available:}\n${helpCommands.join('\n')}\n`;

      throw new Error(chalk`{red runner:} {gray Pass a task name to runner like:} {yellow $ runner <task>}\n${helpText}`);
    }

    this.args = this.cliArgs._.slice(1);
    this.kwargs = { ...this.cliArgs };
    delete this.kwargs._;
    delete this.kwargs.$0;
  }

  async runTasks() {
    await this.runTask(this.task);
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

  async runTask(task, overrideArgs = [], overrideKwargs = {}) {
    const runArgs = this.overrideArgs(overrideArgs);
    const runKwargs = this.overrideKwargs(overrideKwargs);

    const { tasks, scripts, inputs } = this.config;

    if (!(task in tasks) && !(task in scripts)) {
      throw new Error(chalk`{red runner:} {gray Couldn't find task:} {yellow ${task}}`);
    }

    const { run, env } = task in tasks ?
      standardizeTask(tasks[task]) :
      // script called directly, in which case we reconstitute
      // the original CLI command and parse that...
      standardizeTask(unparser(this.cliArgs).join(' '));

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

      // If cmd is in inputs, run that func and move on...
      if (cmd in inputs) {
        if (typeof inputs[cmd] !== 'function') continue;
        await inputs[cmd]({ args: runArgs, kwargs: runKwargs });
        continue;
      }

      // If cmd is another task, run that and move on...
      if (cmd in tasks) {
        if (cmd !== task) await this.runTask(cmd, cmdArgs, cmdKwargs);
        continue;
      };

      const unconstruedArgs = unparser({
        ...{ _: cmdArgs },
        ...cmdKwargs,
      });

      let script = cmd;
      let scriptPosArgs = [];

      if (cmd in scripts) {
        const prefixedScript = /^npx /i.test(scripts[cmd]) ?
          scripts[cmd] : `npx ${scripts[cmd]}`;
        script = parser(prefixedScript)._[0];
        scriptPosArgs = unparser(
          parser(prefixedScript.split(' ').slice(1).join(' '))
        );
      }

      const scriptArgs = [
        ...scriptPosArgs,
        ...unconstruedArgs,
      ];

      if (this.verbose) {
        // cross-spawn handles escaping string args for us, but
        // we should reflect that in verbose log.
        const escapeForLog = (arg) => / /g.test(arg) ?
          `"${arg.replace('"', '\"')}"` : arg; // eslint-disable-line no-useless-escape
        console.log(chalk`{red.dim runner:} {gray.dim ${script} ${scriptArgs.map(escapeForLog).join(' ')}}`);
      }

      if (!this.testing) {
        const childSpawn = spawn.sync(script, scriptArgs, { stdio: 'inherit' });
        if (childSpawn.stderr || childSpawn.status > 0) {
          console.log(chalk`{red runner:} {gray Exiting because there was an error in task:} {yellow ${task}}`);
          process.exit(0);
        }
      }

      this.spawnedCommands.push([script, scriptArgs]);
    }
  }
}
