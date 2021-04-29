<template>
	<div id="app">
		<el-header class="head">ACFUN虚拟主播GIF生成器</el-header>
		<el-main>
			<el-form label-position="top">
				<el-form-item label="step1:选择gif模板">
					<img-loader accept=".gif" v-model="gif" @input="decodeGif" />
					<el-button v-if="gif" type="primary" style="margin-top:8px" @click="gif=''">重选</el-button>
					<el-button v-if="gif" type="primary" style="margin-top:8px" @click="decodeGif()">重新解析</el-button>
				</el-form-item>
				<el-form-item label="step2:选择头像">
					<img-loader v-model="img" />
					<el-button v-if="img" type="primary" style="margin-top:8px" @click="img=''">重选</el-button>
				</el-form-item>
				<el-form-item label="step3:预览并调整大小">
					<div id="preview"></div>
					<el-button v-if="img" type="primary" style="margin-top:8px" @click="img=''">重选</el-button>
				</el-form-item>
			</el-form>
		</el-main>
		<el-footer class="foot">版权所有：A站前后端开源⑨课</el-footer>
	</div>
</template>

<script>
import imgLoader from "./components/imgLoader";
import { parseGIF, decompressFrames } from "gifuct-js";
import { getImageSize } from "./utils";
export default {
	name: "App",
	components: { imgLoader },
	data() {
		return {
			gif: "",
			img: "",
			keyPoints: [],
			frames: [],
			showPreview: false,
			preview: "",
			imgsettings: {
				zoom: 100,
				left: 0,
				top: 0
			}
		};
	},
	computed: {
		updatePreview() {
			return {
				img: this.img,
				keyPoints: this.keyPoints,
				imgsettings: this.imgsettings
			};
		}
	},
	watch: {
		updatePreview(n, o) {
			if ((this.showPreview = n.img && n.keyPoints.length)) {
				this.generatePreview(0);
			}
		}
	},
	methods: {
		decodeGif() {
			if (this.gif && this.gif.blob) {
				new Response(this.gif.blob).arrayBuffer().then(res => {
					const gif = parseGIF(res);
					this.frames = decompressFrames(gif);
					this.keyPoints = [];
					this.frames.forEach((frame, index) => {
						let vi = 0,
							hi = 0;
						let initialKey = "";
						while (vi < frame.dims.height) {
							const color = this.getPixel(hi, vi, frame);
							if (this.checkKeyPoint(color)) {
								initialKey = {
									left: hi,
									top: vi
								};
								break;
							}
							hi++;
							if (hi == frame.dims.width) {
								hi = 0;
								vi++;
							}
						}
						let center = "";
						if (initialKey) {
							while (this.checkKeyPoint(this.getPixel(hi, vi, frame))) {
								vi++;
								hi++;
							}
							center = {
								left: (hi + initialKey.left) / 2,
								top: (vi + initialKey.top) / 2
							};
						}
						this.keyPoints.push({
							frame: index,
							center
						});
					});
					if (!this.keyPoints.length) {
						this.$alert("在GIF上没有检测到关键点", "解析错误", {
							confirmButtonText: "确定"
						});
					}
				});
			}
		},
		getPixel(h, v, frame) {
			return frame.colorTable[frame.pixels[v * frame.dims.width + h]];
		},
		checkKeyPoint(color) {
			return color[0] > 80 && color[0] < 90 && color[1] > 250 && color[2] < 10;
		},
		generatePreview(num = 0) {
			const canvas = document.createElement("canvas");
			canvas.height = this.frames[num].dims.height;
			canvas.width = this.frames[num].dims.width;
			const ctx = canvas.getContext("2d");
			let imgData = ctx.createImageData(
				this.frames[num].dims.width,
				this.frames[num].dims.height
			);
			for (let i = 0; i * 4 < imgData.data.length; i++) {
				const pixel = this.frames[num].pixels[i];
				if (pixel == this.frames[num].transparentIndex) {
					imgData.data[i + 0] = 0;
					imgData.data[i + 1] = 0;
					imgData.data[i + 2] = 0;
					imgData.data[i + 3] = 0;
				} else {
					imgData.data[i + 0] = this.frames[num].colorTable[pixel][0];
					imgData.data[i + 1] = this.frames[num].colorTable[pixel][1];
					imgData.data[i + 2] = this.frames[num].colorTable[pixel][2];
					imgData.data[i + 3] = 0;
				}
			}
			console.log(imgData);
			ctx.putImageData(imgData, 0, 0);
			document.querySelector("#preview").append(canvas);
		},
		transpose(array, width, height) {
			let subheight = 0,
				subwidth = 0;
			const result = [];
			while (subheight < height) {
				while (subwidth < width) {
					result.push(array[height * subwidth + subheight]);
					subwidth++;
				}
				subwidth = 0;
				subheight++;
			}
			return result;
		}
	}
};
</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 60px;
}
#preview > canvas {
	max-width: 60%;
}
</style>
