const getEnv = require('../env');
const io = require('socket.io-client');


class SocketService {
  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(getEnv('API_SOCKET'), { reconnect: true });
      this.socket.on('connect', () => resolve());
      this.socket.on('connect_error', (err) => reject(err));
      this.socket.on('error', (err) => reject(err));
    });

  }

  close() {
    try {
      if (!this.socket) { return; }
      this.socket.close();
      this.socket = null;
    } catch (err) {
      // do nothing
    }
  }

  get connectionId() {
    return this.socket.id;
  }

  emit(eventName, data) {
    return this.socket.emit(eventName, data);
  }

  removeListener(eventName) {
    return this.socket.removeListener(eventName);
  }

  listen(eventName, socketUserId) {
    this.socket.on(eventName, (data) => {
      if (!data || !data.length || data.includes(socketUserId)) {
        return;
      }
      data.forEach((element) => {
        try {
          console.log(JSON.stringify(element, null, 4));
        } catch (err) {
          console.log(element);
        }
      });
    });
  }
}

module.exports = new SocketService();
