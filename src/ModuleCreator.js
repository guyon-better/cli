const fs = require("fs-extra")
const path = require("path")
const inquirer = require("inquirer")
const ora = require("ora")
const chalk = require("chalk")
const axios = require("axios")
const ejs = require("ejs")
const { chalkLog, createDirSync } = require('./utils.js')

class ModuleCreator {

  constructor(moduleName, destPath) {
    this.moduleName = moduleName
    this.destPath = destPath
    this.modules = []
    this.questions = []
  }

  async create() {
    await this.getModules()
    const answers = await this.ask()
    await this.createModule(answers)
  }

  async ask() {
    this.askPageTemplate()
    const answers = await inquirer.prompt(this.questions)
    return answers
  }

  async askPageTemplate() {
    try {
      this.questions = this.questions.concat([
        {
          type: 'list',
          name: 'frameworkType',
          message: '请选择框架类型',
          choices: Object.keys(this.modules)
        },
        {
          type: 'list',
          name: 'moduleTemplate',
          message: '请选择模板',
          choices: ({ frameworkType }) => {
            return this.modules[frameworkType]
          }
        }
      ])
    } catch (error) {
      chalkLog(error, 'red')
    }
  }

  async getModules() {
    const process = ora(`初始化模板列表中...`)
    process.start()
    try {
      const { data } = await axios.get('https://gitee.com/liguyon/cli-frameworks/raw/master/modules.json')
      this.modules = data
      process.succeed(chalk.gray('初始化模板列表成功'))
    } catch (error) {
      process.fail(chalk.red(error))
    }
  }

  async createModule({ moduleName = this.moduleName, moduleTemplate }) {
    const process = ora(`创建模板中...`)
    process.start()
    try {
      const { data: templateStr } = await axios.get(moduleTemplate)
      let result = await ejs.render(templateStr, { data: { name: moduleName } })
      if (createDirSync(this.destPath)) {
        const targetPath = path.resolve(this.destPath, `${moduleName}${path.extname(moduleTemplate)}`);
        await fs.writeFile(targetPath, result);
      }
      process.succeed(chalk.green('模板创建成功'))
    } catch (error) {
      process.fail(chalk.red(error))
    }
  }
}

module.exports = ModuleCreator