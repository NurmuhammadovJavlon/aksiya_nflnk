// SCENES
require("./bot/middleware/scene/index.scene");

// ON
require("./bot/middleware/on/onConfirmPurchase");

// COMMANDS
require("./bot/middleware/command/commands.command");
require("./bot/middleware/command/start.command");
require("./bot/middleware/command/help.command");
require("./bot/middleware/command/setting.command");
require("./bot/middleware/command/verify.command");
require("./bot/middleware/command/setadmin.command");

// HEARS
require("./bot/middleware/hears/index.hears");

// ACTION

// CONNECTION
require("./bot/connection/local.connection");
// require("./bot/connection/lambda.connection");
