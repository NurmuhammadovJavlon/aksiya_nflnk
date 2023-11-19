const { DataTypes } = require("sequelize");
const db = require("../connection/db.connection");

const Product = db.define(
  "product",
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
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_publicId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    caption_uz: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    caption_ru: {
      type: DataTypes.TEXT,
      allowNull: true,
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

module.exports = Product;
