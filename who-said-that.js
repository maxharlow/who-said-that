var highland = require('highland')
var request = require('request')
var csvWriter = require('csv-write-stream')
var fs = require('fs')
var config = require('./config')

function queryTwitterSearch(search) {
    return {
        q: search,
        result_type: config.resultType,
        count: 100
    }
}

function createTwitterSearch(parser) {
    return function query(qs, callback) {
        var sleep = 12 * 1000 // 12 seconds
        var params = {
            url: 'https://api.twitter.com/1.1/search/tweets.json',
            qs: qs,
            oauth: {
                consumer_key: config.twitter.consumerKey,
                consumer_secret: config.twitter.consumerSecret,
                token: config.twitter.accessTokenKey,
                token_secret: config.twitter.accessTokenSecret
            }
        }
        request.get(params, function (error, response) {
            if (error || response === undefined || response.statusCode !== 200) {
                console.log('Error! Sleeping before retrying...')
                setTimeout(function () { query(qs, callback) }, sleep)
                return
            }
            var body = JSON.parse(response.body)
            var data = parser(qs, body)
            if (body.search_metadata.next_results) {
                setTimeout(function () {
                    qs.max_id = body.search_metadata.next_results.match(/max_id=(.*)&q/i)[1]
                    query(qs, function (_, dataNext) {
                        callback(null, data.concat(dataNext))
                    })
                }, sleep)
            }
            else callback(null, data)
        })
    }
}

var doTwitterSearch = createTwitterSearch(function (qs, response) {
    return response.statuses.map(function (tweet) {
        return {
            url: 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str,
            byUser: tweet.user.name,
            byUsername: '@' + tweet.user.screen_name,
            text: tweet.text,
            date: tweet.created_at,
            timesRetweeted: tweet.retweet_count,
            timesFavourited: tweet.favorite_count
        }
    })
})

highland(config.searchTerms)
    .map(queryTwitterSearch)
    .flatMap(highland.wrapCallback(doTwitterSearch))
    .flatten()
    .pipe(csvWriter())
    .pipe(fs.createWriteStream('results.csv'))
