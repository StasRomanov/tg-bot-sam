// noinspection SpellCheckingInspection

`use strict`;
const fs = require("fs");
const SamJs = require(`./core/sam.js`).default;

let pronunciationSettings = {
  modernCMU: true,
  singMode: false,
  pitch: 64,
  speed: 72,
  mouth: 128,
  throat: 128,
}

const Sam = (message = ``, filename = `sam.wav`, settings) => {
  pronunciationSettings = settings;
  let sam = new SamJs(pronunciationSettings);
  fs.writeFileSync(`./audio/${filename}`, Buffer.from(sam.renderWav(message)));
}

module.exports = Sam;
