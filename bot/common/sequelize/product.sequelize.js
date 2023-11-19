const Product = require("../../model/products.model");
const cloudinary = require("../../connection/cloudinary.connection");

// POST
exports.CreateProduct = async (
  name_uz,
  name_ru,
  image,
  image_publicId,
  dealerId,
  caption_uz,
  caption_ru
) => {
  try {
    const product = await Product.create({
      name_uz,
      name_ru,
      image,
      image_publicId,
      dealerId,
      caption_uz,
      caption_ru,
    });
    return product.get({ plain: true });
  } catch (error) {
    console.log(error);
  }
};

exports.DeleteProduct = async (id) => {
  try {
    const product = await Product.findOne({ where: { id } });
    await cloudinary.v2.uploader.destroy(product?.image_publicId);
    await Product.destroy({ where: { id } });
  } catch (error) {
    console.log(error);
  }
};

exports.ArchiveProduct = async (id, isArchived) => {
  try {
    const product = await Product.update(
      { isArchived },
      {
        where: { id },
        raw: true,
      }
    );

    return product;
  } catch (error) {
    console.log(error);
  }
};

// GET

exports.GetProducts = async (page, itemsPerPage) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const { rows: items, count: totalItems } = await Product.findAndCountAll({
      raw: true,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    return { items, totalItems };
  } catch (error) {
    console.log(error);
  }
};

exports.GetProductsByDealerId = async (dealerId, page, itemsPerPage) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const { rows: items, count: totalItems } = await Product.findAndCountAll({
      where: {
        dealerId,
      },
      raw: true,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    return { items, totalItems };
  } catch (error) {
    console.log(error);
  }
};

exports.GetProductById = async (productId) => {
  try {
    const product = await Product.findOne({
      where: {
        id: productId,
      },
      raw: true,
    });

    return product;
  } catch (error) {
    console.log(error);
  }
};
