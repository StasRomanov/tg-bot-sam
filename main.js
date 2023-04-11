`use strict`;
const {Telegraf, Input} = require(`telegraf`);
const fs = require(`fs`);
const {getUserSettings, setUserSettings, defaultSettings} = require(`./utils/settings-functions.js`);
const {tokenFilename} = require(`./data.js`);
const {saveLogs, makeAudio, formatNumbers} = require(`./utils/data-functions.js`);

const bot = new Telegraf(fs.readFileSync(tokenFilename, {encoding:`utf8`, flag:`r`}));

bot.start(async (ctx) => {
  saveLogs(ctx);
  getUserSettings(ctx.update.message.from.id);
  const startMsg = `Hello, I am SAM - Software Automatic Mouth!`;
  ctx.reply(startMsg);
  await ctx.replyWithAnimation({source : `./media/Michael\ Davies\ Crawl.gif`});
  ctx.replyWithAudio({source: `./media/sam-story.mp3`});
});

bot.help((ctx) => {
  saveLogs(ctx);
  const helpMsg = `\/voice text to get audio.`;
  ctx.replyWithAudio({source: makeAudio(`text to get audio.`, getUserSettings(ctx.update.message.from.id))});
  ctx.reply(helpMsg);
});

bot.hears(/\/show_current_profile/, (ctx) => {
  saveLogs(ctx);
  const spaceCount = 3;
  const currentProfile = getUserSettings(ctx.update.message.from.id);
  ctx.replyWithMarkdown(`Current profile: ${defaultSettings[currentProfile.id].name}\n\`\`\`\npitch${``.padEnd(spaceCount, ` `)}speed${``.padEnd(spaceCount, ` `)}mouth${``.padEnd(spaceCount, ` `)}throat\n ${formatNumbers(currentProfile.pitch)}${``.padEnd(5, ` `)}${formatNumbers(currentProfile.speed)}${``.padEnd(5, ` `)}${formatNumbers(currentProfile.mouth)}${``.padEnd(6, ` `)}${formatNumbers(currentProfile.throat)}\n\`\`\`Modern CMU: ${currentProfile.modernCMU? `Enable`: `Disable`} | Sing mode: ${currentProfile.singMode? `Enable`: `Disable`}`);
});

bot.hears(/\/show_all_profiles/, (ctx) => {
  saveLogs(ctx);
  let responseBuffer = ``;
  const spaceCount = 3;
  defaultSettings.forEach((item) => responseBuffer+=`Profile: \*\*\*${item.name}\*\*\* | id: ${item.id}\n\`\`\`\npitch${``.padEnd(spaceCount, ` `)}speed${``.padEnd(spaceCount, ` `)}mouth${``.padEnd(spaceCount, ` `)}throat\n ${formatNumbers(item.stats.pitch)}${``.padEnd(5, ` `)}${formatNumbers(item.stats.speed)}${``.padEnd(5, ` `)}${formatNumbers(item.stats.mouth)}${``.padEnd(6, ` `)}${formatNumbers(item.stats.throat)}\n\n\`\`\``);
  ctx.replyWithMarkdown(responseBuffer);
});

bot.hears(/\/show_faith_profiles/, async (ctx) => {
  saveLogs(ctx);
  await ctx.replyWithPhoto(Input.fromLocalFile(`./media/wiki-guide.jpeg`));
});

bot.hears(/\/set_profile_by_id (.+)/, (ctx) => {
  saveLogs(ctx);
  const id = ctx.match[1];
  if (id < defaultSettings.length) {
    let currentSettings = getUserSettings(ctx.update.message.from.id);
    currentSettings.id = id;
    setUserSettings(ctx.update.message.from.id, currentSettings);
    ctx.replyWithMarkdown(`Done! Profile \*\*\*${currentSettings.name}\*\*\* active.`);
  } else {
    ctx.reply(`Wrong ID\nMin ID: 0 | Max ID: ${defaultSettings.length-1}\nYou try to set ID: ${id}`);
  }
});

bot.hears(/^(\/enable|\/disable|\/toggle)_(modern_cmu|sing_mode)$/, (ctx) => {
  const userSettings = getUserSettings(ctx.update.message.from.id);
  userSettings[ctx.match[2] === `modern_cmu` ? `modernCMU` : `singMode`] = ctx.match[1] === `/toggle` ? !(userSettings[ctx.match[2] === `modern_cmu` ? `modernCMU` : `singMode`]) : ctx.match[1] === `/enable`;
  setUserSettings(ctx.update.message.from.id, userSettings);
  ctx.reply(`${userSettings.modernCMU} - ${userSettings.singMode}`);
});

bot.hears(/\/voice (.+)/, (ctx) => {
  saveLogs(ctx);
  ctx.replyWithAudio({source: makeAudio(ctx.match[1], getUserSettings(ctx.update.message.from.id))});
});

bot.hears(/\/ping/, (ctx) => ctx.reply(`SAM alive !`));
bot.hears(/\/echo/, (ctx) => ctx.reply(ctx.match[1]));

bot.launch();
// Enable graceful stop
process.once(`SIGINT`, () => bot.stop(`SIGINT`));
process.once(`SIGTERM`, () => bot.stop(`SIGTERM`));
