module.exports = {
  // automatically unmount and cleanup DOM after the test is finished.
  setupFilesAfterEnv: ['react-testing-library/cleanup-after-each'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/_archive/'],
  testRegex: '(/__tests__/.*.test.ts|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$',
  transform: { '^.+\\.(ts|tsx)$': 'babel-jest' },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};
