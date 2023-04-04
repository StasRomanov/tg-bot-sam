`use strict`;
const {Telegraf} = require('telegraf');
// const {message} = require('telegraf/filters');
const Sam = require(`./sam.js`)
const fs = require("fs")
const {execSync} = require("child_process");
// const util = require('util');

const token = fs.readFileSync('./token.txt', {encoding:'utf8', flag:'r'});
process.env["NTBA_FIX_350"] = 1;
process.env.BOT_TOKEN = token
const bot = new Telegraf(process.env.BOT_TOKEN);

String.prototype.hashCode = () => {
  let hash = 0,
    i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
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

const makeAudio = (text) => {
  let audioName = ``;
  const start = Date.now();
  Sam(text);
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
  const startMsg = `Welcome!`;
  saveLogs(ctx);
  ctx.reply(startMsg);
});

bot.help((ctx) => {
  const helpMsg = `Use \/voice and write text to get audio.`
  saveLogs(ctx);
  ctx.reply(helpMsg);
});

bot.hears(/\/voice (.+)/, (ctx) => {
  saveLogs(ctx);
  ctx.replyWithAudio({source: makeAudio(ctx.match[1])})
});

bot.hears(/\/ping/, (ctx) => saveLogs(ctx));

bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
