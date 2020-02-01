export default (cmd) => {
  let args = [];
  let kwargs = {};
  if (typeof cmd === 'string') return [cmd, args, kwargs];

  // ['cmd']
  if (cmd.length === 1) return [cmd[0], args, kwargs];

  // ['cmd', [...]]
  if (Array.isArray(cmd[1])) {
    args = cmd[1];
  } else {
  // ['cmd', {...}]
    kwargs = cmd[1];
  }
  if (cmd[2]) {
    // ['cmd', {...}, [...]]
    if (Array.isArray(cmd[2])) {
      args = cmd[2];
    // ['cmd', [...], {...}]
    } else {
      kwargs = cmd[2];
    }
  }
  return [cmd[0], args, kwargs];
};
