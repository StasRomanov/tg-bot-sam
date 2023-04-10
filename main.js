`use strict`;
const {Telegraf, Input} = require('telegraf');
const Sam = require(`./sam.js`)
const fs = require("fs")
const {execSync} = require("child_process");

const token = fs.readFileSync('./token.txt', {encoding:'utf8', flag:'r'});
process.env.BOT_TOKEN = token;
const debugMode = false;
const bot = new Telegraf(process.env.BOT_TOKEN);
const defaultSettingsFilename = `./settings/default/default-settings.txt`;
let defaultSettings = [];

const getHash53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef^seed, h2 = 0x41c6ce57^seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const formatNumbers = (number) => {
  number = number.toString();
  if (number.length >= 3) {
    return number;
  }
  if (number.length >= 2) {
    return ` `+number;
  }
  if (number.length >= 1) {
    return ` `+number+`  `;
  }
}

const getUserSettings = (id) => {
  if (!fs.existsSync(`./settings/custom/${id}/`)) {
    fs.mkdirSync(`./settings/custom/${id}/`);
    fs.writeFileSync(`./settings/custom/${id}/all.txt`, ``);
    fs.writeFileSync(`./settings/custom/${id}/current.txt`, `0 1 0`); // profile id | modernCMU | singMode
  }
  let userSettings = fs.readFileSync(`./settings/custom/${id}/current.txt`, {encoding:'utf8', flag:'r'}).split(` `).map((item, index) => index < 1 ? Number(item):Boolean(Number(item)));
  if (userSettings[0] < defaultSettings.length) {
    userSettings.push(...Object.values(defaultSettings[userSettings[0]].stats));
  }
  let i = 0;
  userSettings = {
    id: userSettings[i++],
    modernCMU: userSettings[i++],
    singMode: userSettings[i++],
    pitch: userSettings[i++],
    speed: userSettings[i++],
    mouth: userSettings[i++],
    throat: userSettings[i++],
  }
  return userSettings;
}

const setUserSettings = (id, settings) => {
  const settingsFileName = `./settings/custom/${id}/current.txt`;
  fs.writeFileSync(settingsFileName, Object.values(settings).slice(0, 3).map((item) => Number(item)).join(` `));
}

const readSettings = (filename) => {
  let buffer = [];
  let fileContent = fs.readFileSync(filename, {encoding:'utf8', flag:'r'}).split(`\n`).map((item, index) => {
    if (index % 2) {
      return item.split(` `).map((value) => Number(value));
    } else {
      return [[Number(item.split(` `).shift()), item.split(` `).filter((item, index) => index > 0).join(` `)]];
    }
  });
  fileContent.forEach((item, index, array) => {
    if (!(index % 2)) {
      buffer.push({
        id: item[0][0],
        name: item[0][1],
        stats: {
          pitch: array[index+1][0],
          speed: array[index+1][1],
          mouth: array[index+1][2],
          throat: array[index+1][3],
        },
        formattedStats: {
          pitch: formatNumbers(array[index+1][0]),
          speed: formatNumbers(array[index+1][1]),
          mouth: formatNumbers(array[index+1][2]),
          throat: formatNumbers(array[index+1][3]),
        },
      });
    }
  })
  return buffer;
}

const saveLogs = (ctx) => {
  const log = {
    match: structuredClone(ctx.match),
    update: structuredClone(ctx.update),
    botInfo: structuredClone(ctx.botInfo),
  };
  fs.writeFileSync(`./logs/${log.update.message.date}-${log.update.message.from.username}-${log.update.message.from.id}.log`,
    JSON.stringify(log, null, 2))
}

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

bot.start((ctx) => {
  saveLogs(ctx);
  getUserSettings(ctx.update.message.from.id);
  const startMsg = `Hello, I am SAM - Software Automatic Mouth!`;
  ctx.reply(startMsg);
  ctx.replyWithDocument(Input.fromLocalFile(`./media/Michael\ Davies\ Crawl.gif`));
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

defaultSettings = readSettings(defaultSettingsFilename); //generate default settings
bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
