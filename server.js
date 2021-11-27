const dgram = require('dgram');
var sleep = require('sleep');
const fs = require('fs');
const server = dgram.createSocket('udp4');
let fileArray = ''
let ackList = [];
const HOST = '0.0.0.0';
const PORT = 30000;

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    if(msg != 'done'){
        ack = Buffer.from((parseInt(msg.toString().split('%%%%%')[0]) + msg.toString().split('%%%%%')[1].length).toString(), 'utf8');
        if(!ackList.includes(parseInt(ack.toString()))){
            fileArray += msg.toString().split('%%%%%')[1];
            ackList.push(parseInt(ack.toString()));
        }
        
        server.send(ack, 0, ack.length, 30003, HOST, (err, bytes) => {
            if (err) throw err;
            console.log((parseInt(msg.toString().split('%%%%%')[0]) + msg.toString().split('%%%%%')[1].length).toString())
        });
    }else{ 
        showResults()
    }
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

function showResults () {
    fs.writeFileSync(`./result-${Date.now()}.txt`, `${fileArray}`);
    console.log('done');
}

server.bind({
    address: HOST,
    port: PORT,
    exclusive: false
});