const config = require('../config');
const apisService = require('./internal-apis.service');
const getEnv = require('../env');
const {
  get
} = require('lodash');

class SubscriberService {
  async list(queryString = {
    limit: 100000,
    freemium: false
  }) {
    const url = `${getEnv('API_ULTRON_URL')}/subscriber`;
    const result = await apisService.call(url, {
      method: 'GET',
      queryString
    });
    return get(result, 'data');
  }

  async setEnv() {
    const url = `${getEnv('API_ULTRON_URL')}/environments/${config.get('subscriberId')}`;
    const subEnv = get(await apisService.call(url, {
      method: 'GET'
    }), 'data');
    if (!subEnv || !subEnv.values) {
      throw new Error('Environment variables not found!');
    }
    subEnv.values.forEach((variable) => config.set(variable.name, variable.value));
  }

  async getSubscriber(subscriber) {
    const subscribers = await this.list();
    if (!subscriber) {
      console.log(`Default tenant selected: ${subscribers[0].title} \n`);
      return subscribers[0];
    }

    const selectedSubscriber = subscribers
      .find((tnt) => String(tnt._id) === subscriber || tnt.fullname.toLowerCase() === subscriber.toLowerCase());

    if (!selectedSubscriber || !selectedSubscriber._id) {
      throw new Error('Invalid subscriber!');
    }

    return selectedSubscriber;
  }

  async set(subscriber) {
    try {
      const userInfo = await config.get('userInfo');
      if (userInfo && userInfo.externaltype !== 'seller') {
        throw new Error('Invalid operation!');
      }

      const _subscriber = await this.getSubscriber(subscriber);
      await config.set('subscriberId', _subscriber._id);

      await this.setEnv();

      console.log(`Subscriber ${_subscriber.fullname} has been defined`);
    } catch (error) {
      console.log(`Error trying to change subscriber: ${error.message || 'Unexpected error'}`);
    }
  }

  async getJson() {
    const subscribers = await this.list();
    const response = [];
    for (const subscriber of subscribers) {
      response.push({
        id: subscriber._id,
        title: subscriber.fullname
      });
    }
    console.log(JSON.stringify(response));
    return response;
  }

}

module.exports = new SubscriberService();
