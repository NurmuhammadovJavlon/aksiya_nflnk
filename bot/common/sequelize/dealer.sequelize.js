const db = require("../../connection/db.connection");
const Dealer = require("../../model/dealer.model");
const Region = require("../../model/region.model");

// POST
exports.CreateDealer = async (name_uz, name_ru) => {
  try {
    const dealer = await Dealer.create({ name_uz, name_ru });
    return dealer.get({ plain: true });
  } catch (error) {
    console.log(error);
  }
};
exports.DeleteDealer = async (id) => {
  try {
    await Dealer.destroy({ where: { id } });
  } catch (error) {
    console.log(error);
  }
};
exports.ArchiveDealer = async (id, isArchived) => {
  try {
    const dealer = await Dealer.update(
      { isArchived },
      {
        where: { id },
        raw: true,
      }
    );

    return dealer;
  } catch (error) {
    console.log(error);
  }
};

exports.UpdateDealer = async (id, name_uz, name_ru) => {
  try {
    const dealer = await Dealer.update({ name_uz, name_ru }, { where: { id } });
    return dealer;
  } catch (error) {
    console.log(error);
  }
};

// GET

exports.GetDealersByRegionId = async (regionId, page, itemsPerPage) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const { rows: items, count: totalItems } = await Dealer.findAndCountAll({
      where: {
        regionId,
      },
      raw: true,
      offset,
      limit,
    });

    return { items, totalItems };
  } catch (error) {
    console.log(error);
  }
};

exports.GetDealerById = async (id) => {
  try {
    const dealer = await Dealer.findOne({ where: { id }, raw: true });
    return dealer;
  } catch (error) {
    console.log(error);
  }
};

exports.GetDealersWithPagination = async (page, itemsPerPage) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const { rows: items, count: totalItems } = await Dealer.findAndCountAll({
      raw: true,
      offset,
      limit,
    });

    return { items, totalItems };
  } catch (error) {
    console.log(error);
  }
};
