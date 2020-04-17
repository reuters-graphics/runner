![](badge.svg)

# 🏃 runner ‍

A better way to organize npm scripts, with argument hoisting, env variable management and complex task chaining.

[![npm version](https://badge.fury.io/js/%40reuters-graphics%2Frunner.svg)](https://badge.fury.io/js/%40reuters-graphics%2Frunner) [![Reuters open source software](https://badgen.net/badge/Reuters/open%20source/?color=ff8000)](https://github.com/reuters-graphics/)

### Why this?

If you're like us, you've [broken up with task runners](https://www.freecodecamp.org/news/why-i-left-gulp-and-grunt-for-npm-scripts-3d6853dd22b8/) like Grunt and Gulp. Using plain node scripts helps us steer clear of plugin bottlenecks, but calling those scripts and chaining them together into complex tasks -- especially with CLI options -- can be a bit ugly to do in package.json.

runner gives us a more natural way to map out how our scripts are called and clearly define the arguments and environment they share. It makes our NPM scripts easier to read, keeps our individual task CLIs clean and helps us write better, friendlier task chains.

### What's it do?

runner uses a `tasks` key in your package.json (or a dedicated config file) to help orchestrate your NPM scripts. You can chain scripts into complex tasks and compose arguments passed down through your task's commands.

## Quickstart

1. Install.

  ```
  yarn global add @reuters-graphics/runner
  ```
  ... or ...

  ```
  npm install -g @reuters-graphics/runner
  ```

2. Configure tasks either directly in `package.json` or in a `.tasksrc.js` file in the root of your project.

  ```javascript
  {
    "tasks": {
      "build": { ... }
    }
  }
  ```

3. Call a task from the root of your project using runner's CLI.

  ```
  $ runner build
  ```

## Writing tasks

At its simplest, each key is a task you can call with runner.

```javascript
// .tasksrc.js
module.exports = {
  tasks: {
    // A task
    cat: {
      // An array of commands to run when a task is called.
      run: [
        ['echo', ['meow']],
      ],
    },
  },
}
```

Call the task with the CLI:

```bash
$ runner cat
# meow!
```

Commands can include positional and named arguments.

```javascript
module.exports = {
  tasks: {
    dev: {
      run: [
        ['webpack', ['index.js'], { config: './config.js', env: 'prod' }],
      ],
    },
  },
}
```

```bash
$ runner dev
# Calls:
#   webpack index.js --config ./config.js --env prod
```

You can refer arguments passed to the task in each command using a special notation, `$`.

```javascript
// .tasksrc.js
module.exports = {
  tasks: {
    dev: {
      run: [
        // $1: the index of the positional arg passed to the "dev" task
        // $env: named argument, --env, passed to the "dev" task
        ['webpack', ['$1'], { config: './config.js', env: '$env' }],
      ],
    },
  },
}
```

```bash
$ runner dev index.js --env prod
# Calls:
#   webpack index.js --config ./config.js --env prod
```

Add environment variables to the scope of your task.

```javascript
module.exports = {
  tasks: {
    build: {
      run: [
        ['webpack', ['$1'], { config: './config.js', env: 'prod' }],
      ],
      env: {
        NODE_ENV: 'production',
      },
    },
  },
}
```

Call scripts and other tasks to create complex task chains.

```javascript
// .tasksrc.js
module.exports = {
  scripts: {
    'img': 'npx ./bin/imgResizer.js',
    'aws': 'aws s3 sync ./dist/',
  },
  tasks: {
    build: {
      run: [
        ['img', { sizes: '$img' }],
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
}
```

```bash
$ runner publish s3://stagingBucket index.js  --img 600 --img 1200
# Calls:
#   npx ./bin/imgResizer.js --sizes 600 --sizes 1200
#   webpack index.js --config ./config.js --env prod
#   aws s3 sync ./dist/ s3://stagingBucket
```

## Writing inputs

If you're writing your tasks config in `.tasksrc.js` file, you can also define functions in an `inputs` key that can change or supply additional positional and named arguments to your task chains.

```javascript
module.exports = {
  tasks: {
    build: { /* ... */ },
    publish: {
      run: [
        'ask:locale',
        ['build', { locale: '$locale' }],
        // ...
      ],
    },
  },
  inputs: {
    'ask:locale': async({ args, kwargs }) => {
      const prompts = require('prompts');

      const { locale } = await prompts({
        type: 'select',
        name: 'locale',
        message: 'Which locale do you want to publish?',
        choices: [
          { title: 'English', value: 'en' },
          { title: 'Spanish', value: 'es' },
          { title: 'German', value: 'de' },
        ],
      });

      kwargs.locale = locale;
    },
  },
}
```

## Help tips

You can write tips to tell a user what commands are available and descriptions for what they do in a `help` key in your `.tasksrc.js` file.

```javascript
module.exports = {
  tasks: {
    build: { /* ... */ },
    publish: { /* ... */ },
    'img:resize': { /* ... */ },
  },
  help: {
    publish: 'Build and publish your project.',
    'img:resize': 'Create responsive image sets for srcset attrs.',
  },
}
```

Now when a user runs `$ runner` without a task, they'll see your tips.

## Testing

```
$ yarn build && yarn test
```
