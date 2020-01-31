/* eslint-disable no-useless-escape */
const validCmd = '^[a-zA-Z][a-zA-Z0-9_:-]*[a-zA-Z0-9]$';
const validCmdWArgs = '^[a-zA-Z][a-zA-Z0-9_:-\\s\\$]*?[a-zA-Z0-9]$';
const validArgName = '^[a-zA-Z_]+[a-zA-Z0-9_]*$';
const validArgValue = '^\\$*\\S+$';
/* eslint-enable no-useless-escape */

const keyOrPositionalArg = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      patternProperties: {
        [validArgName]: {
          oneOf: [
            {
              type: 'string',
              pattern: validArgValue,
            },
            {
              type: 'boolean',
            },
          ],
        },
      },
    },
    {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        pattern: validArgValue,
      },
    },
  ],
};

export default {
  oneOf: [
    // run: 'webpack'
    {
      type: 'string',
      pattern: validCmdWArgs,
    },
    {
      type: 'array',
      minItems: 1,
      items: {
        oneOf: [
          // run: ['webpack']
          {
            type: 'string',
            pattern: validCmdWArgs,
          },
          {
            type: 'array',
            minItems: 1,
            items: [
              // run: [
              //   ['webpack'],
              //   ['webpack', { env: true }]
              // ]
              {
                type: 'string',
                pattern: validCmd,
              },
              keyOrPositionalArg,
              keyOrPositionalArg,
            ],
          },
        ],
      },
    },
  ],
};