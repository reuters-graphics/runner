export default (cmd) => {
  let posArgs = [];
  let keyArgs = {};
  if (typeof cmd === 'string') return [cmd, posArgs, keyArgs];

  if (cmd.length === 1) return [cmd[0], posArgs, keyArgs];
  if (Array.isArray(cmd[1])) {
    posArgs = cmd[1];
  } else {
    keyArgs = cmd[1];
  }
  if (cmd[2]) {
    if (Array.isArray(cmd[2])) {
      posArgs = cmd[2];
    } else {
      keyArgs = cmd[2];
    }
  }
  return [cmd[0], posArgs, keyArgs];
};
