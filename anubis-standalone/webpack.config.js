const path = require("path");

module.exports = {
	entry: "./src/browser/anubis-browser.ts",
	mode: "production",
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	output: {
		filename: "anubis.min.js",
		path: path.resolve(__dirname, "dist/browser"),
		library: "Anubis",
		libraryTarget: "umd",
		globalObject: "this",
	},
	optimization: {
		minimize: true,
	},
	target: "web",
};
