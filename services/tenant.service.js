const apisService = require('./internal-apis.service');
const {
  promptHelper
} = require('../helpers/index');
const config = require('../config');
const getEnv = require('../env');
const {
  get
} = require('lodash');


class TenantService {
  async list(queryString = {
    limit: 100000,
    subscriber: config.get('subscriberId')
  }) {
    const baseUrl = `${getEnv('API_ULTRON_URL')}/tenant`;
    const tenantsData = await apisService.call(baseUrl, {
      method: 'GET',
      queryString
    });
    const tenants = get(tenantsData, 'data');
    if (!tenants || !tenants.length) {
      throw new Error('Tenants not found!');
    }
    return tenants;
  }

  async askTenant() {
    const tenants = await this.list();
    const selectedTenant = await promptHelper.list('tenant', 'Select a tenant', tenants.map((t) => t.title));
    return tenants.find((t) => t.title === selectedTenant);
  }

  async getTenant(tenant) {
    const tenants = await this.list();
    if (!tenant) {
      console.log(`Default tenant selected: ${tenants[0].title} \n`);
      return tenants[0];
    }
    const selectedTenant = tenants
      .find((tnt) => String(tnt._id) === tenant || tnt.title === tenant);

    if (!selectedTenant || !selectedTenant._id) {
      throw new Error('Invalid tenant!');
    }

    return selectedTenant;
  }

  async getJson() {
    const tenants = await this.list();
    const response = [];
    for (const tenant of tenants) {
      response.push({
        id: tenant._id,
        title: tenant.title
      });
    }
    console.log(JSON.stringify(response));
    return response;
  }

}

module.exports = new TenantService();
