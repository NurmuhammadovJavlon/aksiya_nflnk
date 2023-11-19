require("dotenv").config();
const googleClient = require("../../../connection/geocode.connection");

async function getAddressFromLatLng(latitude, longitude) {
  try {
    const response = await googleClient.reverseGeocode({
      params: {
        latlng: `${latitude},${longitude}`,
        key: process.env.GOOGLE_GEOCODE_API_KEY,
      },
    });

    const result = response.data.results[0];

    if (result && result.formatted_address) {
      return result.formatted_address;
    } else {
      throw new Error(
        "No address found for the provided latitude and longitude."
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

module.exports = getAddressFromLatLng;
