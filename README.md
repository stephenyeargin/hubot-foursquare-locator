# Hubot Foursquare Locator

Get last checkin of your bot's friends

[![Build Status](https://travis-ci.org/stephenyeargin/hubot-foursquare-locator.png)](https://travis-ci.org/stephenyeargin/hubot-foursquare-locator)

## How To Setup

1. Register a Foursquare application to obtain your `FOURSQUARE_CLIENT_ID` and `FOURSQUARE_CLIENT_SECRET`
2. Authenticate either your personal foursquare account or a purpose-specific user that acts as your bot
3. Manually walk through the OAuth process to obtain a `FOURSQUARE_ACCESS_TOKEN`

## Usage

### Find Last Checkins

* `where is bob?`
* Bob's last checkin (if a friend) appears
* If there is more than one Bob in your friend list, you will see all of them

### Map Usernames to Foursquare Users

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