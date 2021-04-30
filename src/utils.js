export const getImageSize = (url) => {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.src = url;
		img.onload = () => {
			resolve({
				width: img.width,
				height: img.height
			})
		}
	})
}

export const loadGIFShort = () => {
	return new Promise((resolve, reject) => {
		if (document.querySelector("#gifshort")) {
			resolve();
			return
		}
		const script = document.createElement("script");
		script.src = "https://cdn.bootcdn.net/ajax/libs/gif.js/0.2.0/gif.js"
		script.id = "gifshort"
		script.onload = (e) => {
			resolve(window.GIF)
		}
		script.onerror = (e) => {
			console.log(e)
			reject();
		}
		document.body.appendChild(script);

	})
}

export const rgbToHex = (r, g, b) => {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}