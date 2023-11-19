const Dealer = require("../../model/dealer.model");
const Order = require("../../model/order.model");

// POST
exports.CreateOrderBeforeValid = async (
  amount,
  clientChatID,
  dealerId,
  clientId
) => {
  try {
    const order = await Order.create({
      amount,
      clientChatID,
      dealerId,
      clientId,
      status: "PENDING",
    });
    return order.get({ plain: true });
  } catch (error) {
    console.log(error);
  }
};

exports.DeleteOrder = async (id) => {
  try {
    await Order.destroy({ where: { id } });
  } catch (error) {
    console.log(error);
  }
};

exports.ConfirmOrder = async (id) => {
  try {
    await Order.update(
      { isValidated: true, status: "FINISHED" },
      { where: { id } }
    );
  } catch (error) {
    console.log(error);
  }
};

// GET
exports.GetAllInvalidOrders = async (page, itemsPerPage, dealerId) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;
    if (dealerId) {
      const { rows: items, count: totalItems } = await Order.findAndCountAll({
        raw: true,
        offset,
        limit,
        order: [["createdAt", "DESC"]],
        where: {
          dealerId,
          status: "PENDING",
        },
      });
      return { items, totalItems };
    } else {
      const { rows: items, count: totalItems } = await Order.findAndCountAll({
        raw: true,
        offset,
        limit,
        order: [["createdAt", "DESC"]],
        where: {
          status: "PENDING",
        },
      });
      return { items, totalItems };
    }
  } catch (error) {
    console.log(error);
  }
};

exports.GetOrderById = async (orderId) => {
  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
      },
    });
    return order;
  } catch (error) {
    console.log(error);
  }
};

exports.GetOrdersByClient = async (page, itemsPerPage, clientChatID) => {
  try {
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const { rows: items, count: totalItems } = await Order.findAndCountAll({
      where: { clientChatID },
      include: [
        {
          model: Dealer,
          as: "dealer",
          attributes: ["id", "name_uz", "name_ru"],
        },
      ],
      raw: true,
      nest: true,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });
    return { items, totalItems };
  } catch (error) {
    console.log(error);
  }
};
