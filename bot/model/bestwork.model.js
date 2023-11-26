const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");
const User = require("./user.model");

const BestWork = db.define(
  "bestwork",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    clientChatID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    operatorChatID: {
      type: DataTypes.STRING,
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
BestWork.belongsTo(User);

module.exports = BestWork;
