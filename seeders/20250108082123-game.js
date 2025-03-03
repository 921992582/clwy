'use strict';
const { Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const games = [
      {
        name: '幻彩方格',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '方体消除',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const game of games) {
      const existingGame = await queryInterface.rawSelect('Games', {
        where: {
          name: game.name
        }
      }, ['id']);

      if (!existingGame) {
        await queryInterface.insert('Games', game);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Games', null, {});
  }
};