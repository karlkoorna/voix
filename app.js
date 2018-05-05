const config = require('./config.json');
const fs = require('fs');
const vm = require('voice')(config.path);
const WebSocket = require('ws');
const express = require('express');

vm.login();

if (vm.getType() !== 2) { vm.logout(); throw new Error('Where is my banana?'); }

const wss = new WebSocket.Server({ port: config.port + 1 });
const app = express();

app.use(express.static('public'));

app.get('/scripts', (req, res) => {
	
	try {
		
		res.json(fs.readdirSync('scripts').filter((file) => file.endsWith('.vms')).map((file) => file.slice(file.indexOf('-') + 2, -4)));
	
	} catch (ex) {
		
		res.status(500).send(ex);
		
	}
	
});

app.get('/scripts/:script', (req, res) => {
	
	try {
		
		vm.setMultiple(fs.readFileSync(`scripts/${req.params.script}.vms`).toString());
		
		res.end();
		
	} catch (ex) {
		
		res.status(500).send(ex);
		
	}
	
});

app.listen(config.port);

const binds = fs.readFileSync('binds.txt').toString().split('\n');
const state = { levels: (new Array(20)).fill(0) };
const lastState = {};
let changes = {};

setInterval(() => {
	
	const levels = [];
	
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
	
	changes.levels = state.levels;
	
	for (const key in state) {
		
		if (JSON.stringify(state[key]) !== JSON.stringify(lastState[key])) changes[key] = state[key];
		
		lastState[key] = state[key];
		
	}
	
	for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(changes));
	
	changes = {};
	
}, 5);

wss.on('connection', (ws) => {
	
	ws.send(JSON.stringify(state));
	
	ws.on('message', (msg) => {
		
		const data = JSON.parse(msg);
		
		vm.setFloat(data[0], data[1]);
		
	});
	
});
