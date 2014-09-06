# Description:
#   Get last checkin of your bot's friends
#
# Dependencies:
#   "node-foursquare": "0.2.0"
#   "moment": "~2.5.0"
#
# Configuration:
#   FOURSQUARE_CLIENT_ID
#   FOURSQUARE_CLIENT_SECRET
#   FOURSQUARE_ACCESS_TOKEN
#
# Commands:
#   hubot foursquare approve - Approves the bot user's pending friend requests
#   hubot foursquare friends - Lists the friends of the bot
#   hubot foursquare register - Tells how to friend the bot
#   hubot foursquare <user> as <user id> - Hints for the bot to locate a user
#   hubot foursquare forget <user> - Removes an existing hint to locate a user
#   where is <user>? - Filters recent checkins to a particular subset of users
#
# Notes:
#   To obtain/set the FOURSQUARE_ACCESS_TOKEN, you will need to go through the OAuth handshake manually with your bot's credentials
#
# Authors:
#   stephenyeargin, jfryman, brandonvalentine

Util = require "util"
moment = require "moment"

module.exports = (robot) ->

  config = secrets:
    clientId: process.env.FOURSQUARE_CLIENT_ID
    clientSecret: process.env.FOURSQUARE_CLIENT_SECRET
    accessToken: process.env.FOURSQUARE_ACCESS_TOKEN
    redirectUrl: "localhost"
  config.version = '20140401'

  foursquare = require('node-foursquare')(config);

  # Default action
  robot.respond /foursquare$/i, (msg) ->
    if missingEnvironmentForApi(msg)
      return

    friendActivity(msg)

  # Who are my friends?
  robot.respond /foursquare friends/i, (msg) ->

    if missingEnvironmentForApi(msg)
      return

    foursquare.Users.getFriends 'self', {}, config.secrets.accessToken, (error, response) ->

      # Loop through friends
      if response.friends.items.length > 0
        list = []
        for own key, friend of response.friends.items
          user_name = formatName friend
          list.push "#{user_name} (#{friend.id})"

        msg.send list.join(", ")
      else
        msg.send "Your bot has no friends. :("

  # Approve pending bot friend requests
  robot.respond /foursquare approve/i, (msg) ->

    if missingEnvironmentForApi(msg)
      return

    foursquare.Users.getRequests config.secrets.accessToken, (error, response) ->

      # Loop through requests
      if response.requests.length > 0

        for own key, friend of response.requests
          msg.http("https://api.foursquare.com/v2/users/#{friend.id}/approve?oauth_token=#{config.secrets.accessToken}&v=#{config.version}").post() (err, res, body) ->
            user_name = formatName friend
            msg.send "Approved: #{user_name}"
  
      # Your bot is lonely
      else
        msg.send "No friend requests to approve."

  # Tell people how to friend the bot
  robot.respond /foursquare register/i, (msg) ->

    if missingEnvironmentForApi(msg)
      return

    foursquare.Users.getUser 'self', config.secrets.accessToken, (error, response) ->
      profile_url = "https://foursquare.com/user/#{response.user.id}"
      user_name = formatName response.user
      msg.send "Head to #{profile_url} and friend #{user_name}!"
      msg.send response.user.bio if response.user.bio?

  # Identify your username with the bot
  robot.respond /foursquare ([a-zA-Z0-9]+) as ([0-9]+)/i, (msg) ->
    if msg.match[1] is 'me'
      actor = msg.message.user.name
    else
      actor = msg.match[1].trim()

    user_id = msg.match[2].trim()

    # Save to brain if not set
    if robot.brain.data.foursquare[actor]?
      previous = robot.brain.data.foursquare[actor]
      msg.send "Cannot save #{actor} as #{user_id} because it already set to '#{previous}'."
      msg.send "Use `#{robot.name} foursquare forget #{actor}` to set a new value."
      return;

    robot.brain.data.foursquare[actor] = user_id

    msg.send "Ok, I have #{actor} as #{user_id} on Foursquare."

  # Stop remembering a particular username
  robot.respond /foursquare forget ([a-zA-Z0-9]+)/i, (msg) ->

    actor = msg.match[1].trim()

    # Remove from brain if set
    if robot.brain.data.foursquare[actor]?
      previous = robot.brain.data.foursquare[actor]
      delete robot.brain.data.foursquare[actor]
      msg.send "I no longer know #{actor} as #{previous} on Foursquare."
      return;

    msg.send "I don't know who #{actor} is on Foursquare."

  # Find your friends
  robot.respond /where[ ']i?s ([a-zA-Z0-9 ]+)(\?)?$/i, (msg) ->

    if missingEnvironmentForApi(msg)
      return

    searchterm = msg.match[1].toLowerCase()

    # You must be bored
    if (searchterm == "everyone" || searchterm == "everybody")

      friendActivity(msg)

    # Check if user id is stored in brain
    else if robot.brain.data.foursquare[searchterm]?

      user_id = robot.brain.data.foursquare[searchterm]

      foursquare.Users.getUser user_id, config.secrets.accessToken, (error, response) ->

        if error?
          msg.send error
          return

        user_name = formatName response.user
        checkin = response.user.checkins.items[0]

        unless checkin?
          msg.send "#{user_name} is nowhere to be found."

        timeFormatted = moment(new Date(checkin.createdAt*1000)).fromNow()
        msg.send "#{user_name} was at #{checkin.venue.name}, #{checkin.venue.location.city}, #{checkin.venue.location.state} #{timeFormatted}"

    else
      # Nothing stored. Do simple looping instead
      foursquare.Checkins.getRecentCheckins {limit: 100}, config.secrets.accessToken, (error, response) ->

        # Loop through friends
        found = 0
        for own key, checkin of response.recent

          # Skip if no string match
          user_name = formatName checkin.user
          user_name_match = user_name.toLowerCase()
          if ~user_name_match.indexOf searchterm
            timeFormatted = moment(new Date(checkin.createdAt*1000)).fromNow()
            msg.send "#{user_name} was at #{checkin.venue.name}, #{checkin.venue.location.city}, #{checkin.venue.location.state} #{timeFormatted}"
            found++

        # If loop failed to come up with a result, tell them
        if found is 0
          msg.send "Could not find a recent checkin from #{searchterm}."

  # Get all recent checkins
  friendActivity = (msg) ->
    foursquare.Checkins.getRecentCheckins {limit: 5}, config.secrets.accessToken, (error, response) ->

      for own key, checkin of response.recent
        user_name = formatName checkin.user
        timeFormatted = moment(new Date(checkin.createdAt*1000)).fromNow()
        msg.send "#{user_name} was at #{checkin.venue.name}, #{checkin.venue.location.city}, #{checkin.venue.location.state} #{timeFormatted}"

  # Check for required config
  missingEnvironmentForApi = (msg) ->
    missingAnything = false
    unless config.secrets.clientId?
      msg.send "Foursquare API Client ID is missing: Ensure that FOURSQUARE_CLIENT_ID is set."
      missingAnything |= true
    unless config.secrets.clientSecret?
      msg.send "Foursquare API Client Secret is missing: Ensure that FOURSQUARE_CLIENT_SECRET is set."
      missingAnything |= true
    unless config.secrets.accessToken?
      msg.send "Foursquare API Access Token is missing: Ensure that FOURSQUARE_ACCESS_TOKEN is set."
      missingAnything |= true
    missingAnything

  # Format a name string
  formatName = (user) ->
    if user.lastName?
      return "#{user.firstName} #{user.lastName}"
    else if user.firstName?
      return user.firstName
    else
      return "(No Name)"
