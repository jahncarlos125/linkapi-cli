const { branchHelper, fileHelper, gitHelper } = require('../helpers');
const socketService = require('./socket.service');
const tenantService = require('./tenant.service');
const apisService = require('./internal-apis.service');
const { v4: uuidv4 } = require('uuid');
const getEnv = require('../env');
const os = require('os');

function formatFiles(files, _selectedFilePath) {
  const repoBasePath = process.cwd();
  const selectedFilePath = _selectedFilePath.replace(`${repoBasePath}/`, '');
  return [...files, selectedFilePath].map((path) => (
    {
      path: `/${path}`,
      isSelected: (path === selectedFilePath),
      content: os.platform() !== 'linux' ? fileHelper.readFile(path, 'utf8') : fileHelper.readFile(`${repoBasePath}/${path}`, 'utf8')
    }
  ));
}

async function run(options = {}) {
  try {
    const branch = 'development';
    await branchHelper.checkBranch(branch);
    const { path, tenant, params } = options;
    const selectedFilePath = path.slice(-3) === '.js' ? path : `${path}.js`;
    if (!fileHelper.checkPath(selectedFilePath)) { throw new Error('Path not found'); }
    const modifiedFiles = await gitHelper.getModifiedFiles();
    const projectId = fileHelper.getProjectId();
    await socketService.connect();
    const socketUserId = uuidv4();
    socketService.emit('join', { id: socketUserId });
    socketService.listen('receive-logs', socketUserId);
    const selectedTenant = await tenantService.getTenant(tenant);
    const body = {
      tenant: selectedTenant._id,
      socketConnectionId: socketService.connectionId,
      params: fileHelper.getParams(params),
      items: formatFiles(modifiedFiles, selectedFilePath),
      socketUserId
    };
    const queryString = { branch, cli: true };
    await apisService.call(`${getEnv('API_EXECUTION')}/projects/${projectId}/execute`, { method: 'POST', queryString, body });
  } catch (error) {
    console.log(`Error trying to run file: ${error.message || 'Unexpected error'}`);
  } finally {
    socketService.close();
  }
}

module.exports = { run };
