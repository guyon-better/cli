#! /usr/bin/env node
const program = require('commander')
const figlet = require('figlet')
const { chalkLog, clear } = require("../src/utils.js")
const ProjectCreator = require("../src/ProjectCreator.js")
const ModuleCreator = require("../src/ModuleCreator.js")

async function initCommander() {
  program
    .name('@guyon/cli')
    .usage('<command> [option]')
    .version(`@guyon/cli version: ${require('../package.json').version}`, '-v, -vers, -version')

  program
    .command('init <project-name>')
    .alias('i')
    .description('初始化项目')
    .action((projectName) => {
      new ProjectCreator(projectName).create()
    })

  program
    .command('generate <module-name> <dest-path>')
    .alias('g')
    .description('生成模块')
    .action((moduleName, destPath) => {
      new ModuleCreator(moduleName, destPath).create()
    })
  
  program.parse()
}

function intro() {
  clear();

  chalkLog(
    figlet.textSync("Happy coding!", {
      verticalLayout: "default",
      width: 80,
      whitespaceBreak: true,
    }), 'blue'
  )
}

function run() {
  intro()
  initCommander()
}

run()