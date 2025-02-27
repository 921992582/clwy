'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Orders', [
      {
        outTradeNo: uuidv4().replace(/-/g, ''),
        userId: 2,
        subject: '长乐未央大会员（月付）',
        totalAmount: 10,
        paymentMethod: 0,
        status: 2,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        outTradeNo: uuidv4().replace(/-/g, ''),
        userId: 2,
        subject: '长乐未央大会员（年付）',
        totalAmount: 100,
        paymentMethod: 1,
        status: 0,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        outTradeNo: uuidv4().replace(/-/g, ''),
        userId: 5,
        subject: '长乐未央大会员（年付）',
        totalAmount: 100,
        paymentMethod: 0,
        status: 1,
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Orders', null, {});
  }
};
