const { google } = require("googleapis");
const credential = require("./credentials.json");
const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
const client = new google.auth.JWT(credential.client_email, null, credential.private_key, scopes, null);
const gsapi = google.sheets({version: "v4", auth: client});

module.exports = gsapi;