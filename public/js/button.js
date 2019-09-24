(() => {
	for (const el of document.getElementsByClassName('button')) create(el);
	
	new MutationObserver((mutations) => {
		for (const mutation of mutations) for (const node of mutation.addedNodes) if (node instanceof Element) if (node.classList.contains('button')) create(node);
	}).observe(document.body, { childList: true, subtree: true });
	
	function colorize(hex, value = 0) {
		let out = '#';
		for (let i = 0; i < 3; i++) out += Math.min(Math.max(parseInt(hex.substr(i * 2 + 1, 2), 16) + value, 0), 255).toString(16).padStart(2, '0');
		return out;
	}
	
	function create(el) {
		const type = el.getAttribute('data-type');
		const color = el.getAttribute('data-color');
		
		el.style.backgroundColor = colorize(color, 0);
		
		setTimeout(() => {
			el.style.transition = 'background-color .15s linear';
		}, 100);
		
		el.addEventListener('click', click);
		el.addEventListener('mouseenter', enter);
		el.addEventListener('mouseleave', leave);
		
		new MutationObserver((mutations) => {
			for (const mutation of mutations) if (mutation.attributeName === 'data-value') update();
		}).observe(el, { attributes: true });
		
		update();
		function update() {
			if (type === 'toggle') el.style.backgroundColor = colorize(color, parseInt(el.getAttribute('data-value')) ? 64 : 0);
		}
		
		function click(e) {
			if (type !== 'toggle') return;
			if (!e.changedTouches) if (e.which !== 1) return;
			
			el.setAttribute('data-value', parseInt(el.getAttribute('data-value')) ? 0 : 1);
			el.dispatchEvent(new CustomEvent('value'));
		}
		
		function enter() {
			if (type === 'toggle') {
				if (!parseInt(el.getAttribute('data-value'))) el.style.backgroundColor = colorize(color, 32);
			} else el.style.backgroundColor = colorize(color, 32);
		}
		
		function leave() {
			if (type === 'toggle') {
				if (!parseInt(el.getAttribute('data-value'))) el.style.backgroundColor = colorize(color);
			} else el.style.backgroundColor = colorize(color);
		}
	}
})();
