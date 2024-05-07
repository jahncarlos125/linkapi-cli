const { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } = require('fs');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

const rgx = /\\/g;
let CURR_DIR = process.cwd();

const JSONExtensionRegExp = /(\.json)$/;

class FileHelper {

  async createDirectoryContents(templatePath, newProjectPath) {
    const filesToCreate = readdirSync(templatePath);
    for (const file of filesToCreate) {
      const origFilePath = `${templatePath}/${file}`;
      const stats = statSync(origFilePath);

      await this.createDirectory(newProjectPath);

      if (stats.isFile()) {
        let contents = readFileSync(origFilePath, 'utf8');
        if (file === 'project.json') {
          contents = JSON.parse(contents);
          contents.name = this.name;
          contents = JSON.stringify(contents, null, 4);
        }
        writeFileSync(`${newProjectPath}/${file}`, contents, 'utf8');
      }

      if (stats.isDirectory()) {
        await this.createDirectory(`${newProjectPath}/${file}/`);
        mkdirSync(`${newProjectPath}/${file}`);
        await this.createDirectoryContents(`${templatePath}/${file}`, `${newProjectPath}/${file}`);
      }
    }
  }

  async createDirectoryContent(templatePath, newProjectPath) {
    let fileToCreate = readdirSync(templatePath);
    if (!fileToCreate || fileToCreate.length === 0) {
      throw new Error('Template not found');
    }

    fileToCreate = fileToCreate[0];

    const origFilePath = `${templatePath}/${fileToCreate}`;
    const stats = statSync(origFilePath);

    if (stats.isFile()) {
      const contents = readFileSync(origFilePath, 'utf8');
      await this.createDirectory(newProjectPath);
      writeFileSync(`${newProjectPath}`, contents, 'utf8');
    }
  }

  getProjectPath(name) {
    return `${CURR_DIR}\\${name}`.replace(rgx, '/');
  }

  getWritePath(type, name) {
    return `${CURR_DIR}\\${type}s\\${name}${name.includes('.js') ? '' : '.js'}`.replace(rgx, '/');
  }

  getTemplatePath(type) {
    return `${__dirname}\\..\\templates\\${type}`.replace(rgx, '/');
  }

  createFile(path, content, options) {
    return writeFileSync(path, content, options);
  }

  createDirectorySync(path) {
    return mkdirSync(path);
  }

  createDirectory(path) {
    return new Promise((resolve, reject) => {
      mkdirp(getDirName(path), async (err, data) => {
        if (err) { return reject(err); }
        resolve();
      });
    });
  }

  validRepository() {

    if (!existsSync(`${CURR_DIR}/linkapi.json`)) {
      throw new Error('\nOooops! \nIt looks like you\'re not in a directory with a Linkapi repository\n');
    }

    return true;
  }

  readFile(path, options) {
    return readFileSync(path, options);
  }

  checkPath(path) {
    return existsSync(path);
  }

  getJSONFile(path) {
    try {
      const repoBasePath = process.cwd();
      return require(`${repoBasePath}/${path}`);
    } catch (err) {
      throw new Error('Invalid JSON file.1');
    }
  }

  getParams(params) {
    if (!params) {
      return {};
    }

    if (!JSONExtensionRegExp.test(params)) {
      return [params];
    }

    if (!this.checkPath(params)) {
      throw new Error(`No such file ${params}`);
    }

    return this.getJSONFile(params);
  }

  generatePushRestriction(projectName) {
    CURR_DIR = new RegExp(`${projectName}$`, 'i').test(CURR_DIR) ? CURR_DIR : `${CURR_DIR}/${projectName}`;
    if (!this.checkPath(`${CURR_DIR}/.git/hooks/`)) {
      return;
    }
    const filePath = `${CURR_DIR}/.git/hooks/pre-push`;
    const content = `#!/bin/bash

            master_branch='master'
            development_branch='development'
            current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\\(.*\\),\\1,')
            
            if [ $master_branch = $current_branch ] || [ $development_branch = $current_branch ]
            then
                echo 'Manual pushing to this project is restricted.'
                exit 1;
            fi`;
    writeFileSync(filePath, content);
    return true;
  }

  getProjectId() {
    if (!this.validRepository()) { return Promise.reject(); }
    const CURR_DIR = process.cwd();

    const projectConfig = require(`${CURR_DIR}/linkapi.json`);
    if (!projectConfig) {
      console.log('linkapi.json is not found, you must have a linkapi.json file in the project root.');
    }

    if (!projectConfig.id) {
      console.log('Project id not found, put the id of your project inside the file linkapi.json');
    }

    return projectConfig.id;
  }

  deletePushRestriction() {
    const filePath = `${CURR_DIR}/.git/hooks/pre-push`;
    if (!this.checkPath(filePath)) {
      return;
    }
    unlinkSync(filePath);
    return true;
  }

}

module.exports = new FileHelper();
