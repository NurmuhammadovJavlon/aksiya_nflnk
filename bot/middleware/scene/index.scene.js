const { Scenes, session } = require("telegraf");
const bot = require("../../connection/token.connection");

// const oneWizard = require("./oneWizard.scene");
const AddRegionWizard = require("./admins/regions/addRegion.scene");
const FirstPromotionWizard = require("./clients/firstpr.scene");
const FirstEventWizard = require("./clients/firstEvent.scene");
const BestWorkPromotionWizard = require("./clients/bestWork.scene");
const PhoneNumber = require("./PhoneNumber.scene");
const InitialForm = require("./initialForm.scene");
const ProductsWizard = require("./clients/products.scene");
const ClientValidationWizard = require("./clients/verification.scene");
const SettingsWizard = require("./clients/settings.scene");
const ManageRegionsWizard = require("./admins/regions/manage.scene");
const AddDealerWizard = require("./admins/dealers/addDealer.scene");
const ManageDealersWizard = require("./admins/dealers/manage.scene");
const AddProductWizard = require("./admins/products/add.scene");
const ManageProductsWizard = require("./admins/products/manage.scene");
const ManageOrdersWizard = require("./admins/orders/manage.scene");
const ManageOrdersByDealerWizard = require("./admins/orders/manageByDealer.scene");
const OperatorWizard = require("./admins/operators/add.scene");
const ManageOperatorsWizard = require("./admins/operators/manage.scene");
const CompanyInfoWizard = require("./admins/infos/companyInfo.scene");
const ContactInfoWizard = require("./admins/infos/contactInfo.scene");
const ComplainWizard = require("./admins/infos/complain.scene");
const ScoreWizard = require("./admins/infos/scoreInfo.scene");
const OrderStatusWizard = require("./admins/orders/status.scene");
const PurchaseHistoryWizard = require("./clients/purchaseHistory.scene");
const FirstInfoWizard = require("./admins/infos/firstEventInfo.scene");
const BestWorkInfoWizard = require("./admins/infos/bestworkInfo.scene");
const RejectClientVerificationWizard = require("./admins/clients/reject.scene");
const ManageUserWizard = require("./admins/users/manage.scene");
const RegisterUserWizard = require("./admins/users/register.scene");
const i18n = require("../../connection/i18n.connection");
const {
  getUserLang,
  getUser,
} = require("../../common/sequelize/user.sequelize");

const stage = new Scenes.Stage([
  AddRegionWizard,
  PhoneNumber,
  InitialForm,
  FirstEventWizard,
  FirstPromotionWizard,
  BestWorkPromotionWizard,
  ProductsWizard,
  ClientValidationWizard,
  SettingsWizard,
  ManageRegionsWizard,
  AddDealerWizard,
  ManageDealersWizard,
  AddProductWizard,
  ManageProductsWizard,
  ManageOrdersWizard,
  ManageOrdersByDealerWizard,
  OperatorWizard,
  ManageOperatorsWizard,
  CompanyInfoWizard,
  ContactInfoWizard,
  ComplainWizard,
  ScoreWizard,
  PurchaseHistoryWizard,
  OrderStatusWizard,
  FirstInfoWizard,
  BestWorkInfoWizard,
  RejectClientVerificationWizard,
  ManageUserWizard,
  RegisterUserWizard,
]);

bot.use(session());
bot.use(i18n.middleware());

// Middleware to set user's preferred language in ctx
bot.use(async (ctx, next) => {
  const userId = String(ctx.from.id);
  const lang = await getUserLang(userId);

  if (!lang) {
    return next();
  }

  ctx.i18n.locale(lang);

  return next(); // Continue processing the update
});

bot.use(stage.middleware());

bot.use(async (ctx, next) => {
  const foundUser = await getUser(String(ctx.from.id));

  if (foundUser || ctx.message.text === "/start") {
    // User is registered, proceed to the next middleware
    return next();
  } else {
    // User is not registered, handle accordingly (e.g., send a message and stop the chain)
    ctx.reply(ctx.i18n.t("notRegisteredMsg"));
  }
});

module.exports = stage;
