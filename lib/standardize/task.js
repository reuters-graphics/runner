import parser from 'yargs-parser';

const parseStringCmd = (script) => {
  const argv = parser(script);

  const cmd = argv._[0];

  const posArgs = argv._.slice(1);
  const keyArgs = { ...argv };
  delete keyArgs._;

  return [cmd, posArgs, keyArgs];
};

export default (task) => {
  if (typeof task === 'string') return { run: [parseStringCmd(task)] };
  return task;
};
