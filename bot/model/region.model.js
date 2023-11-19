const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");
const Dealer = require("./dealer.model");

const Region = db.define(
  "region",
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
      unique: true,
    },
    name_ru: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

Region.hasMany(Dealer, { onDelete: "CASCADE" });
module.exports = Region;
