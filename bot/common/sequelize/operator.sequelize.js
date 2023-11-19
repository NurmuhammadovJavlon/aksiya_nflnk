const Dealer = require("../../model/dealer.model");
const Operator = require("../../model/operator.model");
const User = require("../../model/user.model");

// POST

exports.CreateOperator = async (chatId, userId, dealerId) => {
  try {
    await User.update({ isOperator: true }, { where: { id: userId } });
    const operator = await Operator.create({ chatId, userId, dealerId });
    return operator.get({ plain: true });
  } catch (error) {
    console.log(error);
  }
};

exports.DeleteOperator = async (id) => {
  try {
    await Operator.destroy({ where: { id } });
  } catch (error) {
    console.log(error);
  }
};

exports.ChangeDealer = async (id, dealerId) => {
  try {
    await Operator.update({ dealerId }, { where: { id } });
  } catch (error) {
    console.log(error);
  }
};
// GET

exports.GetOperatorsByDealerId = async (dealerId) => {
  try {
    const operators = await Operator.findAll({
      where: {
        dealerId,
      },
      raw: true,
      order: [["createdAt", "DESC"]],
    });

    return operators;
  } catch (error) {
    console.log(error);
  }
};

exports.GetOperators = async (page, itemsPerPage) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const { rows: items, count: totalItems } = await Operator.findAndCountAll({
      raw: true,
      offset,
      limit,
    });

    return { items, totalItems };
  } catch (error) {
    console.log(error);
  }
};

exports.GetOperatorById = async (id) => {
  try {
    const operator = await Operator.findOne({
      where: { id },
      raw: true,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "chatID", "firstName", "lastName", "phoneNumber"],
        },
        {
          model: Dealer,
          as: "dealer",
          attributes: ["id", "name_uz", "name_ru"],
        },
      ],
      nest: true,
    });
    return operator;
  } catch (error) {
    console.log(error);
  }
};
