Redis Raw Mode
===============

This package monkey patches [node-redis](https://github.com/mranney/node_redis) to support writing raw commands to Redis. This is extremely useful in cases when you want to work with the native [redis command protocol](http://redis.io/topics/protocol), without invoking the penalties for parsing the commands.
This will let you extend the same client to process Raw Commands, as well as the original methods that redis supports.

Useful for low level applications like proxies. It is used in the [Redis-Proxy](https://github.com/sreeix/redis-proxy).

Usage
======



`var supportRaw = require('node-redis-raw')`

The only public API it adds to the redis client API is `sendRaw`

It is used as following

`var r = require('redis'),
     supportRaw = require('node-redis-raw')
`

` supportRawOn(r)
`

Once this is done, then you can do the following to SET mykey's value to myvalue

`
var cl = r.createClient();
cl.sendRaw("*3\r\n$3\r\nSET\r\n$5\r\nmykey\r\n$7\r\nmyvalue\r\n", function(err, res) {console.log(res);});`

or

`cl.set('mykey', 'myvalue')`


Technical
==========

It adds a new method SendRaw on the RedisClient prototype, and then overrides the data handling part to not send it to the redis protocol parser, but just passthrough to the appropriate client. It also manages the buffers in case of longer than one buffer size response. This implementation is still slightly hacky.