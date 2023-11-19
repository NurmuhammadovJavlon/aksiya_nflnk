const db = require("../../connection/db.connection");
const User = require("../../model/user.model");

// POST
exports.SaveUser = async (
  chatID,
  username,
  firstName,
  lastName,
  preferedLanguageCode,
  phoneNumber
) => {
  await db.sync();

  const textAfterSaving = `User with ${chatID} saved successfully`;
  const textAfterUpdating = `User with ${chatID} updated successfully`;
  const textUserExists = `User with ${chatID} exists already`;

  const foundUser = await User.findOne({
    where: {
      chatID,
    },
  });

  if (!foundUser) {
    await User.create({
      chatID,
      username,
      firstName,
      lastName,
      preferedLanguageCode,
      phoneNumber,
    });
    return textAfterSaving;
  }

  if (foundUser.username !== username) {
    await User.update({ username }, { where: { chatID } });
    return textAfterUpdating;
  }

  return textUserExists;
};

// GET
exports.getUser = async (chatID) => {
  await db.sync();

  const foundUser = await User.findOne({
    where: {
      chatID,
    },
    raw: true,
  });

  if (foundUser) return foundUser;
  return null;
};

exports.getUserLang = async (chatID) => {
  await db.sync();

  const foundUser = await User.findOne({
    where: {
      chatID,
    },
  });

  if (foundUser && foundUser.preferedLanguageCode)
    return foundUser.preferedLanguageCode;
  return null;
};

exports.CheckAdmin = async (chatID) => {
  await db.sync();

  const foundUser = await User.findOne({
    where: {
      chatID,
    },
  });

  if (foundUser && foundUser.admin) return foundUser;
  return null;
};

exports.GetUserScore = async (chatID) => {
  const user = await User.findOne({
    where: {
      chatID,
    },
    raw: true,
  });

  if (!user) {
    return null;
  }

  return user.score;
};

exports.GetAllAdminUsers = async () => {
  const admins = await User.findAll({
    where: {
      admin: true,
    },
    raw: true,
  });

  return admins;
};

exports.GetUserByNumber = async (phoneNumber) => {
  try {
    const user = await User.findOne({ where: { phoneNumber }, raw: true });
    return user;
  } catch (error) {
    console.log(error);
  }
};

// UPDATE

exports.UpdateUserLang = async (preferedLanguageCode, chatID) => {
  await User.update({ preferedLanguageCode }, { where: { chatID } });
};

exports.UpdatePhoneNumber = async (chatID, phoneNumber) => {
  return await User.update({ phoneNumber }, { where: { chatID } });
};

exports.UpdateUserScore = async (chatID, score) => {
  await User.update({ score }, { where: { chatID } });
};
