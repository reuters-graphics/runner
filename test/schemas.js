const { expect } = require('chai');
const Ajv = require('ajv');
const schema = require('../dist/schema');

describe('Test schemas', function() {
  const ajv = new Ajv();
  it('Should validate scripts', function() {
    const config = {
      scripts: {
        webpack: 'webpack',
        'npx:cmd': 'npx ./with/path.js',
        args: 'webpack --minify',
        env_vars: 'webpack $NODE_ENV',
        all: 'npx ./with/path.js --minify $NODE_ENV',
      },
      tasks: {},
    };

    const valid = ajv.validate(schema, config);
    if (!valid) console.log(ajv.errors);
    expect(valid).to.be.true;
  });

  it('Should validate short tasks', function() {
    const config = {
      scripts: {},
      tasks: {
        build: 'webpack',
        'build:prod': 'webpack --minify $NODE_ENV',
      },
    };

    const valid = ajv.validate(schema, config);
    if (!valid) console.log(ajv.errors);
    expect(valid).to.be.true;
  });

  it('Should validate task env', function() {
    const config = {
      scripts: {},
      tasks: {
        build: {
          env: {
            ENV: 'development whatever',
            NODE_ENV: 'production',
          },
          run: ['webpack'],
        },
      },
    };

    const valid = ajv.validate(schema, config);
    if (!valid) console.log(ajv.errors);
    expect(valid).to.be.true;
  });

  it('Should validate task run string', function() {
    const config = {
      scripts: {},
      tasks: {
        build: {
          run: [
            'webpack',
            'webpack --minify',
            'webpack --minify $NODE_ENV',
          ],
        },
        'build:dev': {
          run: 'webpack',
        },
      },
    };

    const valid = ajv.validate(schema, config);
    if (!valid) console.log(ajv.errors);
    expect(valid).to.be.true;
  });

  it('Should validate task run construed', function() {
    const config = {
      scripts: {},
      tasks: {
        build: {
          run: [
            ['webpack'],
            ['webpack', { minify: true }],
            ['webpack', { minify: '$ENV' }],
            ['webpack', ['$locale']],
            ['webpack', ['thing', '$locale'], { minify: true, locale: '$1' }],
            ['webpack', {
              minify: true,
              locale: '$1',
              anArray: [100, 200, 300],
            }, ['thing', '$locale']],
            ['webpack', ['"quoted value"'], { arg: '\'quoted value $@#@!#%@\'' }],
          ],
        },
      },
    };

    const valid = ajv.validate(schema, config);
    if (!valid) console.log(ajv.errors);
    expect(valid).to.be.true;
  });

  it('Should not validate task run mixed construed', function() {
    const config = {
      scripts: {},
      tasks: {
        build: {
          run: [
            ['webpack --minify'],
          ],
        },
      },
    };

    const valid = ajv.validate(schema, config);
    expect(valid).to.be.false;
  });
});
