const git = require('simple-git/promise');
const fileHelper = require('./file.helper');
const getEnv = require('../env');
const config = require('../config');

class GitHelper {

  async clone(project, branch = 'master') {
    const { repository } = project;
    const repoPath = `https://user:${getEnv('VSTS_PASS')}@lkps.visualstudio.com/${getEnv('VSTS_PROJECT')}/_git/${repository.name}`;
    const folderName = project.name.replace(/[^0-9a-z]+/gi, '');
    await git().silent(true).clone(repoPath, folderName, `-b${branch}`);
    return `${process.cwd()}/${folderName}`;
  }

  async pull(branch) {
    try {
      fileHelper.validRepository();
      await git().silent(true).pull('origin', branch);
      return true;
    } catch (error) {
      this.showConflictedFiles();
    }

  }

  async showConflictedFiles() {
    const workingTreeStatus = await git().status();
    if (workingTreeStatus.conflicted && workingTreeStatus.conflicted.length) {
      const files = workingTreeStatus.conflicted.map((file) => `${file} \n`);
      console.log(`Conflicted files were found at paths below: \n${files} \nPlease solve them and use: linkapi project commit`);
    }
  }

  async push(branch) {
    try {
      fileHelper.validRepository();
      await git().silent(true).push(['-u', 'origin', branch]);
    } catch (error) {
      if (/remote contains work that you do/.test(error.message)) {
        console.log('Updates were rejected because the remote contains work that you do not have locally.\nPlease use: linkapi project sync');
        return;
      }
      throw error;
    }
  }

  async commit(_message = 'Update my project', projectName) {
    fileHelper.validRepository();
    const userInfo = config.get('userInfo');
    const message = `${_message} - ${userInfo.given_name} ${userInfo.middle_name}`;
    await git().add('./*');
    await git().commit(message);
    // const enablePush = fileHelper.deletePushRestriction();

    // if (!enablePush) {
    //   throw new Error('Error trying to commit project.');
    // }

    await this.push('development');
    return true;
  }

  async merge(source, target) {
    fileHelper.validRepository();
    const branch = await this.getBranch();

    if (branch !== source) { await git().checkout(source); }

    await this.pull(source);
    await git().push(['-u', 'origin', source]);
    await git().checkout(target);
    await this.pull(target);
    await git().mergeFromTo(source, target, '--allow-unrelated-histories');
    await git().push(['-u', 'origin', target]);
    await git().checkout(source);
  }

  async discard() {
    fileHelper.validRepository();
    await git().clean('fd');
    return git().reset('hard');
  }

  async getBranch() {
    fileHelper.validRepository();
    const branches = await git().branchLocal();
    if (branches) {
      return branches.current;
    }
  }

  async getModifiedFiles() {
    try {
      fileHelper.validRepository();
      const statusSummary = await git().status();
      const formattedStatus = JSON.parse(JSON.stringify(statusSummary));
      return [
        ...formattedStatus.modified, ...formattedStatus.not_added, ...formattedStatus.created];
    } catch (error) {
      const err = (error instanceof Error) ? error : new Error(error);
      console.log(err.message);
    }
  }
}

module.exports = new GitHelper();
