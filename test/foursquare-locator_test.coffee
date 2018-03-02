Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper('../src/foursquare-locator.coffee')

describe 'hubot-foursquare-locator', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL = 'error'
    nock.disableNetConnect()

    nock('https://api.foursquare.com')
      .get('/v2/checkins/recent')
      .replyWithFile(200, __dirname + '/fixtures/checkins-recent.json')
    nock('https://api.foursquare.com')
      .get('/v2/users/self/friends')
      .replyWithFile(200, __dirname + '/fixtures/users-self-friends.json')

  afterEach ->
    nock.cleanAll()

  context 'foursquare locator tests', ->
    beforeEach ->
      process.env.FOURSQUARE_CLIENT_ID = 'abcefghijk'
      process.env.FOURSQUARE_CLIENT_SECRET = '123abc456efg'
      process.env.FOURSQUARE_ACCESS_TOKEN = 'abcefghijk123abc456efg'
      @room = helper.createRoom()

    afterEach ->
      @room.destroy()
      delete process.env.FOURSQUARE_CLIENT_ID
      delete process.env.FOURSQUARE_CLIENT_SECRET
      delete process.env.FOURSQUARE_ACCESS_TOKEN

    # hubot swarm friends
    it 'returns a list of recent checkins from friends', (done) ->
      selfRoom = @room
      selfRoom.user.say('alice', '@hubot swarm friends')

      setTimeout(() ->
        try
          expect(selfRoom.messages).to.eql [
            ['alice', '@hubot swarm friends']
          ]
          done()
        catch err
          done err
        return
      , 1000)

    # hubot swarm approve
    # hubot swarm register
    # hubot swarm <user> as <id>
    # hubot swarm forget <user>
    # hubot where is <user>?
