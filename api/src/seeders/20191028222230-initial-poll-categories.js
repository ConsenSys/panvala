'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      'FundingCategories',
      [
        { id: 1, displayName: 'Ethereum 2.0', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, displayName: 'Layer 2 Scaling', createdAt: new Date(), updatedAt: new Date() },
        { id: 3, displayName: 'Security', createdAt: new Date(), updatedAt: new Date() },
        {
          id: 4,
          displayName: 'Developer Tools and Growth',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { id: 5, displayName: 'Dapps and Usability', createdAt: new Date(), updatedAt: new Date() },
        { id: 6, displayName: 'Panvala', createdAt: new Date(), updatedAt: new Date() },
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('FundingCategories', null, {});
  },
};
