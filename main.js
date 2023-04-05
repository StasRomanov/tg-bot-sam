`use strict`;
const {Telegraf, Input} = require('telegraf');
const Sam = require(`./sam.js`)
const fs = require("fs")
const {execSync} = require("child_process");
const buffer = require("buffer");

const token = fs.readFileSync('./token.txt', {encoding:'utf8', flag:'r'});
process.env["NTBA_FIX_350"] = 1;
process.env.BOT_TOKEN = token
const bot = new Telegraf(process.env.BOT_TOKEN);
const defaultSettingsFilename = `./settings/default/default-settings.txt`;
let defaultSettings = [];
let settings = [];

String.prototype.hashCode = () => {
  let hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

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
  const userVoiceProfileId = userSettings.shift();
  if (userVoiceProfileId < defaultSettings.length) {
    userSettings.push(...Object.values(defaultSettings[userVoiceProfileId].stats));
  }
  return userSettings;
}

const readSettings = (filename) => {
  let buffer = [];
  let fileContent = fs.readFileSync(filename, {encoding:'utf8', flag:'r'}).split(`\n`).map((item, index, array) => {
    if (index % 2) {
      return item.split(` `).map((value) => Number(value));
    } else {
      return [[Number(item.split(` `).shift()), item.split(` `).filter((item, index) => index > 0).join(` `)]];
    }
  });
  fileContent.forEach((item, index, array) => {
    if (!(index % 2)) {
      buffer.push({
        id: item[0],
        name: item[1],
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
  fs.writeFileSync(`./logs/${log.update.message.date}-${log.update.message.from.username}-${log.update.message.from.id}.txt`,
    JSON.stringify(log, null, 2))
}

const makeAudio = (text, settings) => {
  let audioName = ``;
  const start = Date.now();
  Sam(text, `sam.wav`, ...settings);
  const end = Date.now();
  console.log(`Sam-time: ${end - start} ms`);
  console.log(new Date(new Date().getTime()).toString(), text);
  text = text.replaceAll(` `, `_`);
  if (text.length <= 30) {
    audioName = text;
  } else {
    audioName = audioName.hashCode();
  }
  const wavFileName = `./audio/sam.wav`;
  const mp3FileName = `./audio/${audioName}.mp3`;
  const ffmpegFlags = `-y -loglevel warning`;
  execSync(`ffmpeg -i ${wavFileName} ${mp3FileName} ${ffmpegFlags}`);
  try {
    if (fs.existsSync(mp3FileName)) {
      return mp3FileName;
    }
  } catch(err) {
    console.error(err)
    process.exit(3);
  }
}

bot.start((ctx) => {
  saveLogs(ctx);
  getUserSettings(ctx.update.message.from.id)
  const startMsg = `Welcome!`;
  ctx.reply(startMsg);
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
  defaultSettings.forEach((item, index, array) => responseBuffer+=`Profile: \*\*\*${item.name}\*\*\* | id: ${item.id}\n\`\`\`\npitch${``.padEnd(spaceCount, ` `)}speed${``.padEnd(spaceCount, ` `)}mouth${``.padEnd(spaceCount, ` `)}throat\n ${item.formattedStats.pitch}${``.padEnd(5, ` `)}${item.formattedStats.speed}${``.padEnd(5, ` `)}${item.formattedStats.mouth}${``.padEnd(6, ` `)}${item.formattedStats.throat}\n\n\`\`\``);
  ctx.replyWithMarkdown(responseBuffer);
});

bot.hears(/\/Show_faith_profiles/, async (ctx) => {
  saveLogs(ctx);
  await ctx.replyWithPhoto(Input.fromLocalFile(`./settings/default/wiki-guide.jpeg`));
});

bot.hears(/\/Set_profile_by_id (.+)/, (ctx) => {
  saveLogs(ctx);
  const id = ctx.match[1];
  const settingsFileName = `./settings/custom/${ctx.update.message.from.id}/current.txt`;
  if (id < defaultSettings.length) {
    const buffer = fs.readFileSync(`./settings/custom/${ctx.update.message.from.id}/current.txt`, {encoding:'utf8', flag:'r'}).split(` `); // profile id | modernCMU | singMode
    buffer[0] = id;
    fs.writeFileSync(settingsFileName, buffer.join(` `));
  } else {
    ctx.reply(`:^(`);
  }
});

bot.hears(/\/voice (.+)/, (ctx) => {
  saveLogs(ctx);
  ctx.replyWithAudio({source: makeAudio(ctx.match[1], getUserSettings(ctx.update.message.from.id))})
});

bot.hears(/\/ping/, (ctx) => getUserSettings(ctx.update.message.from.id));
bot.hears(/\/echo/, (ctx) => ctx.reply(ctx.match[1]));

defaultSettings = readSettings(defaultSettingsFilename); //generate default settings
bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
