

var Twit = require('twit')

var T = new Twit({
    consumer_key:         'yZrkv7HGLMOHPcQW2l45A'
  , consumer_secret:      'WOEOXeMVHDQ7ip1Jhcpv4MXGwu2TcQ2QFll80dD4SPE'
  , access_token:         '1495159992-xozot9aidCjRrRyKtHPnm9oAv1nvQEFA4qDVyfd'
  , access_token_secret:  'SkFeu6hgqZlJbwPCtpa6z00OZoD3y2JKtyHKiAXPPk'
})

//

//geocode=32.0661580,34.7778190,150km

exports.searchTwit = function(q, clbk) {
    
    console.log("searchTwit");
    T.get('search/tweets', { q:q, geocode:'32.0661580,34.7778190,150km' }, function(err, reply) {
        console.log("searchTwit 222");    
        if(err)
          return "";
        
        clbk(reply);
    });
}