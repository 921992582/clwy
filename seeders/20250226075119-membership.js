'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Memberships', [
      {
        name: '长乐未央大会员（月付）',
        durationMonths: 1,
        price: 10,
        rank: 1,
        description: '超值之选！',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '长乐未央大会员（年付）',
        durationMonths: 12,
        price: 100,
        rank: 2,
        description: '已优惠 <span class="red"><strong>20元</strong></span>',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Memberships', null, {});
  }
};
