'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'membershipMonths', {
      allowNull: false,
      defaultValue: 1,
      type: Sequelize.INTEGER.UNSIGNED,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'membershipMonths');
  },
};
