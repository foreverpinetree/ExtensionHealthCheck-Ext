const webpack = require("webpack");
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const autoprefixer = require("autoprefixer");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const bro = process.env.BROSWER === "Edge" ? "-edge" : "";
const isZIP = process.env.TYPE === "zip";
const isLocal = process.env.LOCAL === "1";
const isProVersion = process.env.PRO === "1";

const options = {
	mode: process.env.NODE_ENV || "development",
	node: {
		child_process: "empty",
		fs: "empty", // if unable to resolve "fs"
	},
	entry: {
		popup: path.join(__dirname, "src", "pages", "popup", "popup.js"),
		"service-worker": path.join(__dirname, "src", "background", "index.js"),
		background: path.join(__dirname, "src", "background", "background.js"),
	},
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
		// chunkFilename: "[name].js",
		globalObject: "this",
	},
	module: {
		rules: [
			{
				test: /\.m?js$/,
				include: [
					path.resolve(__dirname, "src"),
					path.resolve(__dirname, "node_modules/buefy"),
				],
				use: {
					loader: "babel-loader",
					options: {
						presets: [["@babel/preset-env", { targets: "defaults" }]],
						plugins: [
							"@babel/plugin-proposal-nullish-coalescing-operator",
							"@babel/plugin-proposal-optional-chaining",
							"@babel/plugin-proposal-class-properties",
                            "@babel/plugin-proposal-private-methods",
						],
					},
				},
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: ["babel-loader"],
			},
			{
				test: /\.vue$/,
				loader: "vue-loader",
			},
			{
				test: /\.(scss|css)$/,
				oneOf: [
					// Shadow DOM 样式（?shadow）
					{
						resourceQuery: /shadow/,
						use: [
							{
                                loader: "to-string-loader", // 转换为字符串但保留 CSS 处理
                            },
                            "css-loader",
                            {
                                loader: "postcss-loader"
                            },
                            "sass-loader",
						],
					},
					// 全局样式
					{
						use: [
                            MiniCssExtractPlugin.loader,
                            "css-loader",
                            {
                                loader: "postcss-loader"
                            },
                            "sass-loader",
						],
					},
				],
			},
			{
				test: /\.(eot|ttf|woff|woff2)(\?\S*)?$/,
				loader: "file-loader",
			},
			{
				test: /\.(png|jpe?g|gif|webm|mp4|svg)$/,
				loader: "file-loader",
				options: {
					name: "[name].[ext]",
					outputPath: "assets/img",
					esModule: false,
				},
			},
		],
	},
	resolve: {
		alias: {
			vue$: "vue/dist/vue.runtime.esm-bundler.js",
			"@common": path.resolve(__dirname, "src", "common"),
		},
		extensions: ["*", ".js", ".vue", ".json"],
	},
	plugins: [
		new webpack.ProgressPlugin(),
		// expose and write the allowed env vars on the compiled bundle
		new webpack.EnvironmentPlugin({ NODE_ENV: "development", BROSWER: "" }),
		// Clean the Build Folder
		new CleanWebpackPlugin({
			verbose: true,
			cleanStaleWebpackAssets: true,
		}),
		new VueLoaderPlugin(),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[name].css",
		}),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "src", "pages", "popup", "popup.html"),
			filename: "popup.html",
			chunks: ["popup"],
			cache: false,
		}),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.resolve(__dirname, "src", `manifest${bro}.json`),
					to: path.resolve(__dirname, "dist", "manifest.json"),
					force: true,
					transform: function (content, path) {
						let json = JSON.parse(content.toString());
						if (
							process.env.BROSWER === "Edge" &&
							process.env.NODE_ENV != "development" &&
							isZIP &&
							!isLocal
						) {
							json.key = undefined;
							delete json.key;
						}
						return Buffer.from(
							JSON.stringify({
								// description: process.env.npm_package_description,
								version: process.env.npm_package_version,
								...json,
							})
						);
					},
				},
				{ from: "src/icons", to: "icons", force: true },
				//{ from: 'src/assets', to: 'assets', force: true, },
				{ from: "src/libs", to: "libs", force: true },
				{ from: "src/_locales", to: "_locales", force: true },
				//{ from: path.resolve(__dirname, "rules.json"), to: path.resolve(__dirname, "dist"), force: true, },
			],
		}),
	],
	infrastructureLogging: {
		level: "info",
	},
};

if (process.env.NODE_ENV === "development") {
	options.devtool = "cheap-module-source-map";
} else {
	options.optimization = {
		minimize: isProVersion ? false : true,
		minimizer: [
			new TerserPlugin({
				extractComments: false,
				parallel: true,
				terserOptions: {
					ecma: 6,
					output: {
						ascii_only: true,
					},
				},
			}),
		],
	};
}

module.exports = options;
