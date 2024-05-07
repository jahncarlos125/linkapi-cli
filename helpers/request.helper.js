const request = require('request');
const qs = require('querystring');

module.exports = (_options) => new Promise((resolve, reject) => {
  const options = _options;

  if (!options || !Object.keys(options).length) {
    throw new Error('Error trying to execute utils request: First param must be an object');
  }

  if (!options.url) {
    throw new Error('Error trying to execute utils request: Url not sent');
  }

  if (!options.method) {
    throw new Error('Error trying to execute utils request: Method not sent');
  }

  if (options.queryString) {
    options.url = `${options.url}?${qs.stringify(options.queryString)}`;
  }

  const config = {
    method: options.method,
    url: options.url,
    headers: options.headers || {},
    timeout: options.timeout || 240000,
    forever: true,
    rejectUnauthorized: false
  };

  if (Object.keys(options.body || {}).length) {
    config.body = options.body;
  }

  if (Object.keys(options.form || {}).length) {
    config.form = options.form;
  }

  if (options.encoding) {
    config.encoding = options.encoding;
  }

  if (Object.keys(options.formData || {}).length) {
    config.formData = options.formData;
  }

  if (options.json) {
    config.json = true;
  }

  if (typeof options.json !== 'boolean' && !options.json) {
    config.json = true;
  }

  request(config, (err, response, responseBody) => {
    if (err) { return reject(err); }

    const result = {
      body: responseBody,
      statusCode: response.statusCode,
      responseHeaders: response.headers || {}
    };

    if (response && response.statusCode && response.statusCode >= 300) {
      return reject(result);
    }

    return resolve(result);
  });
});
