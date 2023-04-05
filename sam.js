// noinspection SpellCheckingInspection

`use strict`;
const fs = require("fs");
const SamJs = require(`./core/sam.js`).default;

let pronunciationSettings = {
  moderncmu: true,
  singmode: false,
  pitch: 64,
  speed: 72,
  mouth: 128,
  throat: 128,
}

const Sam = (message = ``, filename = `sam.wav`, modernCMU = true, singMode = false, ...singSettings) => {
  [pronunciationSettings.moderncmu, pronunciationSettings.singmode, pronunciationSettings.pitch,
    pronunciationSettings.speed, pronunciationSettings.mouth, pronunciationSettings.throat] = [modernCMU, singSettings, ...singSettings];
  let sam = new SamJs(pronunciationSettings);
  fs.writeFileSync(`./audio/${filename}`, Buffer.from(sam.renderwav(message)));
}

module.exports = Sam;
