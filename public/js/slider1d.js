(() => {
	for (const el of document.getElementsByClassName('slider1d')) create(el);
	
	new MutationObserver((mutations) => {
		for (const mutation of mutations) for (const node of mutation.addedNodes) if (node instanceof Element) if (node.classList.contains('slider1d')) create(node);
	}).observe(document.body, { childList: true, subtree: true });
	
	function colorize(hex, value = 0) {
		let out = '#';
		for (let i = 0; i < 3; i++) out += Math.min(Math.max(parseInt(hex.substr(i * 2 + 1, 2), 16) + value, 0), 255).toString(16).padStart(2, '0');
		return out;
	}
	
	function create(el) {
		const orientation = el.getAttribute('data-orientation');
		const color = el.getAttribute('data-color');
		const label = el.innerText;
		
		const min = parseFloat(el.getAttribute('data-min'));
		const max = parseFloat(el.getAttribute('data-max'));
		const reset = parseFloat(el.getAttribute('data-reset'));
		
		let dragging = false;
		let x = 0;
		let y = 0;
		
		el.innerHTML = '<div class="slider1d-fill"></div><div class="slider1d-text"></div>';
		
		el.style.backgroundColor = colorize(color, -32);
		el.childNodes[0].style.backgroundColor = colorize(color);
		el.childNodes[0].style[orientation === 'horizontal' ? 'borderRight' : 'borderTop'] = '.6vw solid ' + colorize(color, 32);
		el.childNodes[1].setAttribute('data-label', label);
		
		el.addEventListener('dblclick', () => {
			el.setAttribute('data-value', reset);
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
			for (const mutation of mutations) if (mutation.attributeName === 'data-value') update();
		}).observe(el, { attributes: true });
		
		update();
		function update() {
			el.childNodes[0].style[orientation === 'horizontal' ? 'width' : 'height'] = `calc(${(el.getAttribute('data-value') - min) * 100 / (max - min)}% + .3vw)`;
			el.childNodes[1].innerText = parseFloat(el.getAttribute('data-value')).toFixed(1);
		}
		
		function start(e) {
			if (e.changedTouches) {
				const rect = el.getBoundingClientRect();
				for (const touch of e.changedTouches) if (rect.left <= touch.pageX && touch.pageX <= rect.left + rect.width && rect.top <= touch.pageY && touch.pageY <= rect.top + rect.height) dragging = touch.identifier;
			} else if (e.which === 1) dragging = true;
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
			
			if (orientation === 'horizontal') el.setAttribute('data-value', Math.min(Math.max(x * 100 / rect.width * (max - min) / 100 + min, min), max));
			else el.setAttribute('data-value', Math.min(Math.max((100 - (y * 100 / rect.height)) * (max - min) / 100 + min, min), max));
			
			el.dispatchEvent(new CustomEvent('value'));
		}
		
		function end(e) {
			if (e.changedTouches) for (const touch of e.changedTouches) {
				if (dragging === touch.identifier) dragging = false;
			} else if (e.which === 1) dragging = false;
		}
	}
})();
