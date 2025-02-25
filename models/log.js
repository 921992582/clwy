'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Log extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Log.init({
    level: DataTypes.STRING,
    message: DataTypes.STRING,
    meta: {
      type: DataTypes.STRING,
      get() {
        return JSON.parse(this.getDataValue("meta"));
      }
    },
    timestamp: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Log',
    timestamps: false, // 没有 createdAt 与 updatedAt
  });
  return Log;
};
