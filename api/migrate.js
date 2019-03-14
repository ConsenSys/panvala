const Umzug = require('umzug');
const { sequelize } = require('./models');

const umzug = new Umzug({
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize,
  },

  // see: https://github.com/sequelize/umzug/issues/17
  migrations: {
    params: [
      sequelize.getQueryInterface(), // queryInterface
      sequelize.constructor, // DataTypes
      function() {
        throw new Error(
          'Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.'
        );
      },
    ],
    path: './migrations',
    pattern: /\.js$/,
  },

  // logging: function() {
  //     console.log.apply(null, arguments);
  // },
});

function migrate() {
  return umzug.up();
}

module.exports = {
  migrate,
};
