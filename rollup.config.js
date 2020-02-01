import externals from 'rollup-plugin-node-externals';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';

const plugins = [
  resolve({ preferBuiltins: true, modulesOnly: true }),
  externals({ deps: true }),
  json(),
];

const output = {
  dir: 'dist',
  format: 'cjs',
  paths: {
    '@reuters-graphics/runner': './index.js',
    '@reuters-graphics/runner/schema': './schema/index.js',
  },
};

export default [{
  input: 'lib/schema/index.js',
  output: { ...output, ...{ dir: 'dist/schema' } },
  plugins,
}, {
  input: 'lib/index.js',
  output,
  plugins,
  external: ['@reuters-graphics/runner/schema'],
}, {
  input: 'lib/cli.js',
  output: { ...output, ...{ banner: '#!/usr/bin/env node' } },
  plugins,
  external: ['@reuters-graphics/runner'],
}];
