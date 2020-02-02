const { expect } = require('chai');
const argParser = require('yargs-parser');
const Runner = require('../dist');

describe('Test commands', function() {
  it('Should construe simple tasks', async function() {
    const testConfig = {
      scripts: {
        bundler: 'webpack',
        resizer: 'npx ./bin/resizer.js',
      },
      tasks: {
        build: 'bundler --config ./webpack.conf.js',
        'build:prod': 'webpack --config ./webpack.conf.js --minify',
        'process:img': {
          run: [
            ['resizer', { sizes: [200, 300, 400] }],
          ],
        },
      },
      inputs: {},
    };

    let runner, argv, spawnedCommands;

    argv = argParser('build');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['webpack', '--config', './webpack.conf.js']],
    ]);

    argv = argParser('build:prod');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['webpack', ['--config', './webpack.conf.js', '--minify']],
    ]);

    argv = argParser('process:img');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./bin/resizer.js', '--sizes', '200', '--sizes', '300', '--sizes', '400']],
    ]);
  });

  it('Should hoist env', async function() {
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
      inputs: {},
    };

    let runner, argv, spawnedCommands;

    argv = argParser('build');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['webpack', 'production']],
    ]);

    argv = argParser('build:prod');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['webpack', '--minify', 'production']],
    ]);
  });

  it('Should hoist positional args', async function() {
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
      inputs: {},
    };

    let runner, argv, spawnedCommands;

    argv = argParser('build app');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['webpack', 'app']],
    ]);

    argv = argParser('build:prod app thing');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['webpack', 'app', 'thing']],
    ]);

    argv = argParser('build:stage app thing');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['webpack', 'thing', '--minify', 'app']],
    ]);
  });

  it('Should hoist keyword args', async function() {
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
      inputs: {},
    };

    let runner, argv, spawnedCommands;

    argv = argParser('build --locale en');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['bundler', 'en']],
    ]);

    argv = argParser('build:prod --locale en --country England');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['bundler', 'en', 'England']],
    ]);

    argv = argParser('build:stage --locale en --country England');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['bundler', 'England', '--minify', 'en']],
    ]);
  });

  it('Should construe scripts', async function() {
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
      inputs: {},
    };

    let runner, argv, spawnedCommands;

    argv = argParser('build --locale en');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./bundler/index.js', 'en']],
    ]);

    argv = argParser('build:stage --locale en --country England');
    runner = new Runner(testConfig, argv);
    spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./bundler/index.js', 'England', '--minify', 'en']],
    ]);
  });

  it('Should also run other tasks', async function() {
    const testConfig = {
      scripts: {
        webpack: 'npx ./bundler/index.js',
        s3: 'aws s3',
        img: 'npx ./resize.js --format=jpg',
      },
      tasks: {
        build: 'webpack $locale',
        publish: {
          run: [
            'build',
            ['img', { size: '$imgsize' }],
            ['s3', ['sync'], { include: '$1' }],
          ],
        },
      },
      inputs: {},
    };

    const argv = argParser('publish "*.html" --locale en --imgsize 600 --imgsize 1200');
    const runner = new Runner(testConfig, argv);
    const spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./bundler/index.js', 'en']],
      ['npx', ['./resize.js', '--format', 'jpg', '--size', '600', '--size', '1200']],
      ['npx', ['aws', 's3', 'sync', '--include', '"*.html"']],
    ]);
  });

  it('Should be able to override arguments in sub-tasks', async function() {
    const testConfig = {
      scripts: {
        img: 'npx ./resize.js',
        aws: 'aws s3 sync ./dist/',
      },
      tasks: {
        build: {
          run: [
            ['img', { size: '$img' }],
            ['webpack', ['$1'], { config: './config.js', env: 'prod' }],
          ],
        },
        publish: {
          run: [
            ['build', ['$2']], // 2nd positional passed as 1st to "build"
            ['aws', ['$1']],
          ],
        },
      },
      inputs: {},
    };

    const argv = argParser('publish s3://stagingBucket index.js  --img 600 --img 1200');
    const runner = new Runner(testConfig, argv);
    const spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./resize.js', '--size', '600', '--size', '1200']],
      ['webpack', ['index.js', '--config', './config.js', '--env', 'prod']],
      ['npx', ['aws', 's3', 'sync', './dist/', 's3://stagingBucket']],
    ]);
  });

  it('Should use inputs to change args/kwargs', async function() {
    const testConfig = {
      scripts: {
        img: 'npx ./resize.js',
        aws: 'aws s3 sync ./dist/',
      },
      tasks: {
        build: {
          run: [
            'ask:sizes',
            ['img', { size: '$img' }],
            ['webpack', ['$1'], { config: './config.js', env: 'prod', locale: '$locale' }],
          ],
        },
        publish: {
          run: [
            'ask:locale',
            ['build', ['$2'], { locale: '$locale' }],
            ['aws', ['$1']],
          ],
        },
      },
      inputs: {
        'ask:locale': async({ kwargs }) => {
          const prompts = require('prompts');
          prompts.inject(['de']);
          const { locale } = await prompts({
            type: 'text',
            name: 'locale',
            message: 'Which locale should we build?',
          });

          kwargs.locale = locale;
        },
        'ask:sizes': async({ kwargs }) => {
          const prompts = require('prompts');
          prompts.inject([['500', '800']]);
          const { sizes } = await prompts({
            type: 'list',
            name: 'sizes',
            message: 'Enter sizes of images',
            initial: '',
            separator: ',',
          });
          kwargs.img = sizes;
        },
      },
    };

    const argv = argParser('publish s3://stagingBucket index.js');
    const runner = new Runner(testConfig, argv);
    const spawnedCommands = await runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./resize.js', '--size', '500', '--size', '800']],
      ['webpack', ['index.js', '--config', './config.js', '--env', 'prod', '--locale', 'de']],
      ['npx', ['aws', 's3', 'sync', './dist/', 's3://stagingBucket']],
    ]);
  });
});
