const { Markup, Scenes, Composer } = require("telegraf");
const { SaveUser } = require("../../common/sequelize/user.sequelize");
const otpGenerator = require("otp-generator");
const sendOtpSMSCode = require("../../functions/eskiz_sms/sendSms");
const { match } = require("telegraf-i18n");

const setlanguage = new Composer();
setlanguage.hears(match("Client.cancelRegistrationBtn"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("Client.cancelRegistrationMsg"),
      Markup.removeKeyboard()
    );
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
setlanguage.action(["lang_uz", "lang_ru"], async (ctx) => {
  try {
    ctx.wizard.state.userData = {};
    ctx.wizard.state.userData.chatID = String(ctx.chat.id);
    ctx.wizard.state.userData.firstName = ctx.chat.first_name;
    ctx.wizard.state.userData.lastName = ctx.chat.last_name;
    ctx.wizard.state.userData.username = ctx.chat.username ?? "anonymous";
    const callback_data = await ctx.callbackQuery.data;
    if (callback_data === "lang_uz") {
      // save prefred language data
      ctx.wizard.state.userData.pLang = "uz";
      // set language to session
      ctx.i18n.locale("uz");
    } else if (callback_data === "lang_ru") {
      ctx.wizard.state.userData.pLang = "ru";
      ctx.i18n.locale("ru");
    }
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("enterNameMsg"),
      Markup.keyboard([
        [
          Markup.button.text(ctx.i18n.t("Client.backOneStepMsg")),
          Markup.button.text(ctx.i18n.t("Client.cancelRegistrationBtn")),
        ],
      ]).resize()
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getNameStep = new Composer();
getNameStep.hears(match("Client.backOneStepMsg"), async (ctx) => {
  try {
    const greeting = {
      text: "Iltimos, tilni tanlang!\nПожалуйста, выберите язык!",
      langButtons: [
        [
          { text: "O'zbek", callback_data: "lang_uz" },
          { text: "Russian", callback_data: "lang_ru" },
        ],
      ],
    };
    await ctx.reply(greeting.text, Markup.inlineKeyboard(greeting.langButtons));
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getNameStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.userData.firstName = ctx.message.text;
    await ctx.reply(ctx.i18n.t("enterSecondNameMsg"));
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getSecondNameStep = new Composer();
getSecondNameStep.hears(match("Client.backOneStepMsg"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("enterNameMsg"),
      Markup.keyboard([
        [
          Markup.button.text(ctx.i18n.t("Client.backOneStepMsg")),
          Markup.button.text(ctx.i18n.t("Client.cancelRegistrationBtn")),
        ],
      ])
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getSecondNameStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.userData.lastName = ctx.message.text;
    await ctx.replyWithHTML(
      ctx.i18n.t("enterPhoneNumber"),
      Markup.keyboard([
        [Markup.button.contactRequest(ctx.i18n.t("Client.sendPhoneNumberMsg"))],
        [
          Markup.button.text(ctx.i18n.t("Client.backOneStepMsg")),
          Markup.button.text(ctx.i18n.t("Client.cancelRegistrationBtn")),
        ],
      ])
        .oneTime()
        .resize()
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getPhoneNumber = new Composer();
getPhoneNumber.hears(match("Client.backOneStepMsg"), async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t("enterSecondNameMsg"));
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getPhoneNumber.hears(match("Client.cancelRegistrationBtn"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("Client.cancelRegistrationMsg"),
      Markup.removeKeyboard()
    );
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getPhoneNumber.on("message", async (ctx) => {
  try {
    const contactNumber = ctx.message.contact?.phone_number?.replace(
      /\s+|\+|\D/g,
      ""
    );

    if (contactNumber) {
      ctx.wizard.state.userData.phoneNumber = contactNumber;
    }

    // check for invalid phone number
    if (ctx.message.text) {
      const phoneRegex = /^\d{12}$/;
      const repeatingDigitsRegex = /(\d)\1{9,}/;
      const phoneNumber = ctx.message.text.replace(/\s+|\+|\D/g, "");

      if (
        !phoneRegex.test(parseInt(phoneNumber)) ||
        repeatingDigitsRegex.test(parseInt(phoneNumber))
      ) {
        await ctx.reply(
          ctx.i18n.t("Client.sendValidPhoneNumberMsg"),
          Markup.keyboard([
            [
              Markup.button.contactRequest(
                ctx.i18n.t("Client.sendPhoneNumberMsg")
              ),
            ],
            [Markup.button.text(ctx.i18n.t("Client.cancelRegistrationBtn"))],
          ])
            .oneTime()
            .resize()
        );
        return;
      }

      ctx.wizard.state.userData.phoneNumber = phoneNumber;
    }

    let otpCode = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    ctx.wizard.state.userData.otpCode = parseInt(otpCode);
    ctx.wizard.state.userData.userAttempts = 0;

    console.log(ctx.wizard.state.userData.otpCode);

    // Send Otp Code as SMS
    await sendOtpSMSCode(
      ctx.wizard.state.userData.phoneNumber,
      ctx.wizard.state.userData.otpCode,
      ctx.i18n.t("Client.otpCodeMsg")
    );

    const phoneNumber = ctx.wizard.state.userData.phoneNumber
      .replace(/\D/g, "")
      .replace(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, "+$1 $2 $3 $4 $5");

    // console.log(phone_numberMsg);
    await ctx.reply(
      ctx.i18n.t("Client.otpCodeisSentMsg", {
        phoneNumber,
      }),
      Markup.keyboard([
        [Markup.button.text(ctx.i18n.t("Client.cancelRegistrationBtn"))],
      ])
        .oneTime()
        .resize()
    );

    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const checkPhoneNumber = new Composer();
checkPhoneNumber.hears(match("Client.cancelRegistrationBtn"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("Client.cancelRegistrationMsg"),
      Markup.removeKeyboard()
    );
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
checkPhoneNumber.on("message", async (ctx) => {
  try {
    const otpCode = ctx.message.text;
    const otpRegex = /^\d{4}$/;

    if (ctx.wizard.state.userData.userAttempts >= 5) {
      await ctx.reply(ctx.i18n.t("Client.tooManyAttemptsMsg"));
      return ctx.scene.leave();
    }

    if (!otpRegex.test(otpCode)) {
      await ctx.reply(ctx.i18n.t("Client.wrongTypeCodeMsg"));
      ctx.wizard.state.userData.userAttempts++;
      return;
    }

    if (parseInt(otpCode) !== ctx.wizard.state.userData.otpCode) {
      await ctx.reply(ctx.i18n.t("Client.wrongCodeMsg"));
      ctx.wizard.state.userData.userAttempts++;
      return;
    }

    await SaveUser(
      ctx.wizard.state.userData.chatID,
      ctx.wizard.state.userData.username,
      ctx.wizard.state.userData.firstName,
      ctx.wizard.state.userData.lastName,
      ctx.wizard.state.userData.pLang,
      ctx.wizard.state.userData.phoneNumber
    );

    const goMenu = {
      text: ctx.i18n.t("greeting"),
      buttons: Markup.keyboard([
        [
          Markup.button.text(ctx.i18n.t("promotionBtn")),
          Markup.button.text(ctx.i18n.t("productsBtn")),
        ],
        [
          Markup.button.text(ctx.i18n.t("validateClientBtn")),
          Markup.button.text(ctx.i18n.t("settingsBtn")),
        ],
        [
          Markup.button.text(ctx.i18n.t("aboutCompanyBtn")),
          Markup.button.text(ctx.i18n.t("contactsBtn")),
        ],
        [Markup.button.text(ctx.i18n.t("complainBtn"))],
      ])
        .oneTime()
        .resize(),
    };

    await ctx.reply(ctx.i18n.t("Client.registerSuccessMsg"), goMenu.buttons);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "InitialForm",
  setlanguage,
  getNameStep,
  getSecondNameStep,
  getPhoneNumber,
  checkPhoneNumber
);
