const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");

const Order = db.define(
  "order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientChatID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    operatorChatID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isValidated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Order;
