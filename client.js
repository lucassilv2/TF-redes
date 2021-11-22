const dgram = require('dgram');
const fs = require('fs');
const data = fs.readFileSync('./1000bytes.txt');
const package = data.length/100;
let packageAtual = 0
const HOST = '0.0.0.0';
const PORT = 30000;

let client = dgram.createSocket('udp4');


while(packageAtual < package){
    let message 
    if((packageAtual+1) < package){
        message = Buffer.from(data.slice(packageAtual*100,(packageAtual+1)*100), 'utf8');
        packageAtual ++
    }else{
        message = Buffer.from(data.slice(packageAtual*100,data.length-1), 'utf8');
        packageAtual ++;
    }
    client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
        if (err) throw err;
        console.log('UDP message sent to ' + HOST +':'+ PORT);
    });
}
let done = Buffer.from('done', 'utf8');
client.send(done, 0, done.length, PORT, HOST, function(err, bytes) {
    if (err) throw err;
    console.log('UDP message sent to ' + HOST +':'+ PORT);
    client.close();
});

