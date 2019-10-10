// if (process.env.NODE_ENV !== 'production') {
//   require('now-env');
// }

const Sequelize = require('sequelize');

module.exports = {
  development: {
    username: 'panvala_devel',
    password: 'panvala',
    database: 'panvala_api',
    host: '127.0.0.1',
    port: 5432,
    dialect: 'postgres',
  },
  docker: {
    username: 'panvala_devel',
    password: process.env.DB_PASSWORD,
    database: 'panvala_api',
    host: process.env.DB_HOST,
    port: 5432,
    dialect: 'postgres',
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
  },
  production: {
    username: process.env.PRODUCTION_USERNAME,
    password: process.env.PRODUCTION_PASSWORD,
    database: process.env.PRODUCTION_DATABASE,
    host: process.env.PRODUCTION_HOST,
    port: process.env.PRODUCTION_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: true,
    },
  },
  session: {
    secret: process.env.PRODUCTION_SECRET || 'placeholdersecret',
  },
};
