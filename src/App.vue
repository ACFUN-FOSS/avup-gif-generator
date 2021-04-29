<template>
	<div id="app">
		<el-header>
			<div class="head">ACFUN虚拟主播GIF生成器ver.0.0.1</div>
			<div class="subhead">ACFUN前后端开源⑨课 <el-button size="mini" @click="openUrl()">点个星星支持我们</el-button>
			</div>
		</el-header>
		<el-main>
			<el-form label-position="top">
				<el-form-item ref="gif" label="step1:加载gif模板">
					<img-loader accept=".gif" v-model="gif" @input="decodeGif" />
					<div>
						<el-button size="mini" v-if="gif" type="primary" style="margin-top:8px" @click="gif=''">重选</el-button>
						<el-button size="mini" v-if="gif" type="primary" style="margin-top:8px" @click="decodeGif()">重新解析
						</el-button>
					</div>
				</el-form-item>
				<el-form-item label="step2:选择头像">
					<img-loader ref="header" v-model="img" />
					<el-button size="mini" v-if="img" type="primary" style="margin-top:8px" @click="img=''">重选</el-button>
				</el-form-item>
				<el-form-item v-show="showPreview" label="step3:预览并调整大小" v-loading="loading"
					:element-loading-text="`合成中${percentage}%`">
					<canvas id="preview" class="preview" />
					<div class="input-row">
						<div>头像大小：
							<el-input-number size="mini" v-model="imgsettings.zoom" type="number" :min="1" />%
						</div>
						<div>左右偏移：
							<el-input-number size="mini" v-model="imgsettings.left" type="number" />px
						</div>
						<div>上下偏移：
							<el-input-number size="mini" v-model="imgsettings.top" type="number" />px
						</div>
						<div>
							<el-button size="mini" type="primary" @click="generate()">生成gif</el-button>
						</div>
					</div>
				</el-form-item>
				<el-form-item v-show="showPreview&&result" label="step4:右键另存为">
					<el-image class="preview" :src="result" />
				</el-form-item>
			</el-form>
		</el-main>
		<el-footer class="foot">版权所有：A站前后端开源⑨课</el-footer>
	</div>
</template>

<script>
import imgLoader from "./components/imgLoader";
import { loadGIFShort, rgbToHex } from "./utils";
import { parseGIF, decompressFrames } from "gifuct-js";
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
			result: "",
			imgsettings: {
				zoom: 100,
				left: 0,
				top: 0
			},
			loading: false,
			percentage: 0
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
		updatePreview: {
			handler(n, o) {
				if ((this.showPreview = n.img && n.keyPoints.length)) {
					this.$nextTick(() => {
						this.generatePreview(0);
					});
				}
			},
			deep: true
		}
	},
	mounted() {
		loadGIFShort();
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
			return new Promise(resolve => {
				const frame = this.frames[num];
				const canvas = document.querySelector("#preview");
				let [width, height] = [frame.dims.width, frame.dims.height];
				canvas.height = height;
				canvas.width = width;
				const ctx = canvas.getContext("2d");
				frame.pixels.forEach((pixel, i) => {
					let color =
						pixel == frame.transparentIndex
							? [0, 0, 0, 0]
							: [...frame.colorTable[pixel], 1];
					ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3]})`;
					ctx.fillRect(i % width, Math.floor(i / width), 1, 1);
				});
				const img = document.createElement("img");
				img.src = this.img.url;
				img.onload = () => {
					const [imgWidth, imgHeight] = [
						parseInt((img.width * this.imgsettings.zoom) / 100),
						parseInt((img.height * this.imgsettings.zoom) / 100)
					];
					ctx.drawImage(
						img,
						this.keyPoints[num].center.left -
							imgWidth / 2 +
							this.imgsettings.left,
						this.keyPoints[num].center.top -
							imgHeight / 2 +
							this.imgsettings.top,
						imgWidth,
						imgHeight
					);
					resolve(canvas);
				};
			});
		},
		copyCanvas(canvas) {
			var newCanvas = document.createElement("canvas");
			var context = newCanvas.getContext("2d");
			newCanvas.width = canvas.width;
			newCanvas.height = canvas.height;
			context.drawImage(canvas, 0, 0);
			return newCanvas;
		},
		generate() {
			const GIF = window.GIF;
			const transparent = this.frames[0].colorTable[
				this.frames[0].transparentIndex
			];
			this.loading = true;
			this.$nextTick(async () => {
				const gif = new GIF({
					workers: 2,
					quality: 10,
					workerScript: "/gif.worker.js",
					transparent: rgbToHex(transparent[0], transparent[1], transparent[2])
				});
				let length = this.frames.length;
				this.percentage = 0;
				for (let i = 0; i < length; i++) {
					let canvas = await this.generatePreview(i);
					gif.addFrame(this.copyCanvas(canvas), {
						delay: this.frames[i].delay
					});
					this.percentage = ((i * 100) / length).toFixed(2);
				}
				gif.on("finished", blob => {
					this.result = URL.createObjectURL(blob);
					this.loading = false;
				});
				gif.render();
			});
		},
		openUrl() {
			window.open("https://github.com/ACFUN-FOSS/avup-gif-generator");
		}
	}
};
</script>

<style>
body,
html {
	margin: 0px;
	width: 100%;
	height: 100%;
	background: #fd4c5a;
}
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;

	padding-top: 20px;
	color: white !important;
}
.head {
	font-size: 32px;
}
.preview {
	max-width: 100%;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
	border: 3px dashed #666666;
}
.el-form-item {
	position: relative;
	left: 50%;
	transform: translateX(-50%);
	max-width: 50%;
	background-color: white;
	padding: 10px;
	margin-top: 18px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}
.el-form-item__content {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.el-form-item__content > div {
	flex-shrink: 0;
}
.input-row {
	display: flex;
	align-items: center;
	margin-top: 16px;
}
.input-row > div {
	display: flex;
	flex-shrink: 0;
	white-space: nowrap;
	align-items: center;
	margin-left: 16px;
}
</style>
