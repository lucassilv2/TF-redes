const dgram = require('dgram');
const fs = require('fs');
const sleep  = require('sleep');
const data = fs.readFileSync('./10000bytes.txt');
const package = data.length/100;
let packageAtual = 0
let numGlobal = 0;
let ack;
let ackList = [];
let startTime;
let map = new Map();
map.set('slow', 1);
map.set('cong', 5);
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
configureSend();
function configureSend() {
    if (packageAtual < package) {
        if (map.get('slow') <= 4) {
            sendPackage(map.get('slow'));
            console.log(`Em slow start enviando ${map.get('slow')}`);
            map.set('slow', map.get('slow') + 1);
        } else {
            sendPackage(map.get('cong'));
            console.log(`Em cong enviando ${map.get('cong')}`);
            map.set('cong', map.get('cong') + 1);
        }
        sleep.msleep(40);
        startTime = new Date();
    } else {
        let done = Buffer.from('done', 'utf8');
        client.send(done, 0, done.length, PORT, HOST, function (err, bytes) {
            client.close();
        });
    }

}
function sendPackage(numMensagens) {
    numGlobal = numMensagens;
    for (let i = 1; i <= numMensagens; i++) {
        if (packageAtual < package) {
            let message
            let msgSeq
            if ((packageAtual + 1) < package) {
                msgSeq = Buffer.from(numSequence.toString() + '%%%%%', 'utf8');
                message = Buffer.from(data.slice(packageAtual * 100, (packageAtual + 1) * 100), 'utf8');
                ack = numSequence + data.slice(packageAtual * 100, (packageAtual + 1) * 100).length;
                packageAtual++;
                numSequence++;
            } else {
                msgSeq = Buffer.from(numSequence.toString() + '%%%%%', 'utf8');
                message = Buffer.from(data.slice(packageAtual * 100, data.length - 1), 'utf8');
                ack = numSequence + data.slice(packageAtual * 100, data.length - 1).length;
                packageAtual++;
                numSequence++;
            }
            ackList.push(ack);
            console.log(`Enviando pacote ${packageAtual-1} de ack ${ack}`);
            let msg = Buffer.concat([msgSeq, message], msgSeq.length + message.length);
            sendAndWait(msg, 0);
        }
    }
}
function sendAndWait(msg, init) {
    client.send(msg, init, msg.length, PORT, HOST, function (err, bytes) {
        if (err) throw err;
    });
}

client.on('message', (msg, rinfo) => {
    let forDeletion = [parseInt(msg.toString())]
    //console.log('a remover ', msg);
    //console.log('antes ',ackList)
    ackList = ackList.filter(item => !forDeletion.includes(item))
    //console.log('depois ',ackList)
    if (ackList.length === 0) {
        configureSend()
    } else if(-1*(startTime - new Date()) > (numGlobal*10000)) {
        console.log('Ta demorando')
    }
});





