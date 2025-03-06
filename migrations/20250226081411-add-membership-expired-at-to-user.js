'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'membershipExpiredAt', {
      type: Sequelize.DATE,
    });

    await queryInterface.addIndex('Users', {
      fields: ['membershipExpiredAt'],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'membershipExpiredAt');
  },
};
