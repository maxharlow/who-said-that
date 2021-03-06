Who Said That?
==============

Get the results of a Twitter search as a spreadsheet.

Part of a set of Twitter tools, also including [Who Follows Who?] (https://github.com/maxharlow/who-follows-who) and [Who Says What?] (https://github.com/maxharlow/who-says-what/).

Requires [Node] (https://nodejs.org/).

Usage
-----

To use the Twitter API, you need credentials, by [creating a new Twitter app] (https://apps.twitter.com/). The credentials are made up of four parts, the 'consumer key', 'consumer secret', 'access token key', and 'access token secret'.

Configuration should be stored in `config.json`. An example of the fields required is given in `config.example.json`.

Install dependencies:

    $ npm install

Run:

    $ node who-said-that

The resulting spreadsheet can be found in `results.csv`.
