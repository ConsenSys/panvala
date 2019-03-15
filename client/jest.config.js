module.exports = {
  // automatically unmount and cleanup DOM after the test is finished.
  setupFilesAfterEnv: ['react-testing-library/cleanup-after-each'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/_archive/'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$',
  transform: { '^.+\\.(ts|tsx)$': 'babel-jest' },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

// see: https://github.com/facebook/jest/issues/3094#issuecomment-385164816
// moduleNameMapper: {
//   '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
// },
// better: https://github.com/zeit/next-plugins/tree/master/packages/next-css#without-css-modules
// Note: CSS files can not be imported into your _document.js. You can use the _app.js instead or any other page.

// moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
// transformIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
// transform: { '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest' },
