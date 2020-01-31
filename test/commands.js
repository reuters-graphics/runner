const expect = require('expect.js');
const argParser = require('yargs-parser');
const { runTasks } = require('../dist');

describe('Test commands', function() {
  it('Should construe simple tasks', function() {
    const testConfig = {
      scripts: {
        webpack: 'webpack',
      },
      tasks: {
        build: 'webpack --config ./webpack.conf.js',
        'build:prod': 'webpack --config ./webpack.conf.js --minify',
      },
    };

    let argv, spawnedCommands;

    argv = argParser('build');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['--config', './webpack.conf.js']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(2);
    expect(spawnedCommands[0][1][0]).to.be('--config');
    expect(spawnedCommands[0][1][1]).to.be('./webpack.conf.js');

    argv = argParser('build:prod');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['--minify', '--config', './webpack.conf.js']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(3);
    expect(spawnedCommands[0][1][0]).to.be('--minify');
    expect(spawnedCommands[0][1][1]).to.be('--config');
    expect(spawnedCommands[0][1][2]).to.be('./webpack.conf.js');
  });

  it('Should hoist env', function() {
    const testConfig = {
      scripts: {
        webpack: 'webpack',
      },
      tasks: {
        build: {
          run: [
            ['webpack', ['$NODE_ENV']],
          ],
          env: {
            NODE_ENV: 'production',
          },
        },
        'build:prod': {
          run: [
            ['webpack', { minify: '$NODE_ENV' }],
          ],
          env: {
            NODE_ENV: 'production',
          },
        },
      },
    };

    let argv, spawnedCommands;

    argv = argParser('build');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['production']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(1);
    expect(spawnedCommands[0][1][0]).to.be('production');

    argv = argParser('build:prod');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['--minify', 'production']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(2);
    expect(spawnedCommands[0][1][0]).to.be('--minify');
    expect(spawnedCommands[0][1][1]).to.be('production');
  });

  it('Should hoist positional args', function() {
    const testConfig = {
      scripts: {
        webpack: 'webpack',
      },
      tasks: {
        build: 'webpack $1',
        'build:prod': {
          run: [
            ['webpack', ['$1', '$2']],
          ],
        },
        'build:stage': {
          run: [
            ['webpack', { minify: '$1' }, ['$2']],
          ],
        },
      },
    };

    let argv, spawnedCommands;

    argv = argParser('build app');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['app']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(1);
    expect(spawnedCommands[0][1][0]).to.be('app');

    argv = argParser('build:prod app thing');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['app', 'thing']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(2);
    expect(spawnedCommands[0][1][0]).to.be('app');
    expect(spawnedCommands[0][1][1]).to.be('thing');

    argv = argParser('build:stage app thing');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['thing', '--minify', 'app']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(3);
    expect(spawnedCommands[0][1][0]).to.be('thing');
    expect(spawnedCommands[0][1][1]).to.be('--minify');
    expect(spawnedCommands[0][1][2]).to.be('app');
  });

  it('Should hoist keyword args', function() {
    const testConfig = {
      scripts: {
        webpack: 'bundler',
      },
      tasks: {
        build: 'webpack $locale',
        'build:prod': {
          run: [
            ['webpack', ['$locale', '$country']],
          ],
        },
        'build:stage': {
          run: [
            ['webpack', { minify: '$locale' }, ['$country']],
          ],
        },
      },
    };

    let argv, spawnedCommands;

    argv = argParser('build --locale en');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['en']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('bundler');
    expect(spawnedCommands[0][1]).to.have.length(1);
    expect(spawnedCommands[0][1][0]).to.be('en');

    argv = argParser('build:prod --locale en --country England');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['en', 'England']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('bundler');
    expect(spawnedCommands[0][1]).to.have.length(2);
    expect(spawnedCommands[0][1][0]).to.be('en');
    expect(spawnedCommands[0][1][1]).to.be('England');

    argv = argParser('build:stage --locale en --country England');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['England', '--minify', 'en']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('bundler');
    expect(spawnedCommands[0][1]).to.have.length(3);
    expect(spawnedCommands[0][1][0]).to.be('England');
    expect(spawnedCommands[0][1][1]).to.be('--minify');
    expect(spawnedCommands[0][1][2]).to.be('en');
  });

  it('Should hoist positional args', function() {
    const testConfig = {
      scripts: {
        webpack: 'webpack',
      },
      tasks: {
        build: 'webpack $1',
        'build:prod': {
          run: [
            ['webpack', ['$1', '$2']],
          ],
        },
        'build:stage': {
          run: [
            ['webpack', { minify: '$1' }, ['$2']],
          ],
        },
      },
    };

    let argv, spawnedCommands;

    argv = argParser('build app');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['app']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(1);
    expect(spawnedCommands[0][1][0]).to.be('app');

    argv = argParser('build:prod app thing');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['app', 'thing']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(2);
    expect(spawnedCommands[0][1][0]).to.be('app');
    expect(spawnedCommands[0][1][1]).to.be('thing');

    argv = argParser('build:stage app thing');
    spawnedCommands = runTasks(testConfig, argv);
    // ['webpack', ['thing', '--minify', 'app']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('webpack');
    expect(spawnedCommands[0][1]).to.have.length(3);
    expect(spawnedCommands[0][1][0]).to.be('thing');
    expect(spawnedCommands[0][1][1]).to.be('--minify');
    expect(spawnedCommands[0][1][2]).to.be('app');
  });

  it('Should construe scripts', function() {
    const testConfig = {
      scripts: {
        webpack: 'npx ./bundler/index.js',
      },
      tasks: {
        build: 'webpack $locale',
        'build:stage': {
          run: [
            ['webpack', { minify: '$locale' }, ['$country']],
          ],
        },
      },
    };

    let argv, spawnedCommands;

    argv = argParser('build --locale en');
    spawnedCommands = runTasks(testConfig, argv);
    // ['npx', ['./bundler/index.js', 'en']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('npx');
    expect(spawnedCommands[0][1]).to.have.length(2);
    expect(spawnedCommands[0][1][0]).to.be('./bundler/index.js');
    expect(spawnedCommands[0][1][1]).to.be('en');

    argv = argParser('build:stage --locale en --country England');
    spawnedCommands = runTasks(testConfig, argv);
    // ['npx', ['./bundler/index.js', 'England', '--minify', 'en']]
    expect(spawnedCommands[0]).to.have.length(2);
    expect(spawnedCommands[0][0]).to.be('npx');
    expect(spawnedCommands[0][1]).to.have.length(4);
    expect(spawnedCommands[0][1][0]).to.be('./bundler/index.js');
    expect(spawnedCommands[0][1][1]).to.be('England');
    expect(spawnedCommands[0][1][2]).to.be('--minify');
    expect(spawnedCommands[0][1][3]).to.be('en');
  });
});
