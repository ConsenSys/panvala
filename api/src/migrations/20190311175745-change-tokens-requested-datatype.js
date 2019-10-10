'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Proposals', 'tokensRequested', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: (queryInterface, Sequelize) => {
    // SEE: https://stackoverflow.com/questions/13170570/change-type-of-varchar-field-to-integer-cannot-be-cast-automatically-to-type-i
    return queryInterface.sequelize.query(
      'ALTER TABLE "Proposals" ALTER COLUMN "tokensRequested" TYPE integer USING (trim("tokensRequested")::integer);'
    );
  },
};
