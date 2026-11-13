import CSV from './csv';
import utils from './utils';
import * as XLSX from 'xlsx';

class DataFormat {
	constructor() {
        //
    }

	exportTo (data, headers, dataFormat, filename) {
        if(!Array.isArray(data) || data.length === 0) {
            alert('No data!');
            return;
        }

        if(dataFormat === 'json') {
            this.toJSON(data, filename);
        }
        else if(dataFormat === 'xlsx') {
            this.toXLSX(data, headers, filename);
        }
        else {
            this.toCSV(data, headers, filename);
        }
    }

    async toCSV (data, headers, filename) {
        CSV.parseToCSV(data, headers, filename);
    }

    async toJSON (data, filename) {
        utils.exportToFile(JSON.stringify(data), filename, '.json');
    }

    async toXLSX (data, headers, filename) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(wb, ws, 'Export Data (' + data.length + ')');
        const buffer = XLSX.write(wb, {type: 'array', bookType: 'xlsx', Props: { Author: 'ExtensionsBox' }});
        utils.exportToFile(buffer, filename, '.xlsx');
    }
}

export default new DataFormat();