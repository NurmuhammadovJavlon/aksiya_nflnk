const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");

module.exports = db.define(
  "user",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    chatID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    superAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    isConfirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    preferedLanguageCode: {
      type: DataTypes.STRING,
      defaultValue: "en",
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);
