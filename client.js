const dgram = require('dgram');
const fs = require('fs');

const data = fs.readFileSync('./1000bytes.txt');
console.log(data.length);
const HOST = '0.0.0.0';
const PORT = 30000;
const message = Buffer.from(data.slice(0,99), 'utf8');
const client = dgram.createSocket('udp4');

client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
    if (err) throw err;
    console.log('UDP message sent to ' + HOST +':'+ PORT);
    client.close();
});