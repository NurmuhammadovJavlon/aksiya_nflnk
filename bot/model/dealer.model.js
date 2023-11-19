const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");
const Product = require("./products.model");
const Operator = require("./operator.model");
const Order = require("./order.model");

const Dealer = db.define(
  "dealer",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    name_uz: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name_ru: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: false,
  }
);

Dealer.hasMany(Product);
Dealer.hasMany(Operator);
Operator.belongsTo(Dealer);
Dealer.hasMany(Order, { onDelete: "CASCADE" });
Order.belongsTo(Dealer);

module.exports = Dealer;
