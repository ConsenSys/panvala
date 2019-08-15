const path = require('path');
const prettier = require('prettier');

const prettierConfig = path.resolve(__dirname, '../.prettierrc');

async function prettify(ugly) {
  return prettier.resolveConfig(prettierConfig).then((options) => {
    const json = JSON.stringify(ugly);
    // format w/ prettier
    return prettier.format(json, {
      ...options,
      parser: 'json',
    });
  });
}

module.exports = {
  prettify,
};
