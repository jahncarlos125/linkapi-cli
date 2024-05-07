const { writeFileSync, existsSync } = require('fs');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

const emptyFunction = 'module.exports = async (data, linkapi) => {\n\n}';
const rgx = /\\/g;

function pathIsValid(path) {
  return existsSync(path);
}

function createDirectory(path) {
  return new Promise((resolve, reject) => {
    mkdirp(getDirName(path), async (err) => {
      if (err) { return reject(err); }
      resolve();
    });
  });
}

async function generateFile(path) {
  const CURR_DIR = process.cwd();
  const writePath = `${CURR_DIR}\\${path}.js`.replace(rgx, '/');
  const valid = await pathIsValid(writePath);
  if (!valid) { throw new Error('Invalid path!'); }
  await createDirectory(writePath);
  const result = writeFileSync(writePath, emptyFunction, 'utf8');
  return result;
}

module.exports = generateFile;
