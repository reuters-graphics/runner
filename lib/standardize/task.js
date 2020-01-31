const parseStringCmd = (script) => {
  const cmd = script.split(' ')[0];
  const args = script.split(' ').slice(1);

  const posArgs = [];
  const keyArgs = {};

  let queuedKeyArg = null;

  for (const i in args) {
    const arg = args[i];
    if (queuedKeyArg && !/^-{1,2}\w+$/.test(arg)) {
      keyArgs[queuedKeyArg] = arg;
      queuedKeyArg = null;
      posArgs.pop();
    } else {
      if (/^-{1,2}\w+$/.test(arg)) {
        const match = arg.match(/^-{1,2}(\w+)$/);
        queuedKeyArg = match[1];
        posArgs.push(arg);
      } else {
        posArgs.push(arg);
      }
    }
  }
  return [cmd, posArgs, keyArgs];
};

export default (task) => {
  if (typeof task === 'string') return { run: [parseStringCmd(task)] };
  return task;
};
