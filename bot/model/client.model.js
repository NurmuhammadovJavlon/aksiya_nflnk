const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");

module.exports = db.define(
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
  },
  {
    timestamps: false,
  }
);
