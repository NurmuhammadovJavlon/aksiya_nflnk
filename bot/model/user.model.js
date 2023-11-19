const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");
const Operator = require("./operator.model");

const User = db.define(
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
    },
    superAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isOperator: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    preferedLanguageCode: {
      type: DataTypes.STRING,
      defaultValue: "en",
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      defaultValue: "",
      allowNull: true,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

// User.hasOne(Client);
// User.hasOne(Client);
User.hasOne(Operator);
Operator.belongsTo(User);
module.exports = User;
