const Product = require("../../model/products.model");
const cloudinary = require("../../connection/cloudinary.connection");
const Dealer = require("../../model/dealer.model");

// POST
exports.CreateProduct = async (
  name_uz,
  name_ru,
  image,
  image_publicId,
  dealerIds,
  caption_uz,
  caption_ru
) => {
  try {
    const product = await Product.create({
      name_uz,
      name_ru,
      image,
      image_publicId,
      caption_uz,
      caption_ru,
    });
    await product.setDealers(dealerIds);
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

exports.UpdateProduct = async (
  id,
  name_uz,
  name_ru,
  image,
  image_publicId,
  caption_uz,
  caption_ru,
  dealerIds
) => {
  try {
    await Product.update(
      { name_uz, name_ru, image, image_publicId, caption_uz, caption_ru },
      {
        where: { id },
      }
    );

    // Retrieve the updated product
    const updatedProduct = await Product.findByPk(id);

    // Assuming you have a 'Dealers' association defined in your Product model
    await updatedProduct.removeDealers();
    await updatedProduct.setDealers(dealerIds);
    return updatedProduct;
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

    // Find the dealer by ID
    const dealer = await Dealer.findByPk(dealerId);

    // Check if the dealer exists
    if (!dealer) {
      return { items: [], totalItems: 0 };
    }

    // Retrieve associated products with pagination
    const products = await dealer.getProducts({
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    // Extract items and totalItems from the returned array
    const items = products.map((product) => product.get());
    const totalItems = await dealer.countProducts();

    return { items, totalItems };
  } catch (error) {
    console.error(error);
    throw error;
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

exports.GetDealersByProduct = async (id) => {
  try {
    const product = await Product.findByPk(id);
    // Retrieve all associated dealers for the product
    const allAssociatedDealers = await product.getDealers({ raw: true });
    return allAssociatedDealers;
  } catch (error) {
    console.log(error);
  }
};
