const dgram = require('dgram');
const fs = require('fs');
const { send } = require('process');
const data = fs.readFileSync('./1000bytes.txt');
const package = data.length/100;
let packageAtual = 0
let ack;
const HOST = '0.0.0.0';
const PORT = 30000;
require('events').EventEmitter.defaultMaxListeners = 20;
let numSequence = 0;

let client = dgram.createSocket('udp4');

client.bind({
    address: HOST,
    port: 30003,
    exclusive: false
});

client.on('listening', () => {
    const address = client.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

while (packageAtual < package) {
    let message
    let msgSeq

    if ((packageAtual + 1) < package) {
        msgSeq = Buffer.from( numSequence.toString()+'%%%%%', 'utf8');
        message = Buffer.from(data.slice(packageAtual * 100, (packageAtual + 1) * 100), 'utf8');
        ack = numSequence + data.slice(packageAtual * 100, (packageAtual + 1) * 100).length;
        packageAtual++;
        numSequence++;
    } else {
        msgSeq = Buffer.from( numSequence.toString()+'%%%%%', 'utf8');
        message = Buffer.from( data.slice(packageAtual * 100, data.length - 1), 'utf8');
        ack = numSequence + data.slice(packageAtual * 100, data.length - 1).length;
        packageAtual++;
        numSequence++;
    }
    let msg = Buffer.concat([msgSeq, message], msgSeq.length + message.length);
    
    sendAndWait(msg, 0);
}

async function sendAndWait(msg, init) {
    client.send(msg, init, msg.length, PORT, HOST, function (err, bytes) {
        if (err) throw err;
    });
}

client.on('message', (msg, rinfo) => {
    console.log(`${msg}`);
});

let done = Buffer.from('done', 'utf8');
client.send(done, 0, done.length, PORT, HOST, function(err, bytes) {
    if (err) throw err;
    console.log('UDP message sent to ' + HOST +':'+ PORT);
});



