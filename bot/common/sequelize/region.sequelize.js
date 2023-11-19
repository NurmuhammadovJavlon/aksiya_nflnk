const Region = require("../../model/region.model");

// POST
exports.CreateRegion = async (name_uz, name_ru) => {
  try {
    const textAfterSaving = `Region saved successfully`;
    //   const textAfterUpdating = `Region updated successfully`;
    const textUserExists = `Region exists already`;

    const region = await Region.findOne({
      where: {
        name_uz,
      },
    });

    if (!region) {
      await Region.create({ name_uz, name_ru });
      return textAfterSaving;
    }

    return textUserExists;
  } catch (error) {
    console.log(error);
  }
};

// GET
exports.GetRegionByID = async (id) => {
  try {
    const region = await Region.findOne({
      where: { id },
      raw: true,
    });

    if (!region) return null;
    return region;
  } catch (error) {
    console.log(error);
  }
};

exports.GetAllRegions = async () => {
  try {
    const regions = await Region.findAll({
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    return regions;
  } catch (error) {
    console.log(error);
  }
};

exports.GetAllRegionsWithDealers = async () => {
  try {
    const regions = await Region.findAll({
      order: [["createdAt", "DESC"]],
      raw: true,
      include: [
        {
          model: Dealer,
          as: "dealers", // This should match the alias you defined in the Region model for the association
        },
      ],
    });

    return regions;
  } catch (error) {
    console.log(error);
  }
};

exports.getRegionsWithPagination = async (page, itemsPerPage) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const { rows: items, count: totalItems } = await Region.findAndCountAll({
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      raw: true,
    });

    return { items, totalItems };
  } catch (error) {
    console.log(error);
  }
};

// Update
exports.DeleteRegion = async (id) => {
  try {
    const region = await Region.destroy({
      where: { id },
      raw: true,
    });

    return region;
  } catch (error) {
    console.log(error);
  }
};

exports.ArchiveRegion = async (id, isArchived) => {
  try {
    const region = await Region.update(
      { isArchived },
      {
        where: { id },
        raw: true,
      }
    );

    return region;
  } catch (error) {
    console.log(error);
  }
};

exports.UpdateRegionNames = async (name_uz, name_ru, id) => {
  try {
    const region = await Region.update(
      { name_uz, name_ru },
      { where: { id }, raw: true }
    );
    return region;
  } catch (error) {
    console.log(error);
  }
};
