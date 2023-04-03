`use strict`;
const SamJs = require("sam-js")
const fs = require("fs")


const getArgValue = (arg) => {
  if (process.argv.findIndex((item) => item === `-${arg}` || item === `--${arg}`) !== -1) {
    return process.argv[process.argv.findIndex((item) => item === `-${arg}` || item === `--${arg}`)+1];
  } else {
    return undefined;
  }
}
const findArgFlag = (flag) => {
  if (process.argv.findIndex((item) => item === `-${flag}` || item === `--${flag}`) !== -1) {
      return process.argv.findIndex((item) => item === `-${flag}` || item === `--${flag}`) !== -1;
  }
}

let argv = {
  values:[],
  flags:[],
  native:``, wav:``, throat:``, speed:``, mouth:``, s:``,
  debug:false, modernCMU:false, singMode:false, phonetic:false
};

const Sam = (message = ``, filename = `sam.wav`, modernCMU = true, singMode = false, ...singSettings) => {
  argv.s = message;
  argv.values = [`wav`, `throat`, `speed`, `mouth`, `s`];
  argv.flags = [`debug`, `modernCMU`, `singMode`, `phonetic`];
  argv.native = process.argv;
  process.argv = process.argv.slice(2);
  argv.wav = filename !== undefined ? filename : `sam.wav`;
  argv.modernCMU = modernCMU; argv.singMode = singMode;
  argv.pitch = singSettings[0] !== undefined ? singSettings[0] : 64; argv.speed = singSettings[1] !== undefined ? singSettings[1] : 72; argv.mouth = singSettings[2] !== undefined ? singSettings[2] : 128; argv.throat = singSettings[3] !== undefined ? singSettings[3] : 128;
  if (!("wav" in argv)) {
    console.error("wav output unspecified!");
    process.exit(1);
  }
  if (!argv.s.length) {
    console.error("speak string unspecified!");
    process.exit(1);
  }
  if (!argv.debug) {
    // console["log"] = () => {};
    // console["debug"] = () => {};
    // console["info"] = () => {};
  } else {
    console.log(argv);
  }
  let sam = new SamJs();
  fs.writeFileSync(`./audio/${argv.wav}`, Buffer.from(sam.renderwav(argv.s)));
}

module.exports = Sam;
