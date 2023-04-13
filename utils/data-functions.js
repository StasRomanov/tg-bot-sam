`use strict`;
const fs = require(`fs`);
const {debugMode} = require(`../data`);
const child_process = require(`child_process`);
const SamJs = require(`./../core/sam.js`).default;

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

const getHash53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef^seed, h2 = 0xcafebabe^seed;
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
  const sam = new SamJs(settings);
  console.log(text);
  fs.writeFileSync(`./audio/${wavName}`, sam.renderWav(text.trim().replace(/[^\w\s]/gi, ``).replace(/\s+/g, `_`)));
  const end = Date.now();
  if (debugMode) {
    console.log(`Sam-time: ${end - start} ms`);
    console.log(new Date(new Date().getTime()).toString(), text);
  }
  text = text.trim().replace(/[^\w\s]/gi, ``).replace(/\s+/g, `_`);
  audioName = text.length <= 100 ? text : `voice-${getHash53(audioName, Date.now())}`;
  const wavFileName = `./audio/${wavName}`;
  const mp3FileName = `./audio/${audioName}.mp3`;
  const ffmpegFlags = `-y -loglevel warning`;
  child_process.execSync(`ffmpeg -i ${wavFileName} ${mp3FileName} ${ffmpegFlags}`);
  return mp3FileName;
}

module.exports = {formatNumbers, getHash53, saveLogs, makeAudio};
