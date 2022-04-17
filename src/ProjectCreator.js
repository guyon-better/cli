const { promisify } = require("util");
const fs = require("fs-extra")
const path = require("path")
const inquirer = require("inquirer")
const ora = require("ora")
const chalk = require("chalk")
const axios = require("axios")
const { processSpawn, chalkLog } = require('./utils.js')
const downloadGitRepo = promisify(require("download-git-repo"))

class ProjectCreator {
  constructor(projectName) {
    this.projectName = projectName
    this.frameworks = []
    this.questions = []
  }

  async create() {
    await this.getFrameworks()
    const { projectName, framework, description } = await this.ask()
    await this.cloneGitRepo({ projectName, framework })
    await this.writeDescription({projectName, description})
    await this.gitInit(projectName)
    await this.installDependencies(projectName)
    await this.createSucceed(projectName)
  }

  async ask() {
    this.askProjectName()
    this.askDescription()
    await this.askFramework()
    const answers = await inquirer.prompt(this.questions)
    return answers
  }

  askProjectName() {
    if (fs.existsSync(this.projectName)) {
      this.questions.push({
        type: 'input',
        name: 'projectName',
        message: '当前目录已经存在同名项目，请换一个项目名！',
        validate (input) {
          if (!input) {
            return '项目名不能为空！'
          }
          if (fs.existsSync(input)) {
            return '项目名依然重复！'
          }
          return true
        }
      })
    }
  }

  askDescription() {
    this.questions.push({
      type: 'input',
      name: 'description',
      message: '请输入项目介绍'
    })
  }

  async askFramework() {
    try {
      this.questions = this.questions.concat([
        {
          type: 'list',
          name: 'frameworkType',
          message: '请选择框架类型',
          choices: Object.keys(this.frameworks)
        },
        {
          type: 'list',
          name: 'framework',
          message: '请选择框架',
          choices: ({ frameworkType }) => {
            return this.frameworks[frameworkType]
          }
        }
      ])
    } catch (error) {
      chalkLog(error, 'red')
    }
  }

  async getFrameworks() {
    const process = ora(`初始化模板列表中...`)
    process.start()
    try {
      const { data } = await axios.get('https://gitee.com/liguyon/cli-frameworks/raw/master/frameworks.json')
      this.frameworks = data
      process.succeed(chalk.gray('初始化模板列表成功'))
    } catch (error) {
      process.fail(chalk.red(error))
    }
  }

  /**
   * 根据项目名和脚手架获取对应的仓库地址进行下载
   * @param {Object} { projectName, framework }
   */
  async cloneGitRepo({ projectName = this.projectName, framework }) {
    const targetPath = path.resolve(`./${projectName}`)
    const process = ora(`下载项目中...`)
    process.start()
    try {
      await downloadGitRepo(framework, targetPath)
      process.succeed(chalk.green('项目下载完成'))
    } catch (error) {
      process.fail(chalk.red(error))
    }
  }

  /**
   * 根据项目名和项目描述写入描述字段
   * @param {Object} { projectName, description }
   */
  async writeDescription({ projectName = this.projectName, description = '' }) {
    const targetPath = `${path.resolve(`./${projectName}`)}/package.json`
    let data = await fs.readFile(targetPath, { encoding: 'utf8' })
    data = JSON.parse(data)
    data.description = description
    try {
      fs.writeFile(targetPath, JSON.stringify(data, null, "\t"))
    } catch (error) {
      chalkLog(error, 'red')
    }
  }

  async gitInit(projectName = this.projectName) {
    const process = ora()
    try {
      await processSpawn("git", ['init'], { cwd: `${projectName}/`})
      process.succeed(`${chalk.cyan.bold('cd ' + projectName)}, 执行 ${chalk.cyan.bold('git init')}`)
    } catch (error) {
      process.fail(chalk.red(error))
    }
  }

  async installDependencies(projectName = this.projectName) {
    const process = ora(`安装依赖中..., 请耐心等待一会`)
    process.start()
    try {
      await processSpawn("yarn", ['install'], { cwd: `${projectName}/`})
      process.succeed(chalk.green('依赖安装完成\n'))
    } catch (error) {
      process.fail(chalk.red(error))
    }
  }

  async createSucceed(projectName = this.projectName) {
    console.log(chalk.green(`创建项目 ${chalk.green.bold(projectName)} 成功!`))
    console.log(chalk.green(`请进入项目目录 ${chalk.green.bold(projectName)} 开始工作吧!😁`))
    console.log(chalk.green(`推荐 ${chalk.cyan.bold('guyon g <module-name> <dest-path>')} 创建模块\n`))
  }
}

module.exports = ProjectCreator