const apisService = require('./internal-apis.service');
const getEnv = require('../env');
const config = require('../config');
const { get } = require('lodash');

class ComponentService {

  async list() {
    const url = `${getEnv('API_ULTRON_URL')}/application`;
    const queryString = {
      subscriber: config.get('subscriberId'),
      privacy: 'all',
      limit: 500,
      _sort_displayName: 'asc',
      category: 'all',
      skip: 0
    };
    const res = await apisService.call(url, { method: 'GET', queryString });
    const components = get(res, 'data');
    if (!components || !components.length) {
      throw new Error('Components not found!');
    }
    return components;
  }

}

module.exports = new ComponentService();
