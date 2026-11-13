// import 'babel-polyfill';
const browser = chrome;

export default {
	/**
	 * 生成唯一的 UID，用于没有用户系统的时候
	 */
	generateUID() {
		let array = new Uint32Array(8);
		window.crypto.getRandomValues(array);
		return [].map
			.call(array, function (n) {
				return n.toString(16);
			})
			.join("");
	},

	/**
	 * 生成随机 ID
	 */
	makeId(length) {
		var result = "";
		var characters =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	},

	/**
	 * 把object变成列表形式的字符串，在输出某些object时会用到
	 * @param {*} obj
	 * @param {*} useQuot
	 * @param {*} keys
	 * @param {*} delimiter
	 * @returns
	 */
	toTextList(obj, useQuot = false, keys = null, delimiter = "\n") {
		if (!obj) {
			return "";
		}

		const texts = [];
		for (const [key, value] of Object.entries(obj)) {
			if (Array.isArray(keys)) {
				if (keys.includes(key)) {
					if (useQuot) {
						texts.push(`"${key}": "${value}"`);
					} else {
						texts.push(`${key}: ${value}`);
					}
				}
			} else {
				if (useQuot) {
					texts.push(`"${key}": "${value}"`);
				} else {
					texts.push(`${key}: ${value}`);
				}
			}
		}

		return texts.join(delimiter);
	},

	/**
	 * 获取 ？ 忘记了
	 * @param {*} str
	 */
	formatURLs(str) {
		return str.split(/\r?\n/);
	},

	/**
	 * 后去当前页面链接的变量，返回解析后的对象
	 * @param {*} url
	 */
	getUrlVars(url, needDecodeURIComponent = false) {
		const vars = {};
		const _url = url === undefined ? window.location.href : url;
		const hashes = _url
			.split("#")[0]
			.slice(_url.indexOf("?") + 1)
			.split("&");
		const len = hashes.length;

		for (let i = 0; i < len; i++) {
			const hash = hashes[i].split("=");

			if (needDecodeURIComponent) {
				vars[decodeURIComponent(hash[0])] = decodeURIComponent(hash[1]);
			} else {
				vars[hash[0]] = hash[1];
			}
		}

		return vars;
	},

	/**
	 * 根据params替换url里的变量的值，如果没发现变量，则添加到后面。
	 * @param {*} url
	 * @param {*} params
	 * @returns
	 */
	replaceUrlVars(url, params = {}) {
		const vars = this.getUrlVars(url);

		for (const [key, value] of Object.entries(params)) {
			if (vars[key] !== undefined) {
				url = url.replace(new RegExp(`([?&]${key}=)[^&]*`), "$1" + value);
			} else {
				if (url.includes("?")) {
					url += `&${key}=${value}`;
				} else {
					url += `?${key}=${value}`;
				}
			}
		}

		return url;
	},

	removeUrlParams(url, keys = []) {
		const urlObj = new URL(url);

		keys.forEach((param) => {
			if (urlObj.searchParams.has(param)) {
				urlObj.searchParams.delete(param);
			}
		});

		return urlObj.toString();
	},

	/**
	 * XMLHttpRequest loader
	 * @param {*} url
	 * @param {*} headers
	 * @param {*} variables
	 * @param {*} method
	 * @returns
	 */
	loadDataByXHR(url, headers = {}, variables = {}, method = "POST") {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if (xhr.status === 200 || xhr.status === 0) {
						//0 is for local test
						resolve(xhr.responseText);
					} else {
						reject(xhr.responseText);
					}
				}
			};

			let paramString;

			if (Array.isArray(variables)) {
				paramString = variables
					.map(
						({ key, value }) =>
							encodeURIComponent(key) + "=" + encodeURIComponent(value)
					)
					.join("&");
			} else {
				paramString = Object.entries(variables)
					.map(
						([key, value]) =>
							encodeURIComponent(key) + "=" + encodeURIComponent(value)
					)
					.join("&");
			}

			if (method === "POST") {
				xhr.open(method, url);

				for (const [hKey, hValue] of Object.entries(headers)) {
					xhr.setRequestHeader(hKey, hValue);
				}

				xhr.send(paramString);
			} else {
				const sign = url.includes("?") ? "&" : "?";
				xhr.open(method, paramString ? url + sign + paramString : url);

				for (const [hKey, hValue] of Object.entries(headers)) {
					xhr.setRequestHeader(hKey, hValue);
				}

				xhr.send();
			}
		});
	},

	cloneObj(obj, removeKeys = null) {
		if (!obj) {
			return obj;
		}

		let cloneObj;
		try {
			cloneObj = JSON.parse(JSON.stringify(obj));
		} catch (err) {
			//
		}

		if (removeKeys && cloneObj) {
			if (!Array.isArray(removeKeys)) {
				removeKeys = [removeKeys];
			}

			for (const key of removeKeys) {
				if (cloneObj.hasOwnProperty(key)) {
					delete cloneObj[key];
				}
			}
		}

		return cloneObj || {};
	},

	listenEventPromise(eventName, detail = {}) {
		return new Promise((resolve, reject) => {
			const onDone = function (evt) {
				const detail = evt.detail;
				window.removeEventListener(eventName + "_result", onDone, false);
				resolve(detail);
			};
			window.addEventListener(eventName + "_result", onDone, false);

			const evt = new CustomEvent(eventName, { detail });
			window.dispatchEvent(evt);
		});
	},

	insertElementToFirst(wrap, element) {
		if (!wrap || !element) {
			return;
		}

		if (wrap.firstElementChild) {
			wrap.insertBefore(element, wrap.firstElementChild);
		} else {
			wrap.appendChild(element);
		}
	},

	/**
	 * 解析srcset获取图片地址
	 * @param {*} srcset
	 * @param {*} sortBySize
	 * @returns
	 */
	getImagesFromSrcset(srcset, sortBySize = "asc") {
		if (!srcset) {
			return [];
		}

		const urls = srcset
			.split(",")
			.map((str) => {
				const arr = str.trim().split(" ");
				return [arr[0], arr[1] || 0];
			})
			.sort((a, b) => {
				return sortBySize === "asc"
					? parseInt(a[1]) - parseInt(b[1])
					: parseInt(b[1]) - parseInt(a[1]);
			})
			.map((arr) => arr[0])
			.filter((url) => !!url);

		return urls;
	},

	/**
	 * 获取插件版本信息
	 */
	getVersion() {
		return browser.runtime.getManifest().version;
	},

	/**
	 * 获取范围内的随机整数
	 * @param {*} num1
	 * @param {*} num1
	 */
	rand(num1, num2) {
		return Math.floor((num2 - num1 + 1) * Math.random() + num1);
	},

	/**
	 * 获取 manifest 文件内容
	 * @returns object
	 */
	getManifest() {
		return browser.runtime.getManifest();
	},

	/**
	 * 停留时间
	 * @param {Number} ms 毫秒，停留时间
	 */
	wait(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	},

	getFilenameFromUrl(url) {
		const pathname = new URL(url).pathname;
		const index = pathname.lastIndexOf("/");
		return pathname.substring(index + 1);
	},

	removeFileExtension(fileName) {
		if (!fileName) return "";

		const index = fileName.lastIndexOf(".");
		if (index > 0) {
			return fileName.substring(0, index);
		}
		return fileName;
	},

	getFileExtension(fileName) {
		if (!fileName) return "";

		const index = fileName.lastIndexOf(".");
		if (index > 0) {
			return fileName.substring(index);
		}
		return fileName;
	},

	/**
	 * 获取扩展的 id
	 */
	getExtensionId() {
		return browser.runtime.id;
	},

	/**
	 * 导出 * 文件
	 * @param {*} data 数据
	 * @param {*} filename 文件名称
	 * @param {*} format 文件格式
	 */
	exportToFile(data, filename, format) {
		window.blob = new Blob([data], { type: "application/octet-binary" });
		window.url = URL.createObjectURL(blob);
		var pom = document.createElement("a");
		pom.setAttribute("href", url);
		pom.setAttribute("download", filename + format);
		pom.click();
	},

	blobToBase64(blob) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	},

	/**
	 * 获取当前扩展程序包内文件
	 * @param {*} path
	 */
	getSource(path) {
		return browser.extension.getURL(path);
	},

	/**
	 * 加密，会对应插件的名字进行解密，与后端对应
	 * @param {*} salt
	 * @returns
	 */
	cipher(salt) {
		const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
		const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
		const applySaltToChar = (code) =>
			textToChars(salt).reduce((a, b) => a ^ b, code);

		return (text) =>
			text
				.split("")
				.map(textToChars)
				.map(applySaltToChar)
				.map(byteHex)
				.join("");
	},

	/**
	 * 解密，会对应插件的名字进行解密，与后端对应
	 * @param {*} salt
	 * @returns
	 */
	decipher(salt) {
		const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
		const applySaltToChar = (code) =>
			textToChars(salt).reduce((a, b) => a ^ b, code);
		return (encoded) =>
			encoded
				.match(/.{1,2}/g)
				.map((hex) => parseInt(hex, 16))
				.map(applySaltToChar)
				.map((charCode) => String.fromCharCode(charCode))
				.join("");
	},

	/**
	 * 首字大写
	 * @param {*} string
	 * @returns
	 */
	capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	async createTab(url) {
		let tab = await browser.tabs.create({
			url,
		});
		return tab;
	},

	async getCurrentTab() {
		let q = {
			active: true,
			currentWindow: true,
		};
		let tab = await browser.tabs.query(q);
		return tab[0];
	},

	getDateString(includeTime = false) {
		const date = new Date();
		const pad = (n) => n.toString().padStart(2, "0");

		let dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
			date.getDate()
		)}`;

		if (includeTime) {
			const hours = pad(date.getHours());
			const minutes = pad(date.getMinutes());
			const seconds = pad(date.getSeconds());

			dateStr += `_${hours}-${minutes}-${seconds}`;
		}

		return dateStr;
	},

    compareVersion (v1, v2) {
        const v1parts = v1.split('.').map(num => parseInt(num, 10));
        const v2parts = v2.split('.').map(num => parseInt(num, 10));

        const len = Math.max(v1parts.length, v2parts.length);

        for(let i = 0; i < len; i++) {
            const v1part = v1parts[i] || 0;
            const v2part = v2parts[i] || 0;

            if(v1part > v2part) {
                return 1;
            }
            
            if(v1part < v2part) {
                return -1;
            }
        }

        return 0;
    },
};
