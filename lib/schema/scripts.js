/* eslint-disable no-useless-escape */
const validCmd = '^[a-zA-Z][a-zA-Z0-9_:-]*[a-zA-Z0-9]$';
const validScriptWithArgs = '^[a-zA-Z]+[.\/\\s\\$a-zA-Z0-9=_-]*?[a-zA-Z0-9]$';
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
