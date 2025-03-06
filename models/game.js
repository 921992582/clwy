'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Game.belongsToMany(models.GameUser, {
        through: models.GameGrade,
        foreignKey: 'gameId',
        as: 'GameGradesGame',
      });
    }
  }

  Game.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: '游戏名称必须填写。' },
          notEmpty: { msg: '游戏名称不能为空。' },
        },
      },
    },
    {
      sequelize,
      modelName: 'Game',
    }
  );
  return Game;
};
