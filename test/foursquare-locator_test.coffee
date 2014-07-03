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

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare friends/i)

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare approve/i)

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare register/i)

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare ([a-zA-Z0-9]+) as ([0-9]+)/i)

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare forget ([a-zA-Z0-9]+)/i)

  it 'registers a hear listener', ->
    expect(@robot.respond).to.have.been.calledWith(/where[ ']i?s ([a-zA-Z0-9 ]+)(\?)?/i)