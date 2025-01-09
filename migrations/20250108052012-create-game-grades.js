'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GameGrades', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      gameId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      grade: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.FLOAT,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addIndex('GameGrades', {
      fields: ['gameId'],
    })
    await queryInterface.addIndex('GameGrades', {
      fields: ['userId'],
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GameGrades');
  }
};