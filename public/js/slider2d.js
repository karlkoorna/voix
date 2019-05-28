(function() {
	for (const el of document.getElementsByClassName('slider2d')) create(el);
	
	new MutationObserver((mutations) => {
		for (const mutation of mutations) for (const node of mutation.addedNodes) if (node instanceof Element) if (node.classList.contains('slider2d')) create(node);
	}).observe(document.body, { childList: true, subtree: true });
	
	function colorize(hex, value = 0) {
		let out = '#';
		for (let i = 0; i < 3; i++) out += Math.min(Math.max(parseInt(hex.substr(i * 2 + 1, 2), 16) + value, 0), 255).toString(16).padStart(2, '0');
		return out;
	}
	
	function create(el) {
		const color = el.getAttribute('data-color');
		const label = el.innerText;
		
		const xMin = parseFloat(el.getAttribute('data-x-min'));
		const xMax = parseFloat(el.getAttribute('data-x-max'));
		const xReset = parseFloat(el.getAttribute('data-x-reset'));
		
		const yMin = parseFloat(el.getAttribute('data-y-min'));
		const yMax = parseFloat(el.getAttribute('data-y-max'));
		const yReset = parseFloat(el.getAttribute('data-y-reset'));
		
		let dragging = false;
		let x = 0;
		let y = 0;
		
		el.innerHTML = '<div class="slider2d-knob"></div>';
		
		el.setAttribute('data-label', label);
		el.style.backgroundColor = colorize(color, -16);
		el.childNodes[0].style.backgroundColor = colorize(color, 32);
		
		el.addEventListener('dblclick', () => {
			el.setAttribute('data-x-value', xReset);
			el.setAttribute('data-y-value', yReset);
			el.dispatchEvent(new CustomEvent('value'));
		});
		
		if ('ontouchstart' in window) {
			el.addEventListener('touchstart', start);
			window.addEventListener('touchmove', move);
			window.addEventListener('touchend', end);
			window.addEventListener('touchcancel', end);
		} else {
			el.addEventListener('mousedown', start);
			window.addEventListener('mousemove', move);
			window.addEventListener('mouseup', end);
		}
		
		new MutationObserver((mutations) => {
			for (const mutation of mutations) if (mutation.attributeName === 'data-x-value' || mutation.attributeName === 'data-y-value') update();
		}).observe(el, { attributes: true });
		
		update();
		function update() {
			el.childNodes[0].style.left = `calc(${(el.getAttribute('data-x-value') - xMin) * 100 / (xMax - xMin)}% - .875vw)`;
			el.childNodes[0].style.bottom = `calc(${(el.getAttribute('data-y-value') - yMin) * 100 / (yMax - yMin)}% - .875vw)`;
			el.setAttribute('data-value', `${parseFloat(el.getAttribute('data-x-value')).toFixed(2)} | ${parseFloat(el.getAttribute('data-y-value')).toFixed(2)}`);
		}
		
		function start(e) {
			if (e.changedTouches) {
				const rect = el.getBoundingClientRect();
				for (const touch of e.changedTouches) if (rect.left <= touch.pageX && touch.pageX <= rect.left + rect.width && rect.top <= touch.pageY && touch.pageY <= rect.top + rect.height) dragging = touch.identifier;
			} else
			if (e.which === 1) dragging = true;
		}
		
		function move(e) {
			if (dragging === false) return;
			const rect = el.getBoundingClientRect();
			
			if (typeof dragging === 'number') for (const touch of e.changedTouches) {
				if (dragging !== touch.identifier) continue;
					
				x = touch.pageX - rect.left;
				y = touch.pageY - rect.top;
			} else {
				x = e.pageX - rect.left;
				y = e.pageY - rect.top;
			}
			
			el.setAttribute('data-x-value', Math.min(Math.max(x * 100 / rect.width * (xMax - xMin) / 100 + xMin, xMin), xMax));
			el.setAttribute('data-y-value', Math.min(Math.max((100 - (y * 100 / rect.height)) * (yMax - yMin) / 100 + yMin, yMin), yMax));
			el.dispatchEvent(new CustomEvent('value'));
		}
		
		function end(e) {
			if (e.changedTouches) for (const touch of e.changedTouches) if (dragging === touch.identifier) dragging = false;
			else if (e.which === 1) dragging = false;
		}
	}
})();
