const dgram = require('dgram');
const fs = require('fs');
const sleep  = require('sleep');
const data = fs.readFileSync('./1000b');
const package = data.length/100;
let packageAtual = 0
let numGlobal = 0;
let mapAckMsg = new Map(); 
let ack;
let lastSucessAck;
let ackList = [];
let startTime;
let contFail = 0;
let map = new Map();
map.set('slow', 1);
map.set('cong', 9);
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
        if (map.get('slow') <= 8) {
            sendPackage(map.get('slow'));
            console.log(`Em Slow Start enviando ${map.get('slow')}`);
            map.set('slow', map.get('slow') * 2);
        } else {
            sendPackage(map.get('cong'));
            console.log(`Em Congestion Avoidance enviando ${map.get('cong')}`);
            map.set('cong', map.get('cong') + 1);
        }
        sleep.msleep(40);
        startTime = new Date();
        sleep.msleep(500);
    } else {
        let done = Buffer.from('done', 'utf8');
        client.send(done, 0, done.length, PORT, HOST, function (err, bytes) {
            client.close();
        });
    }
    if(-1*(startTime - new Date()) > (numGlobal*10000)) {
        console.log('timeout');
        packageAtual = packageAtual - numGlobal;
        map.set('slow', 1);
        configureSend()
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
            mapAckMsg.set(ack.toString(), msg);
            sendAndWait(msg, 0, ack);
        }
    }
}
function sendAndWait(msg, init, ack) {
    try {
        client.send(msg, init, msg.length, PORT, HOST, function (err, bytes) { });
        lastSucessAck = ack;
        contFail = 0;
    } catch (error) {
        contFail++;
        if (contFail > 3) {
            fastRetrasmition();
        }
        console.log(error);
    }
}

function fastRetrasmition() {
    let msg = mapAckMsg.get(lastSucessAck.toString());
    sendAndWait(msg, 0, lastSucessAck);
}

client.on('message', (msg, rinfo) => {
    let forDeletion = [parseInt(msg.toString())]
    ackList = ackList.filter(item => !forDeletion.includes(item));
    if (ackList.length === 0) {
        configureSend()
    } else if(-1*(startTime - new Date()) > (numGlobal*10000)) {
        console.log('timeout');
        packageAtual = packageAtual - numGlobal;
        map.set('slow', 1);
        configureSend()
    }
});

if (packageAtual != package) {
    console.log('timeout');
    packageAtual = packageAtual - numGlobal;
    map.set('slow', 1);
    configureSend()
} else if (packageAtual == package) {
    client.close();
}
    