<template>
	<div class="img-loader">
		<input @change="getImage" type="file" :accept="accept" v-if="!src" />
		<el-image class="image" v-if="src" :src="src" />
	</div>
</template>

<script>
export default {
	name: "imgLoader",
	props: ["value", "accept"],
	computed: {
		values: {
			get() {
				return this.value;
			},
			set(e) {
				this.$emit("input", e);
			}
		},
		src() {
			if (this.values) {
				return this.values.url;
			}
			return "";
		}
	},
	methods: {
		getImage(e) {
			const blob = e.srcElement.files[0];
			const url = URL.createObjectURL(blob);
			this.values = {
				blob,
				url
			};
		}
	}
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.img-loader {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
}
.item {
	position: relative;
}
.image {
	max-width: 50%;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
	border: 3px dashed #666666;
	display: block;
}
</style>
