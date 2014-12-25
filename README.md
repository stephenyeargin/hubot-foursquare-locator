# Hubot Foursquare Locator

Get last checkin of your bot's friends

[![Build Status](https://travis-ci.org/hubot-scripts/hubot-foursquare-locator.png)](https://travis-ci.org/hubot-scripts/hubot-foursquare-locator)

## How to Set Up the Bot User

1. Register a Foursquare application to obtain your `FOURSQUARE_CLIENT_ID` and `FOURSQUARE_CLIENT_SECRET`
2. Authenticate either your personal foursquare account or a purpose-specific user that acts as your bot
3. Manually walk through the OAuth process to obtain a `FOURSQUARE_ACCESS_TOKEN` (this can be tricky)

When you have all three values, load them as environment variables for launching your Hubot. If you are installing via Heroku, you would enter:

```
$ heroku set:config FOURSQUARE_CLIENT_ID=yourclientid
$ heroku set:config FOURSQUARE_CLIENT_SECRET=yourclientsecret
$ heroku set:config FOURSQUARE_ACCESS_TOKEN=youraccesstoken
```

If you are using some other hosting/launcher, make sure the variables above are loaded in appropriately.

## Adding Module to Your Hubot

See full instructions [here](https://github.com/github/hubot/blob/master/docs/scripting.md#npm-packages).

1. `npm install hubot-foursquare-locator --save` (updates your `package.json` file)
2. Open the `external-scripts.json` file in the root directory (you may need to create this file) and add an entry to the array (e.g. `[ 'hubot-foursquare-locator' ]`).

## Usage

### Get All Recent Checkins

* `hubot foursquare`
* `hubot where is everyone?`
* A list of all recent checkins appears

### Find Last Checkins

* `hubot where is bob?`
* Bob's last checkin (if a friend) appears
* If there is more than one Bob in your friend list, you will see all of them

### Map Usernames to Foursquare User IDs

* Look up your foursquare numeric ID
* `hubot foursquare me as 12345`
* Your screen name is now mapped to a numeric ID so that `where is myusername?` works as well.
* This works for mapping other room users as well (`hubot foursquare otherusername as 98765`)

### Approve New Friends

* Users add the bot as a friend
* `hubot foursquare approve`
* All pending friend requests are approved

### List Friends

* `hubot foursquare friends`
* See a list of authenticated bot's friends

### Get Registration Information

* `hubot foursquare register`
* Identifies the account that other users should add as a friend