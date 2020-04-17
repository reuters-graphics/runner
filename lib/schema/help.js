
export default {
  type: 'object',
  additionalProperties: false,
  patternProperties: {
    '.*': {
      type: 'string',
    },
  },
};
