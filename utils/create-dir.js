#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const del = require("del");

const DEST_ZIP_DIR = path.join(__dirname, "../build-zip");
if (!fs.existsSync(DEST_ZIP_DIR)) {
    fs.mkdirSync(DEST_ZIP_DIR);
}

const extractExtensionData = () => {
	const extPackageJson = require("../package.json");
	return {
		name: extPackageJson.name,
		version: extPackageJson.version,
	};
};

const main = () => {
	const { name, version } = extractExtensionData();

	const dir = path.join(DEST_ZIP_DIR, `${name}-v${version}-ext-package`);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
    else {
        del([dir + '/*']);
    }
};

main();
