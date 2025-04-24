export default {
  testEnvironment: 'node',
  transform: {}, // no babel
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1' // allow .js extension in imports
  }
};
