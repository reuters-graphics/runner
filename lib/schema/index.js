import envSchema from './env';
import helpSchema from './help';
import runSchema from './run';
import scriptsSchema from './scripts';

/* eslint-disable no-useless-escape */
const validCmd = '^[a-zA-Z][a-zA-Z0-9_:-]*[a-zA-Z0-9]$';
const validCmdWArgs = '^[a-zA-Z][a-zA-Z0-9_:-\\s\\$]*?[a-zA-Z0-9]$';
/* eslint-enable no-useless-escape */

export default {
  type: 'object',
  required: ['inputs', 'scripts', 'help', 'tasks'],
  properties: {
    inputs: { type: 'object' },
    scripts: scriptsSchema,
    help: helpSchema,
    tasks: {
      type: 'object',
      additionalProperties: false,
      patternProperties: {
        [validCmd]: {
          oneOf: [
            {
              type: 'string',
              pattern: validCmdWArgs,
            },
            {
              type: 'object',
              required: ['run'],
              properties: {
                env: envSchema,
                run: runSchema,
              },
            },
          ],
        },
      },
    },
  },
};
