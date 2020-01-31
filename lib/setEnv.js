export default (env = {}) => {
  Object.keys(env || {}).forEach((envvar) => {
    process.env[envvar] = env[envvar];
  });
};
