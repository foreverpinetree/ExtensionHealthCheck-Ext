#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const del = require("del");

const DEST_DIR = path.join(__dirname, "../dist");
const DEST_ZIP_DIR = path.join(__dirname, "../build-zip");
const broswer = process.env.BROSWER;
const isLocal = process.env.LOCAL === "1";
const isProVersion = process.env.PRO === "1";
const createDir = process.env.DIR === "1";

const extractExtensionData = () => {
	const extPackageJson = require("../package.json");

	return {
		name: extPackageJson.name,
		version: extPackageJson.version,
	};
};

const makeDestZipDirIfNotExists = (dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
};

const buildZip = (src, dist, zipFilename) => {
	console.info(`Building ${zipFilename}...`);

	const archive = archiver("zip", { zlib: { level: 9 } });
	const stream = fs.createWriteStream(path.join(dist, zipFilename));

	return new Promise((resolve, reject) => {
		archive
			.directory(src, false)
			.on("error", (err) => reject(err))
			.pipe(stream);

		stream.on("close", () => resolve());
		archive.finalize();
	});
};

const main = () => {
	const { name, version } = extractExtensionData();

	let zipFilename = `${name}-v${version}-${broswer}${isLocal ? '-本地版' : ''}.zip`;
	if (isProVersion) {
		zipFilename = `${name}-v${version}-pro.zip`;
	}

    const dir = createDir ? path.join(DEST_ZIP_DIR, `${name}-v${version}-ext-package`) : DEST_ZIP_DIR;

	makeDestZipDirIfNotExists(dir);

	// Dist Temp Files Delete
	del(["dist/temp/*"]);

	if (isProVersion) {
		try {
			let background = fs.readFileSync(path.join(DEST_DIR, "background.js"), "utf-8");
			background = background.replace(/(result\.id[^;]*;?[\s]*)(sendResponse)/, "$1" + "result.pro = true;\n\t\t\t" + "$2");
			fs.writeFileSync(path.join(DEST_DIR, "background.js"), background, "utf-8");
		} catch (err) {
			//
		}

		try {
			let popup = fs.readFileSync(path.join(DEST_DIR, "popup.js"), "utf-8");
			popup = popup.replace(/(G\.exUser\s*=\s*result;?)/g, "result.pro = true;" + "\n\t\t\t\t\t\t  " + "$1");
			fs.writeFileSync(path.join(DEST_DIR, "popup.js"), popup, "utf-8");
		} catch (err) {
			//
		}
	}

	buildZip(DEST_DIR, dir, zipFilename)
		.then(() => console.info("OK"))
		.catch(console.err);
};

main();
