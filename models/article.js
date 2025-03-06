'use strict';
const { Model } = require('sequelize');
const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  Article.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: '标题必须存在。',
          },
          notEmpty: {
            msg: '标题不能为空。',
          },
          len: {
            args: [2, 45],
            msg: '标题长度需要在2 ~ 45个字符之间。',
          },
        },
      },

      deletedAt: {
        type: DataTypes.DATE,
      },
      content: DataTypes.TEXT,
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
      paranoid: true,
      modelName: 'Article',
    }
  );
  return Article;
};
