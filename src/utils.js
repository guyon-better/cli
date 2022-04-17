const ora = require("ora");
const chalk = require("chalk");
const assert = require("assert");
const path = require("path");
const fs = require("fs-extra")
const { spawn } = require("child_process")

/**
 * 停止函数
 * @param {Number} msec 毫秒
 * @returns
 */
function sleep(msec) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, msec);
  });
}

/**
 * 封装 loading
 * @param {String} msg loading 内容
 * @param {*} fn 执行函数
 * @param  {...any} args 函数入参
 * @returns
 */
const loading = async (msg, fn, ...args) => {
  const spinner = ora(msg);
  spinner.start();

  try {
    const res = fn(...args);
    spinner.succeed();
    return res;
  } catch (error) {
    spinner.fail("Request fail, retrying");
    await sleep(1000);
    return loading(msg, fn, ...args);
  }
};

/**
 * 封装 spawn
 * @param  {...any} args spawn 入参
 * @returns
 */
const processSpawn = async (...args) => {
  return new Promise((resolve) => {
    const process = spawn(...args);
    // process.stdout.pipe(process.stdout);
    // process.stderr.pipe(process.stderr);
    
    // process.stdout.on('data', (data) => {
    //   console.log(data.toString()); 
    // });

    // process.on("exit", () => {
    //   resolve();
    // });

    process.on("close", () => {
      resolve();
    });
  });
};

/**
 * 通过 chalk 打印带颜色日志
 * @param {String} msg 打印内容
 * @param {String} color 颜色
 * @param  {...any} args 其他内容
 * @returns
 */
const chalkLog = (msg, color = "green", ...args) => {
  return console.log(chalk[color](msg, ...args));
};

/**
 * 清空控制台命令
 * @param {{ fullClear: Boolean }} opts
 */
const clear = (opts) => {
  if (typeof opts === "boolean") {
    opts = {
      fullClear: opts,
    };
  }

  opts = opts || {};
  assert(typeof opts === "object", "opts must be an object");

  opts.fullClear = opts.hasOwnProperty("fullClear") ? opts.fullClear : true;

  assert(
    typeof opts.fullClear === "boolean",
    "opts.fullClear must be a boolean"
  );

  if (opts.fullClear === true) {
    process.stdout.write("\x1b[2J");
  }

  process.stdout.write("\x1b[0f");
};

/**
 * 递归创建不存在的文件夹
 * @param {String} pathName 路径名 包含后缀的文件如 src/pages/goods
 * @returns
 */
function createDirSync(pathName) {
  if (fs.existsSync(pathName)) {
    return true;
  } else {
    if (createDirSync(path.dirname(pathName))) {
      fs.mkdirSync(pathName);
      return true;
    }
  }
};

module.exports = {
  loading,
  processSpawn,
  chalkLog,
  loading,
  clear,
  createDirSync
}
