'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      level: {
        allowNull: false,
        type: Sequelize.STRING(16)
      },
      message: {
        allowNull: false,
        type: Sequelize.STRING(2048)
      },
      meta: {
        allowNull: false,
        type: Sequelize.STRING(2048)
      },
      timestamp: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Logs');
  }
};
