const { headerHelper, request } = require('../helpers');
const config = require('../config');
const getEnv = require('../env');
const { retry } = require('@lifeomic/attempt');
const { get } = require('lodash');

function forceLogout() {
  config.set('subscriberId', null);
  throw new Error('\nOooops! \nYou must be authenticated, please run linkapi login! \n');
}

async function handleRefreshToken() {
  const refreshToken = config.get('refreshToken');
  if (!refreshToken) { forceLogout(); }
  const options = {
    url: `${getEnv('IDENTITY_URL')}/connect/token`,
    method: 'POST',
    form: {
      client_id: getEnv('CLIENT_ID'),
      client_secret: getEnv('CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }
  };
  const result = await request(options);
  const token = get(result, 'body.access_token');
  if (!token) { forceLogout(); }
  config.set('token', token);
  config.set('refreshToken', get(result, 'body.refresh_token'));
}

function handleError(err, context) {
  if (err.statusCode && err.statusCode === 401) {
    return handleRefreshToken();
  }
  context.abort();
}

async function call(url, options) {
  let maxAttempts = 2;

  if (options.method === 'GET') {
    maxAttempts = 3;
  }

  const result = await retry(async () => {
    const headers = { ...options.headers, ...headerHelper.mount() };

    return request({ timeout: 20000, ...options, url, headers });
  }, {
    delay: 1500,
    factor: 1,
    maxAttempts,
    handleError
  });

  return result.body;
}


module.exports = { call };
