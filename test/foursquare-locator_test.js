/* eslint-disable func-names */
/* global describe beforeEach afterEach it context */

const Helper = require('hubot-test-helper');
const chai = require('chai');
const nock = require('nock');

const {
  expect,
} = chai;

const helper = new Helper('../src/foursquare-locator.js');

// Alter time as test runs
const originalDateNow = Date.now;
const mockDateNow = () => Date.parse('Tue Mar 06 2018 23:01:27 GMT-0600 (CST)');

describe('hubot-foursquare-locator', () => {
  beforeEach(() => {
    process.env.HUBOT_LOG_LEVEL = 'error';
    nock.disableNetConnect();

    nock('https://api.foursquare.com')
      .get('/v2/users/self/friends?oauth_token=foobarbaz&v=20140806')
      .replyWithFile(200, `${__dirname}/fixtures/users-self-friends.json`);
    nock('https://api.foursquare.com')
      .get('/v2/checkins/recent?limit=5&oauth_token=foobarbaz&v=20140806')
      .replyWithFile(200, `${__dirname}/fixtures/checkins-recent.json`);
    nock('https://api.foursquare.com')
      .get('/v2/checkins/recent?limit=100&oauth_token=foobarbaz&v=20140806')
      .replyWithFile(200, `${__dirname}/fixtures/checkins-recent.json`);
    nock('https://api.foursquare.com')
      .get('/v2/users/self?oauth_token=foobarbaz&v=20140806')
      .replyWithFile(200, `${__dirname}/fixtures/users-self.json`);
    nock('https://api.foursquare.com')
      .get('/v2/users/requests?oauth_token=foobarbaz&v=20140806')
      .replyWithFile(200, `${__dirname}/fixtures/users-requests.json`);
  });

  afterEach(() => nock.cleanAll());

  context('foursquare locator tests', () => {
    beforeEach(function () {
      process.env.FOURSQUARE_CLIENT_ID = 'foobarbaz';
      process.env.FOURSQUARE_CLIENT_SECRET = 'foobarbaz';
      process.env.FOURSQUARE_ACCESS_TOKEN = 'foobarbaz';
      this.room = helper.createRoom();
      Date.now = mockDateNow;
    });

    afterEach(function () {
      Date.now = originalDateNow;
      this.room.destroy();
      delete process.env.FOURSQUARE_CLIENT_ID;
      delete process.env.FOURSQUARE_CLIENT_SECRET;
      delete process.env.FOURSQUARE_ACCESS_TOKEN;
    });

    // hubot swarm
    it('returns a list of recent friend checkins', function (done) {
      const selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot swarm');

      setTimeout(
        () => {
          try {
            expect(selfRoom.messages).to.eql([
              ['alice', '@hubot swarm'],
              ['hubot', 'Brandon Valentine was at Bridgestone Arena Nashville TN 3 hours ago'],
              ['hubot', 'James White was at Von Elrod\'s Beer Garden & Sausage House Nashville TN 3 hours ago'],
              ['hubot', 'Rick Bradley was at Von Elrod\'s Beer Garden & Sausage House Nashville TN 3 hours ago'],
              ['hubot', 'John Northrup was at Von Elrod\'s Beer Garden & Sausage House Nashville TN 3 hours ago'],
              ['hubot', 'Aziz Shamim was at Von Elrod\'s Beer Garden & Sausage House Nashville TN 4 hours ago'],
            ]);
            done();
          } catch (err) {
            done(err);
          }
        },
        100,
      );
    });

    // hubot swarm friends
    it('returns a list of friends', function (done) {
      const selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot swarm friends');

      setTimeout(
        () => {
          try {
            expect(selfRoom.messages).to.eql([
              ['alice', '@hubot swarm friends'],
              ['hubot', 'Chris Horton (9385328), James Fryman (4646612), Jeremy Holland (11317361)'],
            ]);
            done();
          } catch (err) {
            done(err);
          }
        },
        100,
      );
    });

    // hubot swarm approve
    it('approves pending friend requests', function (done) {
      const selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot swarm approve');

      setTimeout(
        () => {
          try {
            expect(selfRoom.messages).to.eql([
              ['alice', '@hubot swarm approve'],
              ['hubot', 'No friend requests to approve.'],
            ]);
            done();
          } catch (err) {
            done(err);
          }
        },
        100,
      );
    });

    // hubot swarm register
    it('returns the registration instructions', function (done) {
      const selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot swarm register');

      setTimeout(
        () => {
          try {
            expect(selfRoom.messages).to.eql([
              ['alice', '@hubot swarm register'],
              ['hubot', '1) Search for WebSages Robot <email@example.com> in the Swarm application and send a friend request.'],
              ['hubot', '2) Type `hubot foursquare approve`'],
              ['hubot', 'I\'m just a bot in the world. That\'s all that they\'ll let me be.'],
            ]);
            done();
          } catch (err) {
            done(err);
          }
        },
        100,
      );
    });

    // hubot swarm <user> as <id>
    it('set an alias for a user ID', function (done) {
      const selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot swarm johndoe as 12345');

      setTimeout(
        () => {
          try {
            expect(selfRoom.messages).to.eql([
              ['alice', '@hubot swarm johndoe as 12345'],
              ['hubot', 'Ok, I have johndoe as 12345 on Foursquare.'],
            ]);
            done();
          } catch (err) {
            done(err);
          }
        },
        100,
      );
    });

    // hubot swarm forget <user>
    it('forget an alias for a user ID', function (done) {
      const selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot swarm johndoe as 12345');
      selfRoom.user.say('alice', '@hubot swarm forget johndoe');

      setTimeout(
        () => {
          try {
            expect(selfRoom.messages).to.eql([
              ['alice', '@hubot swarm johndoe as 12345'],
              ['alice', '@hubot swarm forget johndoe'],
              ['hubot', 'Ok, I have johndoe as 12345 on Foursquare.'],
              ['hubot', 'I no longer know johndoe as 12345 on Foursquare.'],
            ]);
            done();
          } catch (err) {
            done(err);
          }
        },
        100,
      );
    });

    // hubot where is <user>?
    it('finds a particular user\'s latest checkin', function (done) {
      const selfRoom = this.room;
      selfRoom.user.say('alice', '@hubot where is james?');

      setTimeout(
        () => {
          try {
            expect(selfRoom.messages).to.eql([
              ['alice', '@hubot where is james?'],
              ['hubot', 'James White was at Von Elrod\'s Beer Garden & Sausage House Nashville TN 3 hours ago'],
            ]);
            done();
          } catch (err) {
            done(err);
          }
        },
        100,
      );
    });
  });
});
