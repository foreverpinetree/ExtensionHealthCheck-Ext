import j2c from "json2csv";
import utils from "./utils";

const json2csv = j2c.parse;

class CSV {
	constructor() {}

	/**
	 * 导出数据
	 * @param {*} arr 导出的数据
     * @param fields, header
	 * @param {*} filename 文件名称
	 */
	async parseToCSV(arr, fields, filename) {
		const csv = json2csv(arr, { fields, withBOM: true });
		utils.exportToFile(csv, filename, '.csv');
	}
}
export default new CSV();