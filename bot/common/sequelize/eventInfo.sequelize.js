const EventInfo = require("../../model/eventInfo.model");

exports.CreateEventText = async (text_uz, text_ru, image) => {
  try {
    const eventInfo = await EventInfo.create({ text_uz, text_ru, image });
    return eventInfo.get({ plain: true });
  } catch (error) {
    console.log(error);
  }
};

exports.GetLatestEventInfo = async () => {
  try {
    const eventInfo = await EventInfo.findOne({ raw: true });
    return eventInfo;
  } catch (error) {
    console.log(error);
  }
};

exports.UpdateEventInfo = async (text_uz, text_ru, image, id) => {
  try {
    const eventInfo = await EventInfo.update(
      { text_uz, text_ru, image },
      { where: { id } }
    );
    return eventInfo;
  } catch (error) {
    console.log(error);
  }
};
