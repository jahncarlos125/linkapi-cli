const VALID_BRANCHES = ['master', 'development'];
const gitHelper = require('./git.helper');

async function isValidBranch() {
  const branch = await gitHelper.getBranch();

  if (!VALID_BRANCHES.includes(branch)) {
    throw new Error(`The local branch ${branch} is invalid.`);
  }
}

async function checkBranch(branchName) {
  const selectedBranch = await gitHelper.getBranch();
  if (selectedBranch !== branchName) {
    throw new Error(`You can not perform this operation on the ${selectedBranch} branch.`);
  }

}

module.exports = { isValidBranch, checkBranch };
