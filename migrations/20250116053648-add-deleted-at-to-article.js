'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Articles', 'deletedAt', {
      type: Sequelize.DATE,
    });

    await queryInterface.addIndex('Articles', {
      fields: ['deletedAt'],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Articles', 'deletedAt');
  },
};
