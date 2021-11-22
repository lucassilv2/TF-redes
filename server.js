const dgram = require('dgram');
const fs = require('fs');
const server = dgram.createSocket('udp4');
let fileArray = ''
const HOST = '0.0.0.0';
const PORT = 30000;

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    if(msg != 'done'){
        fileArray += msg
    }else{ 
        showResults()
    }
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

function showResults () {
    fs.writeFileSync(`./result-${Date.now()}`, `${fileArray}`);
    console.log('done');
}

server.bind({
    address: HOST,
    port: PORT,
    exclusive: true
});