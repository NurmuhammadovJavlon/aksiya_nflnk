const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");

const BestWorkInfo = db.define(
  "bestWorkInfo",
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
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = BestWorkInfo;
