const BestWorkInfo = require("../../model/bestWorkInfo.model");

exports.CreateBestWorkText = async (text_uz, text_ru) => {
  try {
    const bestWorkInfo = await BestWorkInfo.create({ text_uz, text_ru });
    return bestWorkInfo.get({ plain: true });
  } catch (error) {
    console.log(error);
  }
};

exports.GetLatestBestWorkInfo = async () => {
  try {
    const bestWorkInfo = await BestWorkInfo.findOne({ raw: true });
    return bestWorkInfo;
  } catch (error) {
    console.log(error);
  }
};

exports.UpdateBestWorkInfo = async (text_uz, text_ru, id) => {
  try {
    const bestWorkInfo = await BestWorkInfo.update(
      { text_uz, text_ru },
      { where: { id } }
    );
    return bestWorkInfo;
  } catch (error) {
    console.log(error);
  }
};
