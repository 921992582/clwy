'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'openid', {
      type: Sequelize.STRING,
    });

    await queryInterface.addIndex('Users', ['openid']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'openid');
  }
};
