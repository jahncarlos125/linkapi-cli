const { get } = require('lodash');
const config = require('./config');

const defaultEnvs = {
  API_ULTRON_URL: 'https://api-ultron.linkapi.solutions/v3',
  IDENTITY_URL: 'https://identity.linkapi.com.br',
  CLIENT_ID: 'lkp_developer_portal_1',
  CLIENT_SECRET: 'b81d201777824a868974246fe816da38'

};

function getEnv(name) {
  return config.get(name) || get(defaultEnvs, name);
}

module.exports = getEnv;
