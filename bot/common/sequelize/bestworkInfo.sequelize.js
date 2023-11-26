const BestWorkInfo = require("../../model/bestWorkInfo.model");

exports.CreateBestWorkText = async (text_uz, text_ru, image) => {
  try {
    const bestWorkInfo = await BestWorkInfo.create({ text_uz, text_ru, image });
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

exports.UpdateBestWorkInfo = async (text_uz, text_ru, image, id) => {
  try {
    const bestWorkInfo = await BestWorkInfo.update(
      { text_uz, text_ru, image },
      { where: { id } }
    );
    return bestWorkInfo;
  } catch (error) {
    console.log(error);
  }
};
