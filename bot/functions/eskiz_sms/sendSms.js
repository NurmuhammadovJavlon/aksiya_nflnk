const axios = require("axios");
const FormData = require("form-data");
const getEskizToken = require("./getToken");

async function sendOtpSMSCode(phoneNumber, otpCode, message) {
  try {
    const formData = new FormData();
    formData.append("mobile_phone", `${phoneNumber}`);
    formData.append("message", `${message} ${otpCode}`);
    formData.append("from", "4546");
    // data.append("Authorization", "http://0000.uz/test.php");
    // data.append("callback_url", "http://0000.uz/test.php");

    const token = await getEskizToken();
    console.log(token);

    const config = {
      method: "POST",
      maxBodyLength: Infinity,
      url: "http://notify.eskiz.uz/api/message/sms/send",
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders(),
      },
      data: formData,
    };

    const { data } = await axios(config);
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

module.exports = sendOtpSMSCode;
