const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");

const Operator = db.define(
  "operator",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    chatId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Operator;
