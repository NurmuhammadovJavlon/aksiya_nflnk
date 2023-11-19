const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");
const Order = require("./order.model");
const User = require("./user.model");

const Client = db.define(
  "client",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numberOfEmployees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isConfirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "PENDING",
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

// Client.hasMany(Order);
Client.belongsTo(User);

module.exports = Client;
