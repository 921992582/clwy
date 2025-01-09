'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('GameGrades', [{

      gameId: 1,
      grade: 0,
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      gameId: 1,
      grade: 0,
      userId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
      {

        gameId: 2,
        grade: 0,
        userId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }, {
        gameId: 2,
        grade: 0,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GameGrades', null, {});
  }

};
