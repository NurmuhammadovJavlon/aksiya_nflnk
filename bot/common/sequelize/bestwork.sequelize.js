const db = require("../../connection/db.connection");
const BestWork = require("../../model/bestwork.model");

exports.GetBestWorkById = async (workid) => {
  const bestwork = await BestWork.findOne({ where: { id: workid }, raw: true });
  return bestwork;
};

exports.CheckUserWorks = async (userId) => {
  try {
    const { rows: items, count: totalItems } = await BestWork.findAndCountAll({
      where: { userId, isConfirmed: true },
    });
    return { items, totalItems };
  } catch (error) {
    console.log(error);
  }
};

exports.CreateBestWork = async (clientChatID, userId) => {
  try {
    const bestwork = await BestWork.create({
      clientChatID,
      userId,
      status: "PENDING",
    });
    return bestwork.get({ plain: true });
  } catch (error) {
    console.log(error);
  }
};
