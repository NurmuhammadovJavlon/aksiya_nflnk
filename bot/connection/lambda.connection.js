const handler_module = require('../../index.js');
const bot = require("./token.connection");

handler_module.handler = async (event) => {
   await bot.handleUpdate(JSON.parse(event.body));
   return {statusCode: 200, body: ""};
};