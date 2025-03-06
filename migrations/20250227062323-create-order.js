'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      outTradeNo: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      tradeNo: {
        type: Sequelize.STRING,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      subject: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      totalAmount: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2).UNSIGNED,
      },
      paymentMethod: {
        type: Sequelize.TINYINT.UNSIGNED,
      },
      status: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.INTEGER(1).UNSIGNED,
      },
      paidAt: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('Orders', {
      fields: ['outTradeNo'],
      unique: true, // 唯一索引
    });
    await queryInterface.addIndex('Orders', {
      fields: ['tradeNo'],
      unique: true, // 唯一索引
    });
    await queryInterface.addIndex('Orders', {
      fields: ['userId'], // 普通索引
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  },
};
