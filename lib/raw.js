var Buffers = require('buffers'),
    originalOnData = null,
    bufs;

module.exports = function rawmode (redis) {
  originalOnData =  redis.on_data;

  redis.sendRaw = sendRaw;
  redis.on_data = on_data;
};

var peek = function peek() {
  if (this.offset === this.head.length) {
    var tmp = this.head;
    tmp.length = 0;
    this.head = this.tail;
    this.tail = tmp;
    this.offset = 0;
    if (this.head.length === 0) {
      return;
    }
  }
  return this.head[this.offset]; // Don't increment the Offset so the next read is going to increment it.
};

var sendRaw = function(command_str, callback){
  var stream = this.stream, buffer_args,  buffered_writes = 0, command_obj;

  if(!this.command_queue.peek) this.command_queue.peek = peek;

  command_obj = new Command(command_str,[], false, true, callback);
  this.command_queue.push(command_obj);
  this.commands_sent += 1;

  buffered_writes += !stream.write(command_str);

  if (buffered_writes || this.command_queue.getLength() >= this.command_queue_high_water) {
    this.should_buffer = true;
  }
  return !this.should_buffer;
};


bufs = Buffers();

var on_data = function(data) {
  var command_obj = null;
  if(this.command_queue.peek && this.command_queue.peek().raw){
    bufs.push(data);
    if(data.length === 65536){
      return; // Continue Looping so that we build the buffer.
    }
    command_obj = this.command_queue.shift();
    try_callback(command_obj.callback, bufs.toBuffer());
    bufs = Buffers();
  } else{
    originalOnData.call(this, data);
  }
};

// Cargo culted from node-redis.
function try_callback(callback, reply) {
  try {
    callback(null, reply);
  } catch (err) {
    process.nextTick(function() {
      throw err;
    });
  }
};

function Command(command, args, sub_command, raw, callback) {
  this.command = command;
  this.args = args;
  this.sub_command = sub_command;
  this.raw = raw;
  this.callback = callback;
};
