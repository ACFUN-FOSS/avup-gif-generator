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