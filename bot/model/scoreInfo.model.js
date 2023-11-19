const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");

const ScoreInfo = db.define(
  "scoreInfo",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    text_uz: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    text_ru: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = ScoreInfo;
