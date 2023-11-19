const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");

const EskizToken = db.define(
  "eskizToken",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expirationTime: {
      type: DataTypes.DATE,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = EskizToken;
