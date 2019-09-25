const fs = require('fs');
const path = require('path');
const fastify = require('fastify');
const fastifyStatic = require('fastify-static');
const WebSocket = require('ws');

const vm = require('./build/Release/vm.node');
const config = require('./config.json');
const binds = fs.readFileSync('binds.txt').toString().split('\n');

/* Voiceemeter */

vm.load(config.dll);
vm.login();

if (vm.getType() !== 2) {
	vm.logout();
	throw new Error('Voicemeeter Banana not found.');
}

/* HTTP */

const app = fastify();

app.register(fastifyStatic, {
	root: path.resolve('public/')
});

app.listen(config.port, config.host, (err) => {
	if (err) throw err;
});

/* WS */

const wss = new WebSocket.Server({ port: config.port + 1 });
const state = { levels: (new Array(20)).fill(0) };
let lastState = {};

setInterval(() => {
	const levels = (new Array(20)).fill(0);
	
	for (let i = 0; i < 8; i++) levels[i] = vm.getLevel(1, i);
	
	levels[8] = vm.getLevel(1, 14);
	levels[9] = vm.getLevel(1, 15);
	
	levels[10] = vm.getLevel(3, 0);
	levels[11] = vm.getLevel(3, 1);
	levels[12] = vm.getLevel(3, 8);
	levels[13] = vm.getLevel(3, 9);
	levels[14] = vm.getLevel(3, 16);
	levels[15] = vm.getLevel(3, 17);
	levels[16] = vm.getLevel(3, 24);
	levels[17] = vm.getLevel(3, 25);
	levels[18] = vm.getLevel(3, 32);
	levels[19] = vm.getLevel(3, 33);
	
	for (const i in levels) state.levels[i] += levels[i] > state.levels[i] && levels[i] > 0 ? levels[i] - state.levels[i] : -.056;
	if (vm.isDirty()) for (const bind of binds.slice(0, -1)) state[bind] = vm.getFloat(bind);
	
	const changes = { levels: state.levels };
	for (const key in state) if (state[key] !== lastState[key]) changes[key] = state[key];
	lastState = { ...state };
	
	for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(changes));
}, 5);

wss.on('connection', (ws) => {
	ws.send(JSON.stringify(state));
	
	ws.on('message', (msg) => {
		const data = JSON.parse(msg);
		vm.setFloat(data[0], data[1]);
	});
});
