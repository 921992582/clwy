'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('GameUsers', [{
      id: 1,
      name: '测试1',
      avatar: "",
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: 2,
      name: '测试2',
      avatar: "",
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GameUsers', null, {});
  }

};
