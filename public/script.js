const ws = new WebSocket(`ws://${location.hostname}:${(Number(location.port) || 80) + 1}`);

const $levels = document.getElementById('levels');
const $controls = document.getElementById('controls');
const $scripts = document.getElementById('scripts');

const state = {};

// View only mode.
if ((new URLSearchParams(location.search)).has('view')) WebSocket.prototype.send = () => {};

// Show control view for channel.
function showControls(channel) {
	$controls.innerHTML = `
		<div class="slider1d control" data-bind="${channel}.Gain" data-min="-60" data-max="12" data-reset="0" data-value="0" data-orientation="vertical" data-color="#00be79">${document.querySelector(`#channels .channel[data-bind^="${channel}"] .slider1d-text`).getAttribute('data-label')}</div>
		<canvas class="levels"></canvas>
	`;
	
	// Add elements to...
	if (channel.startsWith('Strip')) { // strip control view...
		if (channel.substr(-2, 1) < 3) { // (hardware).
			Object.assign($controls.style, {
				gridTemplateAreas: '"gain comp comp gate gate" "gain a1 a2 a3 b1" "gain solo mute mono b2" "gain pan color fx back"',
				gridTemplateColumns: '.5fr 1fr 1fr 1fr 1fr',
				gridTemplateRows: '.5fr 1fr 1fr 1fr'
			});
			
			$controls.innerHTML += `
				<div class="slider2d control" data-bind="${channel}.Pan" data-x-min="-0.5" data-x-max="0.5" data-x-reset="0" data-x-value="0" data-y-min="0" data-y-max="1" data-y-reset="0" data-y-value="0" data-color="#c43030">Pan</div>
				<div class="slider2d control" data-bind="${channel}.Color" data-x-min="-0.5" data-x-max="0.5" data-x-reset="0" data-x-value="0" data-y-min="0" data-y-max="1" data-y-reset="0" data-y-value="0" data-color="#d93535">Color</div>
				<div class="slider2d control" data-bind="${channel}.Fx" data-x-min="-0.5" data-x-max="0.5" data-x-reset="0" data-x-value="0" data-y-min="0" data-y-max="1" data-y-reset="0" data-y-value="0" data-color="#c43030">Fx</div>
				<div class="slider1d control" data-bind="${channel}.Comp" data-min="0" data-max="10" data-reset="0" data-value="0" data-orientation="horizontal" data-color="#eda600">Comp</div>
				<div class="slider1d control" data-bind="${channel}.Gate" data-min="0" data-max="10" data-reset="0" data-value="0" data-orientation="horizontal" data-color="#dc9a00">Gate</div>
				<div class="button control" data-bind="${channel}.Mono" data-value="0" data-type="toggle" data-color="#1d82bc">MONO</div>
			`;
		} else { // (virtual).
			Object.assign($controls.style, {
				gridTemplateAreas: '"gain eqgain1 eqgain2 eqgain3 pan" "gain a1 a2 a3 b1" "gain solo mute mc b2" "gain back back back back"',
				gridTemplateColumns: '.5fr 1fr 1fr 1fr 1fr',
				gridTemplateRows: '.5fr 1fr 1fr .5fr'
			});
			
			$controls.innerHTML += `
				<div class="slider1d control" data-bind="${channel}.Eqgain1" data-min="-12" data-max="12" data-reset="0" data-value="0" data-orientation="horizontal" data-color="#eda600">Lo</div>
				<div class="slider1d control" data-bind="${channel}.Eqgain2" data-min="-12" data-max="12" data-reset="0" data-value="0" data-orientation="horizontal" data-color="#dc9a00">Mid</div>
				<div class="slider1d control" data-bind="${channel}.Eqgain3" data-min="-12" data-max="12" data-reset="0" data-value="0" data-orientation="horizontal" data-color="#eda600">Hi</div>
				<div class="slider2d control" data-bind="${channel}.Pan" data-x-min="-0.5" data-x-max="0.5" data-x-reset="0" data-x-value="0" data-y-min="0" data-y-max="0.5" data-y-reset="0" data-y-value="0" data-color="#d93535">Pan</div>
				<div class="button control" data-bind="${channel}.Mc" data-value="0" data-type="toggle" data-color="#1d82bc">M.C</div>
			`;
		}
		
		$controls.innerHTML += `
			<div class="button control" data-bind="${channel}.A1" data-value="0" data-type="toggle" data-color="#1c78ad">A1</div>
			<div class="button control" data-bind="${channel}.A2" data-value="0" data-type="toggle" data-color="#1d82bc">A2</div>
			<div class="button control" data-bind="${channel}.A3" data-value="0" data-type="toggle" data-color="#1c78ad">A3</div>
			<div class="button control" data-bind="${channel}.B1" data-value="0" data-type="toggle" data-color="#00d387">B1</div>
			<div class="button control" data-bind="${channel}.B2" data-value="0" data-type="toggle" data-color="#00be79">B2</div>
			<div class="button control" data-bind="${channel}.Solo" data-value="0" data-type="toggle" data-color="#1d82bc">SOLO</div>
		`;
	} else { // bus control view.
		Object.assign($controls.style, {
			gridTemplateAreas: '"gain mono mono" "gain eq eq" "gain mute mute" "gain back back"',
			gridTemplateColumns: '.25fr 1fr 1fr',
			gridTemplateRows: '1fr 1fr 1fr .6fr'
		});
		
		$controls.innerHTML += `
			<div class="button control" data-bind="${channel}.Mono" data-value="0" data-type="toggle" data-color="#1c78ad">MONO</div>
			<div class="button control" data-bind="${channel}.Eq.On" data-value="0" data-type="toggle" data-color="#1d82bc">EQ</div>
		`;
	}
	
	$controls.innerHTML += `
		<div class="button control" data-bind="${channel}.Mute" data-value="0" data-type="toggle" data-color="#1c78ad">MUTE</div>
		<div class="button control" data-color="#3a3a3a" onclick="hideControls()">BACK</div>
	`;
	
	// Bind elements to state.
	for (const el of document.querySelectorAll('#controls .control')) {
		const bind = el.getAttribute('data-bind');
		if (!bind) continue;
		
		el.style.gridArea = bind.split('.')[1].toLowerCase();
		
		if (el.classList.contains('slider2d')) {
			el.setAttribute('data-x-value', state[`${bind}_x`]);
			el.setAttribute('data-y-value', state[`${bind}_y`]);
			el.addEventListener('value', () => {
				ws.send(JSON.stringify([ `${bind}_x`, Number(el.getAttribute('data-x-value')) ]));
				ws.send(JSON.stringify([ `${bind}_y`, Number(el.getAttribute('data-y-value')) ]));
			});
		} else {
			el.setAttribute('data-value', state[bind]);
			el.addEventListener('value', () => {
				ws.send(JSON.stringify([ bind, Number(el.getAttribute('data-value')) ]));
			});
		}
	}
	
	resize();
	
	const update = setInterval(() => {
		if ($controls.style.visibility !== 'visible') return void clearInterval(update);
		const start = (channel.startsWith('Bus') ? 10 : 0) + channel.substr(-2, 1) * 2;
		levels($controls.querySelector('.levels'), state.levels.slice(start, start + 2));
	}, 5);
	
	$controls.style.visibility = 'visible';
}

// Hide control view.
function hideControls() {
	$controls.style.visibility = 'hidden';
	$controls.innerHTML = '';
}

// Draw audio levels.
function levels(canvas, values) {
	const ctx = canvas.getContext('2d');
	const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
	
	grd.addColorStop(0, 'black');
	grd.addColorStop(.15, 'black');
	grd.addColorStop(.15, 'white');
	grd.addColorStop(.49, 'white');
	grd.addColorStop(.49, 'rgba(255, 255, 255, .5)');
	grd.addColorStop(1, 'rgba(255, 255, 255, .5)');
	
	ctx.fillStyle = grd;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const width = canvas.width / values.length;
	for (const i in values) ctx.fillRect(i * width, canvas.height, width, -(values[i] * canvas.height / 72));
}

// Resize elements.
function resize() {
	for (const el of document.getElementsByTagName('canvas')) {
		const rect = el.getBoundingClientRect();
		el.width = rect.width;
		el.height = rect.height;
	}
}

resize();
window.addEventListener('resize', resize);

// Bind audio level controls to state.
for (let i = 0; i < 10; i++) {
	const channel = document.querySelectorAll('#channels .channel')[i];
	const icon = document.querySelectorAll('#icons .icon')[i];
	
	channel.addEventListener('value', () => {
		ws.send(JSON.stringify([ channel.getAttribute('data-bind'), Number(channel.getAttribute('data-value')) ]));
	});
	
	icon.addEventListener('click', () => {
		showControls(channel.getAttribute('data-bind').split('.')[0]);
	});
}

// Load scripts.
fetch('scripts').then((res) => {
	if (res.ok) res.json().then((data) => {
		for (const i in data) $scripts.innerHTML += `<div class="button script" data-order="${i}" data-color="#${i % 2 ? '3a3a3a3a' : '4a4a4a'}">${data[i]}</div>`;
		for (const el of document.querySelectorAll('#scripts .script')) el.addEventListener('click', () => {
			fetch(`scripts/${el.getAttribute('data-order')} - ${el.innerText}`);
		});
	});
});

// Handle WS messages.
ws.addEventListener('message', (e) => {
	const changes = JSON.parse(e.data);
	levels($levels, changes.levels);
	
	for (const key in changes) {
		for (const el of document.querySelectorAll(`[data-bind="${key.substr(0, key.indexOf('_')) || key}"]`)) el.setAttribute(`data-${key.indexOf('_') > -1 ? `${key.split('_')[1]}-` : ''}value`, changes[key]);
		
		if (key.indexOf('Mute') > -1) document.querySelectorAll('#icons .icon')[parseInt((key.indexOf('Bus') > -1 ? 5 : 0) + parseInt(key.substr(-7, 1)))].setAttribute('src', `img/${key.indexOf('Strip') > -1 ? 'input-' : 'output-'}${changes[key] === 1 ? 'off' : 'on'}.svg`);
		if (key.indexOf('Solo') > -1) document.querySelectorAll('#icons .icon')[parseInt((key.indexOf('Bus') > -1 ? 5 : 0) + parseInt(key.substr(-7, 1)))].style.borderTop = `5px solid rgba(${changes[key] === 1 ? '255, 255, 255, .5' : '0, 0, 0, .25'})`;
		
		state[key] = changes[key];
	}
});
