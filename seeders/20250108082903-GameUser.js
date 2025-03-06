'use strict';
const { Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const gameUsers = [
      {
        id: 1,
        name: '测试1',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: '测试2',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const user of gameUsers) {
      const existingUser = await queryInterface.rawSelect(
        'GameUsers',
        {
          where: {
            id: user.id,
          },
        },
        ['id']
      );

      if (!existingUser) {
        await queryInterface.insert('GameUsers', user);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GameUsers', null, {});
  },
};
