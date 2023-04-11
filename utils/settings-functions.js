`use strict`;
const fs = require(`fs`);
const {formatNumbers} = require(`./data-functions.js`);
const {defaultSettingsFilename} = require("../data.js");

let defaultSettings = [];

const getUserSettings = (id) => {
  if (!fs.existsSync(`./settings/custom/${id}/`)) {
    fs.mkdirSync(`./settings/custom/${id}/`);
    fs.writeFileSync(`./settings/custom/${id}/all.txt`, ``);
    fs.writeFileSync(`./settings/custom/${id}/current.txt`, `0 1 0`); // profile id | modernCMU | singMode
  }
  let userSettings = fs.readFileSync(`./settings/custom/${id}/current.txt`, {encoding:`utf8`, flag:`r`}).split(` `).map((item, index) => index < 1 ? Number(item):Boolean(Number(item)));
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
  let fileContent = fs.readFileSync(filename, {encoding:`utf8`, flag:`r`}).split(`\n`).map((item, index) => {
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
      });
    }
  })
  return buffer;
}

defaultSettings = readSettings(defaultSettingsFilename);

module.exports = {getUserSettings, setUserSettings, readSettings, formatNumbers, defaultSettings};