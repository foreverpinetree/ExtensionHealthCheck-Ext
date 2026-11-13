module.exports = {
	content: ["./src/contents/**/*.{html,js,vue}"],
	plugins: [require("daisyui")],
	daisyui: {
		themes: ["light", "dark"], // 按需配置主题
	},
};