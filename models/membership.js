'use strict';
const { Model } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  class Membership extends Model {
    static associate(models) {}
  }

  Membership.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '名称必须填写。' },
          notEmpty: { msg: '名称不能为空。' },
          len: { args: [2, 45], msg: '名称长度必须是2 ~ 45之间。' },
        },
      },
      durationMonths: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: '会员时长必须填写。' },
          notEmpty: { msg: '会员时长不能为空。' },
          isInt: { msg: '会员时长必须为整数。' },
          isPositive(value) {
            if (value <= 0) {
              throw new Error('会员时长必须大于1。');
            }
          },
        },
      },
      price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        validate: {
          notNull: { msg: '价格必须填写。' },
          notEmpty: { msg: '价格不能为空。' },
          isNumeric: { msg: '价格必须为数字。' },
          isPositive(value) {
            if (value <= 0) {
              throw new Error('价格必须大于0。');
            }
          },
        },
      },
      rank: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: '排序必须填写。' },
          notEmpty: { msg: '排序不能为空。' },
          isInt: { msg: '排序必须为整数。' },
          isPositive(value) {
            if (value <= 0) {
              throw new Error('排序必须是正整数。');
            }
          },
        },
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: { args: [0, 255], msg: '描述信息不能超过 255 位字符。' },
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        get() {
          return moment(this.getDataValue('createdAt')).format('LL');
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          return moment(this.getDataValue('updatedAt')).format('LL');
        },
      },
    },
    {
      sequelize,
      modelName: 'Membership',
    }
  );
  return Membership;
};
