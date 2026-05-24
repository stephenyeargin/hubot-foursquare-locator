const { Adapter } = require('hubot');

class TestAdapter extends Adapter {
  async send(envelope, ...strings) {
    this.emit('send', envelope, strings);
  }

  async reply(envelope, ...strings) {
    this.emit('reply', envelope, strings);
  }

  async run() {
    this.emit('connected');
  }

  receive(message) {
    this.robot.receive(message);
  }
}

module.exports = {
  use(robot) {
    return new TestAdapter(robot);
  },
};
