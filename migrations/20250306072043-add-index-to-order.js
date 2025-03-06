'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('Orders', ['status', 'createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Orders', ['status', 'createdAt']);
  },
};
