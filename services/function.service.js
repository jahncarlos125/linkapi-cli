const apisService = require('./internal-apis.service');
const getEnv = require('../env');
const config = require('../config');
const { get } = require('lodash');

class FunctionstService {

  async list() {
    const url = `${getEnv('API_ULTRON_URL')}/functions`;
    const queryString = {
      subscriber: config.get('subscriberId'),
      limit: 500,
      _sort_displayName: 'asc',
    }
    const res = await apisService.call(url, { method: 'GET', queryString });
    const functions = get(res, 'data');
    if (!functions || !functions.length) {
      return [];
    }
    return functions;
  }

}

module.exports = new FunctionstService();
