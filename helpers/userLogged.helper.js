const config = require('../config');

module.exports = (showMessage = true) => {
  const subscriber = config.get('subscriberId');
  if (subscriber) { return true; }
  if (showMessage) {
    console.log('\nOooops! \nYou must be authenticated, please run linkapi login! \n');
  }
};
