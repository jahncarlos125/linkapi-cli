const config = require('../config');
const jwtDecode = require('jwt-decode');
const {
  get
} = require('lodash');
const promptHelper = require('../helpers/prompt.helper');
const request = require('../helpers/request.helper');
const getEnv = require('./../env');
const subscriberService = require('../services/subscriber.service');
const internalApisService = require('../services/internal-apis.service');

async function handleSellerUser() {
  const subscribers = await subscriberService.list();
  if (!subscribers || !subscribers.length) {
    throw new Error('Error trying to login: Subscribers not found!');
  }
  const result = await promptHelper.list('subscriber', 'Choose a subscriber', subscribers.map((s) => s.fullname));
  const subscriber = subscribers.find((sub) => sub.fullname === result);
  return config.set('subscriberId', subscriber._id);
}

async function setSubscriber(userInfo, auto = false) {
  if ((userInfo && userInfo.externaltype !== 'seller') || (auto)) {
    return config.set('subscriberId', userInfo.externalid);
  }

  await handleSellerUser();
}

async function setEnv() {
  const url = `${getEnv('API_ULTRON_URL')}/environments/${config.get('subscriberId')}`;
  const subEnv = get(await internalApisService.call(url, {
    method: 'GET'
  }), 'data');
  if (!subEnv || !subEnv.values) {
    throw new Error('Environment variables not found!');
  }
  subEnv.values.forEach((variable) => config.set(variable.name, variable.value));
}


async function handleToken(body, auto = false) {
  if (!body || !body.access_token) {
    throw new Error('Error trying to login: Token not found!');
  }
  const token = body.access_token;
  const refreshToken = body.refresh_token;
  const userInfo = jwtDecode(token);
  config.set('token', token);
  config.set('userInfo', userInfo);
  config.set('refreshToken', refreshToken);
  await setSubscriber(userInfo, auto);
  await setEnv(userInfo.externalid);
}

function clearConfig() {
  ['subscriberId', 'token', 'userInfo', 'refreshToken'].forEach((prop) => config.set(prop, null));
}

async function login(options) {
  try {
    let username;
    let password;
    let auto = false;
    if (options.parent.args[1] === 'a') {
      const user = options.parent.args[2].split(':');
      username = user[0];
      password = user[1];
      auto = true;
    } else {
      username = await promptHelper.askInput('username', 'E-mail:');
      password = await promptHelper.askPassword('password', 'Password');
    }

    const url = `${getEnv('IDENTITY_URL')}/connect/token`;
    const form = {
      username,
      password,
      client_id: getEnv('CLIENT_ID'),
      client_secret: getEnv('CLIENT_SECRET'),
      grant_type: 'password'
    };
    const res = await request({
      url,
      method: 'POST',
      form
    });
    config.set('API_ULTRON_URL', null);
    await handleToken(get(res, 'body'), auto);
    console.log('Successfully authenticated');


  } catch (error) {
    const invalidLogin = get(error, 'body.error_description');
    if (invalidLogin && invalidLogin === 'invalid_username_or_password') {
      console.log('Invalid username or password.');
      return;
    }
    console.log(error.message || error);
  }
}

function logout() {
  clearConfig();
  console.log('You are disconnected...');
}


module.exports = {
  login,
  logout
};
