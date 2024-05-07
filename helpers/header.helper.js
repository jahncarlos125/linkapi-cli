const config = require('../config');

class HeaderHelper {

  mount() {
    const token = config.get('token');
    return {
      Authorization: `Bearer ${token}`
    };
  }
}

module.exports = new HeaderHelper();
