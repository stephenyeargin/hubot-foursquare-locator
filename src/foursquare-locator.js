// Description:
//   Get last checkin of your bot's friends
//
// Dependencies:
//   "node-foursquare": "0.2.0"
//   "moment": "~2.5.0"
//
// Configuration:
//   FOURSQUARE_CLIENT_ID
//   FOURSQUARE_CLIENT_SECRET
//   FOURSQUARE_ACCESS_TOKEN
//
// Commands:
//   hubot foursquare - Shows list of recent checkins
//   hubot foursquare approve - Approves the bot user's pending friend requests
//   hubot foursquare friends - Lists the friends of the bot
//   hubot foursquare register - Tells how to friend the bot
//   hubot foursquare <user> as <user id> - Hints for the bot to locate a user
//   hubot foursquare forget <user> - Removes an existing hint to locate a user
//   hubot where is <user>? - Filters recent checkins to a particular subset of users
//   hubot where is everybody? - Shows list of recent checkins
//
// Notes:
//   To obtain/set the FOURSQUARE_ACCESS_TOKEN, you will need to go through the OAuth handshake
//   manually with your bot's credentials
//
// Authors:
//   stephenyeargin, jfryman, brandonvalentine, watson

const moment = require('moment');
const Foursquare = require('node-foursquare');

module.exports = (robot) => {
  const config = {
    secrets: {
      clientId: process.env.FOURSQUARE_CLIENT_ID,
      clientSecret: process.env.FOURSQUARE_CLIENT_SECRET,
      accessToken: process.env.FOURSQUARE_ACCESS_TOKEN,
      redirectUrl: 'localhost',
    },
  };
  config.foursquare = {
    mode: 'foursquare',
    version: '20140806',
  };
  config.winston = {
    loggers: {
      core: {
        console: {
          level: process.env.HUBOT_LOG_LEVEL,
        },
      },
    },
  };

  if (!robot.brain.data.foursquare) { robot.brain.data.foursquare = {}; }

  const foursquare = Foursquare(config);

  const handleError = (error, msg) => {
    robot.logger.error(error);
    msg.send(error);
  };

  // Chunk an array
  const arrayChunk = (array, chunkSize) => [].concat(...array.map((elem, i) => {
    if (i % chunkSize) {
      return [];
    }
    return [array.slice(i, i + chunkSize)];
  }));

  // Format a name string
  const formatName = (user) => {
    if (user.lastName != null) {
      return `${user.firstName} ${user.lastName}`;
    } if (user.firstName != null) {
      return user.firstName;
    }
    return '(No Name)';
  };

  // Get all recent checkins
  const friendActivity = (msg) => foursquare.Checkins.getRecentCheckins({
    limit: 5,
  }, config.secrets.accessToken, (error, response) => {
    if (error != null) {
      handleError(error, msg);
      return;
    }

    response.recent.forEach((checkin) => {
      const userName = formatName(checkin.user);
      const timeFormatted = moment(new Date(checkin.createdAt * 1000)).fromNow();
      msg.send(`${userName} was at ${checkin.venue.name} ${checkin.venue.location.city || ''} ${checkin.venue.location.state || ''} ${timeFormatted}`);
    });
  });

  // Check for required config
  const missingEnvironmentForApi = (msg) => {
    let missingAnything = false;
    if (config.secrets.clientId == null) {
      msg.send('Foursquare API Client ID is missing: Ensure that FOURSQUARE_CLIENT_ID is set.');
      missingAnything = true;
    }
    if (config.secrets.clientSecret == null) {
      msg.send('Foursquare API Client Secret is missing: Ensure that FOURSQUARE_CLIENT_SECRET is set.');
      missingAnything = true;
    }
    if (config.secrets.accessToken == null) {
      msg.send('Foursquare API Access Token is missing: Ensure that FOURSQUARE_ACCESS_TOKEN is set.');
      missingAnything = true;
    }
    return missingAnything;
  };

  // Default action
  robot.respond(/(?:foursquare|4sq|swarm)$/i, (msg) => {
    if (missingEnvironmentForApi(msg)) {
      return;
    }

    friendActivity(msg);
  });

  // Who are my friends?
  robot.respond(/(?:foursquare|4sq|swarm) friends/i, (msg) => {
    if (missingEnvironmentForApi(msg)) {
      return;
    }

    foursquare.Users.getFriends('self', {}, config.secrets.accessToken, (error, response) => {
      if (error != null) {
        handleError(error, msg);
        return;
      }

      // Loop through friends
      if (response.friends.items.length > 0) {
        const list = [];
        response.friends.items.forEach((friend) => {
          const userName = formatName(friend);
          list.push(`${userName} (${friend.id})`);
        });

        // List needs to be chunked for some adapters
        const chunkedList = arrayChunk(list, 10);
        robot.logger.debug(chunkedList);

        // Send each chunk along
        chunkedList.map((chunk) => msg.send(chunk.join(', ')));
        return;
      }
      msg.send('Your bot has no friends. :(');
    });
  });

  // Approve pending bot friend requests
  robot.respond(/(?:foursquare|4sq|swarm) approve/i, (msg) => {
    if (missingEnvironmentForApi(msg)) {
      return;
    }

    foursquare.Users.getRequests(config.secrets.accessToken, (error, response) => {
      if (error != null) {
        handleError(error, msg);
        return;
      }

      // Loop through requests
      if (response.requests.length > 0) {
        response.requests.forEach((friend) => {
          msg.http(`https://api.foursquare.com/v2/users/${friend.id}/approve?oauth_token=${config.secrets.accessToken}&v=${config.version}`)
            .post()((err, res, body) => {
              const userName = formatName(friend);
              if (err || (res.statusCode !== 200)) {
                robot.logger.debug(err);
                robot.logger.debug(res.statusCode);
                robot.logger.debug(body);
                msg.send(`Sorry, couldn't approve ${userName} right now. [${res.statusCode}]`);
              }
              msg.send(`Approved: ${userName}`);
            });
        });
      }
      // Your bot is lonely
      msg.send('No friend requests to approve.');
    });
  });

  // Tell people how to friend the bot
  robot.respond(/(?:foursquare|4sq|swarm) register/i, (msg) => {
    if (missingEnvironmentForApi(msg)) {
      return;
    }

    foursquare.Users.getUser('self', config.secrets.accessToken, (error, response) => {
      if (error != null) {
        handleError(error, msg);
        return;
      }

      const userName = formatName(response.user);
      const contact = response.user.contact.email || response.user.contact.phone;
      msg.send(`1) Search for ${userName} <${contact}> in the Swarm application and send a friend request.`);
      msg.send(`2) Type \`${robot.name} foursquare approve\``);
      if (response.user.bio != null) {
        msg.send(response.user.bio);
      }
    });
  });

  // Identify your username with the bot
  robot.respond(/(?:foursquare|4sq|swarm) ([a-zA-Z0-9]+) as ([0-9]+)/i, (msg) => {
    let actor;
    if (msg.match[1] === 'me') {
      actor = msg.message.user.name;
    } else {
      actor = msg.match[1].trim();
    }

    const userId = msg.match[2].trim();

    // Save to brain if not set
    if (robot.brain.data.foursquare[actor] != null) {
      const previous = robot.brain.data.foursquare[actor];
      msg.send(`Cannot save ${actor} as ${userId} because it already set to '${previous}'.`);
      msg.send(`Use \`${robot.name} foursquare forget ${actor}\` to set a new value.`);
      return;
    }

    robot.brain.data.foursquare[actor] = userId;

    msg.send(`Ok, I have ${actor} as ${userId} on Foursquare.`);
  });

  // Stop remembering a particular username
  robot.respond(/(?:foursquare|4sq|swarm) forget ([a-zA-Z0-9]+)/i, (msg) => {
    const actor = msg.match[1].trim();

    // Remove from brain if set
    if (robot.brain.data.foursquare[actor] != null) {
      const previous = robot.brain.data.foursquare[actor];
      delete robot.brain.data.foursquare[actor];
      msg.send(`I no longer know ${actor} as ${previous} on Foursquare.`);
      return;
    }

    msg.send(`I don't know who ${actor} is on Foursquare.`);
  });

  // Find your friends
  robot.respond(/where[ ']i?s ([a-zA-Z0-9 ]+)(\?)?$/i, (msg) => {
    if (missingEnvironmentForApi(msg)) {
      return;
    }

    const searchTerm = msg.match[1].toLowerCase();
    robot.logger.debug(robot.brain.data.foursquare[searchTerm]);

    // You must be bored
    if ((searchTerm === 'everyone') || (searchTerm === 'everybody')) {
      friendActivity(msg);
      return;
    }

    // Check if user id is stored in brain
    if (robot.brain.data.foursquare[searchTerm] != null) {
      const userId = robot.brain.data.foursquare[searchTerm];

      foursquare.Users.getUser(userId, config.secrets.accessToken, (error, response) => {
        if (error != null) {
          handleError(error, msg);
          return;
        }

        const userName = formatName(response.user);
        const checkin = response.user.checkins.items[0];

        if (checkin == null) {
          msg.send(`${userName} is nowhere to be found.`);
        }

        const timeFormatted = moment(new Date(checkin.createdAt * 1000)).fromNow();
        msg.send(`${userName} was at ${checkin.venue.name} ${checkin.venue.location.city || ''} ${checkin.venue.location.state || ''} ${timeFormatted}`);
      });
    }
    // Nothing stored. Do simple looping instead
    foursquare.Checkins.getRecentCheckins({
      limit: 100,
    }, config.secrets.accessToken, (error, response) => {
      if (error != null) {
        handleError(error, msg);
        return;
      }

      // Loop through friends
      let found = 0;
      response.recent.forEach((checkin) => {
        // Skip if no string match
        const userName = formatName(checkin.user);
        if (userName.toLowerCase().indexOf(searchTerm) > -1) {
          const timeFormatted = moment(new Date(checkin.createdAt * 1000)).fromNow();
          msg.send(`${userName} was at ${checkin.venue.name} ${checkin.venue.location.city || ''} ${checkin.venue.location.state || ''} ${timeFormatted}`);
          found += 1;
        }
      });

      // If loop failed to come up with a result, tell them
      if (found === 0) {
        msg.send(`Could not find a recent checkin from ${searchTerm}.`);
      }
    });
  });
};
