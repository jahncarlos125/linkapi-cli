const apisService = require('./internal-apis.service');
const { promptHelper } = require('../helpers/index');
const getEnv = require('../env');
const { get } = require('lodash');

class AutomationtService {

  async list(project, queryString) {
    const url = `${getEnv('API_ULTRON_URL')}/projects/${project._id}/repositories/${project.repository.id}/automations`;
    const res = await apisService.call(url, { method: 'GET', queryString });
    const automations = get(res, 'data');
    if (!automations || !automations.length) {
      throw new Error('Automations files not found!');
    }
    return automations;
  }

  async askAutomation(project, branch) {
    const automations = await this.list(project, { branch });
    return promptHelper.list('automation', 'Select an automation:', automations.map((a) => a.value));
  }

}

module.exports = new AutomationtService();
