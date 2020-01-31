/* eslint-disable no-useless-escape */
const validEnv = '^[a-zA-Z]+[a-zA-Z_]*[a-zA-Z]+$';
/* eslint-enable no-useless-escape */

export default {
  type: 'object',
  additionalProperties: false,
  patternProperties: {
    [validEnv]: {
      type: 'string',
    },
  },
};
