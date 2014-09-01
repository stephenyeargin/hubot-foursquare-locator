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

    require('../src/foursquare-locator')(@robot)

  it 'registers a respond listener for friends', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|swarm) friends/i)

  it 'registers a respond listener for approve', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|swarm) approve/i)

  it 'registers a respond listener for register', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|swarm) register/i)

  it 'registers a respond listener for mapping user as ID', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|swarm) ([a-zA-Z0-9]+) as ([0-9]+)/i)

  it 'registers a respond listener for forgetting a user', ->
    expect(@robot.respond).to.have.been.calledWith(/(foursquare|swarm) forget ([a-zA-Z0-9]+)/i)

  it 'registers a hear listener', ->
    expect(@robot.respond).to.have.been.calledWith(/where[ ']i?s ([a-zA-Z0-9 ]+)(\?)?$/i)