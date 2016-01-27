const Highland = require('highland')
const Request = require('request')
const CSVWriter = require('csv-write-stream')
const FS = require('fs')
const Config = require('./config')

function queryTwitterSearch(search) {
    return {
        q: search,
        result_type: Config.resultType,
        count: 100
    }
}

function createTwitterSearch(parser) {
    return function query(qs, callback) {
        const sleep = 12 * 1000 // 12 seconds
        const params = {
            url: 'https://api.twitter.com/1.1/search/tweets.json',
            qs: qs,
            oauth: {
                consumer_key: Config.twitter.consumerKey,
                consumer_secret: Config.twitter.consumerSecret,
                token: Config.twitter.accessTokenKey,
                token_secret: Config.twitter.accessTokenSecret
            }
        }
        Request.get(params, (e, response) => {
            if (e || response === undefined || response.statusCode !== 200) {
                console.log('Error! Sleeping before retrying...')
                setTimeout(() => query(qs, callback), sleep)
                return
            }
            const body = JSON.parse(response.body)
            const data = parser(qs, body)
            if (body.search_metadata.next_results) setTimeout(() => {
                qs.max_id = body.search_metadata.next_results.match(/max_id=(.*)&q/i)[1]
                query(qs, (_, dataNext) => callback(null, data.concat(dataNext)))
            }, sleep)
            else callback(null, data)
        })
    }
}

const doTwitterSearch = createTwitterSearch((qs, response) => {
    return response.statuses.map(tweet => {
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

Highland(Config.searchTerms)
    .map(queryTwitterSearch)
    .flatMap(Highland.wrapCallback(doTwitterSearch))
    .flatten()
    .pipe(CSVWriter())
    .pipe(FS.createWriteStream('results.csv'))
