![](badge.svg)

# 🏃 runner ‍

A better way to organize npm scripts, with argument hoisting, env variable management and complex task chaining.

[![Reuters open source software](https://badgen.net/badge/Reuters/open%20source/?color=ff8000)](https://github.com/reuters-graphics/)

### Why this?

If you're like us, you've kicked the can on task runners. Using plain node scripts helps us stay clear of the plugin bottleneck of build systems like Gulp and Grunt. But calling those scripts and chaining them together into complex tasks -- especially with any configuration options -- can be a bit ugly to do in npm-scripts.

runner gives us a more natural way to express how our scripts are called and represent the arguments and environment they share. Basically, it makes our npm-scripts easier to read, which helps us write better, friendlier task chains.

### What's it do?

runner uses a `tasks` key in your package.json (or a dedicated config file) to help orchestrate your npm-scripts. You can chain scripts into complex tasks and compose arguments passed down through your task's commands.

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
  }
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

## Testing

```
$ yarn build && yarn test
```
