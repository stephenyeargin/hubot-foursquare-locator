const {
  describe, it, beforeEach, afterEach,
} = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const nock = require('nock');
const { createTestBot } = require('./common/TestBot');

const FIXTURES = path.resolve(__dirname, 'fixtures');

// Fixed time: Tue Mar 06 2018 23:01:27 GMT-0600 (CST)
const MOCK_NOW = Date.parse('Tue Mar 06 2018 23:01:27 GMT-0600 (CST)');

function setupNocks() {
  nock('https://api.foursquare.com')
    .get('/v2/users/self/friends?oauth_token=foobarbaz&v=20140806')
    .replyWithFile(200, `${FIXTURES}/users-self-friends.json`);
  nock('https://api.foursquare.com')
    .get('/v2/checkins/recent?limit=5&oauth_token=foobarbaz&v=20140806')
    .replyWithFile(200, `${FIXTURES}/checkins-recent.json`);
  nock('https://api.foursquare.com')
    .get('/v2/checkins/recent?limit=100&oauth_token=foobarbaz&v=20140806')
    .replyWithFile(200, `${FIXTURES}/checkins-recent.json`);
  nock('https://api.foursquare.com')
    .get('/v2/users/self?oauth_token=foobarbaz&v=20140806')
    .replyWithFile(200, `${FIXTURES}/users-self.json`);
  nock('https://api.foursquare.com')
    .get('/v2/users/requests?oauth_token=foobarbaz&v=20140806')
    .replyWithFile(200, `${FIXTURES}/users-requests.json`);
}

describe('hubot-foursquare-locator', () => {
  let ctx;
  let originalDateNow;

  beforeEach(async () => {
    originalDateNow = Date.now;
    Date.now = () => MOCK_NOW;
    ctx = await createTestBot();
    setupNocks();
  });

  afterEach(() => {
    Date.now = originalDateNow;
    ctx.shutdown();
  });

  it('returns a list of recent friend checkins (hubot swarm)', async () => {
    await ctx.send('hubot swarm');
    // Allow extra time for all async sends to arrive
    await new Promise((r) => { setTimeout(r, 100); });
    assert.equal(ctx.sends[0], 'Brandon Valentine was at Bridgestone Arena Nashville TN 3 hours ago');
    assert.equal(ctx.sends[1], "James White was at Von Elrod's Beer Garden & Sausage House Nashville TN 3 hours ago");
    assert.equal(ctx.sends[2], "Rick Bradley was at Von Elrod's Beer Garden & Sausage House Nashville TN 3 hours ago");
    assert.equal(ctx.sends[3], "John Northrup was at Von Elrod's Beer Garden & Sausage House Nashville TN 3 hours ago");
    assert.equal(ctx.sends[4], "Aziz Shamim was at Von Elrod's Beer Garden & Sausage House Nashville TN 4 hours ago");
    assert.equal(ctx.sends.length, 5);
  });

  it('returns a list of friends (hubot swarm friends)', async () => {
    const response = await ctx.sendAndWaitForResponse('hubot swarm friends');
    assert.equal(response, 'Chris Horton (9385328), James Fryman (4646612), Jeremy Holland (11317361)');
  });

  it('approves pending friend requests (hubot swarm approve)', async () => {
    const response = await ctx.sendAndWaitForResponse('hubot swarm approve');
    assert.equal(response, 'No friend requests to approve.');
  });

  it('returns the registration instructions (hubot swarm register)', async () => {
    await ctx.send('hubot swarm register');
    await new Promise((r) => { setTimeout(r, 100); });
    assert.equal(ctx.sends[0], '1) Search for WebSages Robot <email@example.com> in the Swarm application and send a friend request.');
    assert.equal(ctx.sends[1], '2) Type `hubot foursquare approve`');
    assert.equal(ctx.sends[2], "I'm just a bot in the world. That's all that they'll let me be.");
  });

  it('sets an alias for a user ID (hubot swarm <user> as <id>)', async () => {
    const response = await ctx.sendAndWaitForResponse('hubot swarm johndoe as 12345');
    assert.equal(response, 'Ok, I have johndoe as 12345 on Foursquare.');
  });

  it('forgets an alias for a user ID (hubot swarm forget <user>)', async () => {
    await ctx.send('hubot swarm johndoe as 12345');
    await new Promise((r) => { setTimeout(r, 50); });
    const response = await ctx.sendAndWaitForResponse('hubot swarm forget johndoe');
    assert.equal(response, 'I no longer know johndoe as 12345 on Foursquare.');
  });

  it("finds a particular user's latest checkin (hubot where is <user>?)", async () => {
    const response = await ctx.sendAndWaitForResponse('hubot where is james?');
    assert.equal(response, "James White was at Von Elrod's Beer Garden & Sausage House Nashville TN 3 hours ago");
  });
});
