require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const EskizToken = require("../../model/smsToken.model");

async function getEskizToken() {
  try {
    const tokenFromDb = await EskizToken.findOne({
      order: [["expirationTime", "DESC"]],
      raw: true,
    });

    if (tokenFromDb) {
      if (tokenFromDb && tokenFromDb.expirationTime <= new Date()) {
        // Token is expired, delete it
        await EskizToken.destroy({
          where: {
            id: tokenFromDb.id,
          },
        });
      } else if (tokenFromDb && tokenFromDb.expirationTime > new Date()) {
        return tokenFromDb.token;
      }
    }

    const formData = new FormData();
    formData.append("email", process.env.ESKIZ_EMAIL);
    formData.append("password", process.env.ESKIZ_PASSWORD);

    const config = {
      method: "POST",
      maxBodyLength: Infinity,
      url: "http://notify.eskiz.uz/api/auth/login",
      headers: {
        ...formData.getHeaders(),
      },
      data: formData,
    };

    const { data } = await axios(config);
    const tokenFromApi = data?.data.token;

    if (!tokenFromApi) {
      console.log("Can't get token from API");
      return;
    }

    // Create a new token record in the database
    const newToken = await EskizToken.create({
      token: tokenFromApi,
      expirationTime: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000), // New expiration time: current time + 30 days
    });
    // console.log("Latest Token:", newToken.accessToken);
    return newToken.token;
  } catch (error) {
    console.log(error);
  }
}

module.exports = getEskizToken;
