/* eslint-disable no-useless-escape */
const validCmd = '^[a-zA-Z][a-zA-Z0-9_:-]*[a-zA-Z0-9]$';
const validScriptWithArgs = '^[a-zA-Z]+.*$';
/* eslint-enable no-useless-escape */

export default {
  type: 'object',
  additionalProperties: false,
  patternProperties: {
    [validCmd]: {
      type: 'string',
      pattern: validScriptWithArgs,
    },
  },
};
