`use strict`;
const {Telegraf, Input} = require('telegraf');
const fs = require(`fs`)
const {execSync} = require(`child_process`);
const Sam = require(`./sam.js`)
const {getUserSettings, setUserSettings, readSettings} = require(`./utils/settings-functions.js`);
const {defaultSettingsFilename, debugMode, tokenFilename} = require("./data.js");
const {getHash53, saveLogs} = require("./utils/data-functions.js");

const bot = new Telegraf(fs.readFileSync(tokenFilename, {encoding:'utf8', flag:'r'}));

const makeAudio = (text, settings) => {
  const wavName = `sam.wav`;
  let audioName = ``;
  const start = Date.now();
  Sam(text.trim(), wavName, settings);
  const end = Date.now();
  if (debugMode) {
    console.log(`Sam-time: ${end - start} ms`);
    console.log(new Date(new Date().getTime()).toString(), text);
  }
  text = text.trim().replace(/[^\w\s]/gi, ``).replace(/\s+/g, `_`);
  audioName = text.length <= 100 ? text : `voice-${getHash53(audioName, Date.now())}`;
  const wavFileName = `./audio/sam.wav`;
  const mp3FileName = `./audio/${audioName}.mp3`;
  const ffmpegFlags = `-y -loglevel warning`;
  execSync(`ffmpeg -i ${wavFileName} ${mp3FileName} ${ffmpegFlags}`);
  return mp3FileName;
}

bot.start(async (ctx) => {
  saveLogs(ctx);
  getUserSettings(ctx.update.message.from.id);
  const startMsg = `Hello, I am SAM - Software Automatic Mouth!`;
  ctx.reply(startMsg);
  await ctx.replyWithAnimation({source : `./media/Michael\ Davies\ Crawl.gif`});
});

bot.help((ctx) => {
  saveLogs(ctx);
  const helpMsg = `Use \/voice and write text to get audio.`
  ctx.reply(helpMsg);
});

bot.hears(/\/Show_current_profile/, (ctx) => {
  saveLogs(ctx);
  const spaceCount = 3
  ctx.replyWithMarkdown(`Current profile: ${defaultSettings[0].name}\n\`\`\`\npitch${``.padEnd(spaceCount, ` `)}speed${``.padEnd(spaceCount, ` `)}mouth${``.padEnd(spaceCount, ` `)}throat\n ${defaultSettings[0].formattedStats.pitch}${``.padEnd(5, ` `)}${defaultSettings[0].formattedStats.speed}${``.padEnd(5, ` `)}${defaultSettings[0].formattedStats.mouth}${``.padEnd(6, ` `)}${defaultSettings[0].formattedStats.throat}\n\`\`\``);
});

bot.hears(/\/Show_all_profiles/, (ctx) => {
  saveLogs(ctx);
  let responseBuffer = ``;
  const spaceCount = 3
  defaultSettings.forEach((item) => responseBuffer+=`Profile: \*\*\*${item.name}\*\*\* | id: ${item.id}\n\`\`\`\npitch${``.padEnd(spaceCount, ` `)}speed${``.padEnd(spaceCount, ` `)}mouth${``.padEnd(spaceCount, ` `)}throat\n ${item.formattedStats.pitch}${``.padEnd(5, ` `)}${item.formattedStats.speed}${``.padEnd(5, ` `)}${item.formattedStats.mouth}${``.padEnd(6, ` `)}${item.formattedStats.throat}\n\n\`\`\``);
  ctx.replyWithMarkdown(responseBuffer);
});

bot.hears(/\/Show_faith_profiles/, async (ctx) => {
  saveLogs(ctx);
  await ctx.replyWithPhoto(Input.fromLocalFile(`./media/wiki-guide.jpeg`));
});

bot.hears(/\/Set_profile_by_id (.+)/, (ctx) => {
  saveLogs(ctx);
  const id = ctx.match[1];
  if (id < defaultSettings.length) {
    let currentSettings = getUserSettings(ctx.update.message.from.id);
    currentSettings.id = id;
    setUserSettings(ctx.update.message.from.id, currentSettings);
    ctx.replyWithMarkdown(`Done! Profile \*\*\*${defaultSettings[id].name}\*\*\* active.`);
  } else {
    ctx.reply(`Wrong ID\nMin ID: 0 | Max ID: ${defaultSettings.length-1}\nYou try to set ID: ${id}`);
  }
});

bot.hears(/^(\/Enable|\/Disable|\/Toggle)_(Modern_CMU|Sing_mode)$/, (ctx) => {
  const userSettings = getUserSettings(ctx.update.message.from.id);
  userSettings[ctx.match[2] === `Modern_CMU` ? `modernCMU` : `singMode`] = ctx.match[1] === `/Toggle` ? !(userSettings[ctx.match[2] === `Modern_CMU` ? `modernCMU` : `singMode`]) : ctx.match[1] === `/Enable`;
  setUserSettings(ctx.update.message.from.id, userSettings);
  ctx.reply(`${userSettings.modernCMU} - ${userSettings.singMode}`);
});

bot.hears(/\/voice (.+)/, (ctx) => {
  saveLogs(ctx);
  ctx.replyWithAudio({source: makeAudio(ctx.match[1], getUserSettings(ctx.update.message.from.id))})
});

bot.hears(/\/ping/, (ctx) => ctx.reply(`SAM alive !`));
bot.hears(/\/echo/, (ctx) => ctx.reply(ctx.match[1]));

defaultSettings = readSettings(defaultSettingsFilename);
bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
