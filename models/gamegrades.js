'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GameGrade extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.GameGrade.belongsTo(models.Game, {foreignKey: 'gameId'})
      models.GameGrade.belongsTo(models.GameUser, {foreignKey: 'userId'})
    }
  }

  GameGrade.init({
    gameId: DataTypes.INTEGER,
    grade: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        notNull: {msg: '成绩必须填写。'},
        notEmpty: {msg: "成绩不能为空"},
      },
    },
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'GameGrade',
  });
  return GameGrade;
};