'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Categories', [
      { name: '前端开发', rank: 1, createdAt: new Date(), updatedAt: new Date() },
      { name: '后端开发', rank: 2, createdAt: new Date(), updatedAt: new Date() },
      { name: '移动端开发', rank: 3, createdAt: new Date(), updatedAt: new Date() },
      { name: '数据库', rank: 4, createdAt: new Date(), updatedAt: new Date() },
      { name: '服务器运维', rank: 5, createdAt: new Date(), updatedAt: new Date() },
      { name: '公共', rank: 6, createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
