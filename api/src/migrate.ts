import * as Umzug from 'umzug';
import * as path from 'path';
import { sequelize } from './models';

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
    path: path.resolve(`${__dirname}/migrations`),
    pattern: /\.js$/,
  },

  // logging: function() {
  //     console.log.apply(null, arguments);
  // },
});

function migrate() {
  return umzug.up();
}

export { migrate };
