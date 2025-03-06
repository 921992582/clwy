'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GameUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.GameUser.belongsToMany(models.Game, {
        through: models.GameGrade,
        foreignKey: 'userId',
        as: 'GameGradesUser',
      });
    }
  }

  GameUser.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '用户名必须填写。' },
          notEmpty: { msg: '用户名不能为空。' },
        },
      },
      avatar: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'GameUser',
    }
  );
  return GameUser;
};
