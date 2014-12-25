chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

describe 'foursquare-locator', ->
  beforeEach ->

    # Must be defined so as to avoid throwing errors in lower scripts
    process.env.FOURSQUARE_CLIENT_ID = 'somedata'
    process.env.FOURSQUARE_CLIENT_SECRET = 'somedata'
    process.env.FOURSQUARE_ACCESS_TOKEN = 'somedata'

    @robot =
      respond: sinon.spy()
      hear: sinon.spy()
      brain:
        data: {}

    require('../src/foursquare-locator')(@robot)

  it 'registers a respond listener for friends', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|4sq|swarm) friends/i)

  it 'registers a respond listener for approve', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|4sq|swarm) approve/i)

  it 'registers a respond listener for register', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|4sq|swarm) register/i)

  it 'registers a respond listener for mapping user as ID', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|4sq|swarm) ([a-zA-Z0-9]+) as ([0-9]+)/i)

  it 'registers a respond listener for forgetting a user', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|4sq|swarm) forget ([a-zA-Z0-9]+)/i)

  it 'registers a hear listener', ->
    expect(@robot.respond).to.have.been.calledWith(/where[ ']i?s ([a-zA-Z0-9 ]+)(\?)?$/i)
