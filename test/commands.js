const { expect } = require('chai');
const argParser = require('yargs-parser');
const Runner = require('../dist');

describe('Test commands', function() {
  it('Should construe simple tasks', function() {
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
    };

    let runner, argv, spawnedCommands;

    argv = argParser('build');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['webpack', ['--config', './webpack.conf.js']],
    ]);

    argv = argParser('build:prod');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['webpack', ['--config', './webpack.conf.js', '--minify']],
    ]);

    argv = argParser('process:img');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./bin/resizer.js', '--sizes', '200', '--sizes', '300', '--sizes', '400']],
    ]);
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

    let runner, argv, spawnedCommands;

    argv = argParser('build');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['webpack', ['production']],
    ]);

    argv = argParser('build:prod');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['webpack', ['--minify', 'production']],
    ]);
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

    let runner, argv, spawnedCommands;

    argv = argParser('build app');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['webpack', ['app']],
    ]);

    argv = argParser('build:prod app thing');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['webpack', ['app', 'thing']],
    ]);

    argv = argParser('build:stage app thing');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['webpack', ['thing', '--minify', 'app']],
    ]);
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

    let runner, argv, spawnedCommands;

    argv = argParser('build --locale en');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['bundler', ['en']],
    ]);

    argv = argParser('build:prod --locale en --country England');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['bundler', ['en', 'England']],
    ]);

    argv = argParser('build:stage --locale en --country England');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['bundler', ['England', '--minify', 'en']],
    ]);
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

    let runner, argv, spawnedCommands;

    argv = argParser('build --locale en');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./bundler/index.js', 'en']],
    ]);

    argv = argParser('build:stage --locale en --country England');
    runner = new Runner(testConfig, argv);
    spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./bundler/index.js', 'England', '--minify', 'en']],
    ]);
  });

  it('Should also run other tasks', function() {
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
    };

    const argv = argParser('publish "*.html" --locale en --imgsize 600 --imgsize 1200');
    const runner = new Runner(testConfig, argv);
    const spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./bundler/index.js', 'en']],
      ['npx', ['./resize.js', '--format', 'jpg', '--size', '600', '--size', '1200']],
      ['aws', ['s3', 'sync', '--include', '"*.html"']],
    ]);
  });

  it('Should be able to override arguments in sub-tasks', function() {
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
    };

    const argv = argParser('publish s3://stagingBucket index.js  --img 600 --img 1200');
    const runner = new Runner(testConfig, argv);
    const spawnedCommands = runner.runTasks();
    expect(spawnedCommands).to.deep.equal([
      ['npx', ['./resize.js', '--size', '600', '--size', '1200']],
      ['webpack', ['index.js', '--config', './config.js', '--env', 'prod']],
      ['aws', ['s3', 'sync', './dist/', 's3://stagingBucket']],
    ]);
  });
});
