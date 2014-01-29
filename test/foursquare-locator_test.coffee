chai = require 'chai'
sinon = require 'sinon'
chai.use require 'sinon-chai'

expect = chai.expect

describe 'foursquare-locator', ->
  beforeEach ->
    @robot =
      respond: sinon.spy()
      hear: sinon.spy()

    require('../src/foursquare-locator')(@robot)

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare friends/)

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare approve/)

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare register/)

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare ([a-zA-Z0-9]+) as ([0-9]+)/)

  it 'registers a respond listener', ->
    expect(@robot.respond).to.have.been.calledWith(/foursquare forget ([a-zA-Z0-9]+)/)

  it 'registers a hear listener', ->
    expect(@robot.hear).to.have.been.calledWith(/where[ ']i?s ([a-zA-Z0-9 ]+)(\?)?/)