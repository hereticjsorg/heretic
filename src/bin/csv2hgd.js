/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const {
    IPv4CidrRange,
    IPv6CidrRange,
} = require("ip-num/IPRange");
const zlib = require("zlib");

const geoLocales = {
    en: "en-us",
    de: "de-de",
    es: "es-es",
    fr: "fr-fr",
    ja: "ja-jp",
    "pt-BR": "pt-br",
    ru: "ru-ru",
    "zh-CN": "zh-cn",
};

const CHUNK_SIZE_V4 = 1080000;
const CHUNK_SIZE_V6 = 2400000;

const generateCityBlocksBinaryV4 = () => {
    const fileNameCityBlocks4 = "csv/GeoLite2-City-Blocks-IPv4.csv";
    const pathCityBlocks4 = path.join(__dirname, fileNameCityBlocks4);
    if (!fs.existsSync(pathCityBlocks4)) {
        throw new Error(`File is missing: ${fileNameCityBlocks4}`);
    }
    const csvCityBlocks4 = fs.readFileSync(pathCityBlocks4, "utf8").split(/\n/);
    const data = [];
    let buf = Buffer.alloc(CHUNK_SIZE_V4);
    let pos = 0;
    for (const line of csvCityBlocks4) {
        const [netmask, geoNameIdCity, geoNameIdCountry] = line.split(/,/);
        if (!netmask || netmask === "network" || (!geoNameIdCity && !geoNameIdCountry)) {
            continue;
        }
        const ipRange = IPv4CidrRange.fromCidr(netmask);
        buf.writeUInt32BE(parseInt(geoNameIdCity, 10), pos);
        pos += 4;
        buf.writeUInt32BE(parseInt(geoNameIdCountry, 10), pos);
        pos += 4;
        buf.writeUInt32BE(parseInt(ipRange.getLast().value, 10), pos);
        pos += 4;
        if (pos > CHUNK_SIZE_V4 - 12) {
            const headBuf = Buffer.alloc(4);
            const compressedBuf = zlib.brotliCompressSync(buf);
            headBuf.writeUInt32BE(compressedBuf.length);
            data.push(headBuf);
            data.push(compressedBuf);
            pos = 0;
            buf = Buffer.alloc(CHUNK_SIZE_V4);
        }
    }
    if (buf.length) {
        const headBuf = Buffer.alloc(4);
        const compressedBuf = zlib.brotliCompressSync(buf);
        headBuf.writeUInt32BE(compressedBuf.length);
        data.push(headBuf);
        data.push(compressedBuf);
    }
    fs.writeFileSync(path.join(__dirname, "/data/geoNetworksV4.hgd"), Buffer.concat(data));
};

const generateCityBlocksBinaryV6 = () => {
    const fileNameCityBlocks6 = "csv/GeoLite2-City-Blocks-IPv6.csv";
    const pathCityBlocks6 = path.join(__dirname, fileNameCityBlocks6);
    if (!fs.existsSync(pathCityBlocks6)) {
        throw new Error(`File is missing: ${fileNameCityBlocks6}`);
    }
    const csvCityBlocks6 = fs.readFileSync(pathCityBlocks6, "utf8").split(/\n/);
    const data = [];
    let buf = Buffer.alloc(CHUNK_SIZE_V6);
    let pos = 0;
    for (const line of csvCityBlocks6) {
        const [netmask, geoNameIdCity, geoNameIdCountry] = line.split(/,/);
        if (!netmask || netmask === "network" || (!geoNameIdCity && !geoNameIdCountry)) {
            continue;
        }
        const ipRange = IPv6CidrRange.fromCidr(netmask);
        buf.writeUInt32BE(parseInt(geoNameIdCity, 10), pos);
        buf.writeUInt32BE(parseInt(geoNameIdCountry, 10), pos + 4);
        const lastPartString = String(ipRange.getLast().value);
        const partOne = lastPartString.slice(0, lastPartString.length / 2);
        const partTwo = lastPartString.slice(lastPartString.length / 2, lastPartString.length);
        buf.writeBigUint64BE(BigInt(partOne), pos + 8);
        buf.writeBigUint64BE(BigInt(partTwo), pos + 16);
        pos += 24;
        if (pos > CHUNK_SIZE_V6 - 24) {
            const headBuf = Buffer.alloc(4);
            const compressedBuf = zlib.brotliCompressSync(buf);
            headBuf.writeUInt32BE(compressedBuf.length);
            data.push(headBuf);
            data.push(compressedBuf);
            pos = 0;
            buf = Buffer.alloc(CHUNK_SIZE_V6);
        }
    }
    if (buf.length) {
        const headBuf = Buffer.alloc(4);
        const compressedBuf = zlib.brotliCompressSync(buf);
        headBuf.writeUInt32BE(compressedBuf.length);
        data.push(headBuf);
        data.push(compressedBuf);
    }
    fs.writeFileSync(path.join(__dirname, "/data/geoNetworksV6.hgd"), Buffer.concat(data));
};

const generateCityDataBinary = () => {
    // const geoPairs = {};
    const cities = {};
    for (const lang of Object.keys(geoLocales)) {
        const fileNameCityData = `csv/GeoLite2-City-Locations-${lang}.csv`;
        const pathCityData = path.join(__dirname, fileNameCityData);
        if (!fs.existsSync(pathCityData)) {
            throw new Error(`File is missing: ${fileNameCityData}`);
        }
        const csvCityData = fs.readFileSync(pathCityData, "utf8").split(/\n/);
        for (const line of csvCityData) {
            // eslint-disable-next-line prefer-const
            let [geoNameId, , continentCode, , countryCode, , , , , , city] = line.split(/,/);
            if (!geoNameId || geoNameId === "geoname_id") {
                continue;
            }
            geoNameId = parseInt(geoNameId, 10);
            cities[geoNameId] = cities[geoNameId] || {};
            cities[geoNameId].continentCode = continentCode;
            cities[geoNameId].countryCode = countryCode;
            if (city) {
                city = city.replace(/"/gm, "");
                cities[geoNameId][geoLocales[lang]] = city;
            }
            // if (lang === "en") {
            //     const cityHash = crypto.createHash("md5").update(`${continentCode}.${countryCode}.${city}`).digest("hex");
            //     cities[geoNameId].hash = cityHash;
            //     geoPairs[geoNameId] = cityHash;
            // }
        }
    }
    const citiesBufArr = [];
    for (const k of Object.keys(cities)) {
        const dataArr = [];
        for (const kk of Object.keys(cities[k])) {
            if (["countryCode", "geoNameId", "hash", "continentCode"].indexOf(kk) !== -1) {
                continue;
            }
            dataArr.push(kk);
            dataArr.push(cities[k][kk]);
        }
        const dataStr = dataArr.join("\t");
        const citiesDataBuf = Buffer.alloc(4 + 4 + (dataStr.length * 2));
        let offset = 0;
        citiesDataBuf.writeUInt32BE(k, offset);
        offset += 4;
        citiesDataBuf.writeUInt16BE((dataStr.length * 2), offset);
        offset += 4;
        citiesDataBuf.write(dataStr, offset, "utf8");
        const headBuf = Buffer.alloc(4);
        const compressedBuf = zlib.brotliCompressSync(citiesDataBuf);
        headBuf.writeUInt32BE(compressedBuf.length);
        citiesBufArr.push(headBuf);
        citiesBufArr.push(compressedBuf);
    }
    fs.writeFileSync(path.join(__dirname, "/data/geoCities.hgd"), Buffer.concat(citiesBufArr));
};

const generateCountryDataBinary = () => {
    const countries = {};
    for (const lang of Object.keys(geoLocales)) {
        const fileNameCountryData = `csv/GeoLite2-Country-Locations-${lang}.csv`;
        const pathCountryData = path.join(__dirname, fileNameCountryData);
        if (!fs.existsSync(pathCountryData)) {
            throw new Error(`File is missing: ${fileNameCountryData}`);
        }
        const csvCountryData = fs.readFileSync(pathCountryData, "utf8").split(/\n/);
        for (const line of csvCountryData) {
            // eslint-disable-next-line prefer-const
            let [geoNameId, , continentCode, continentName, countryCode, countryName, isEU] = line.split(/,/);
            if (!geoNameId || geoNameId === "geoname_id") {
                continue;
            }
            geoNameId = parseInt(geoNameId, 10);
            isEU = parseInt(isEU, 10);
            continentName = continentName.replace(/"/gm, "");
            countryName = countryName.replace(/"/gm, "");
            countries[geoNameId] = countries[geoNameId] || {};
            countries[geoNameId].continentCode = continentCode || "";
            countries[geoNameId].countryCode = countryCode || "";
            countries[geoNameId].eu = isEU;
            countries[geoNameId][geoLocales[lang]] = {};
            countries[geoNameId][geoLocales[lang]].continentName = continentName || "";
            countries[geoNameId][geoLocales[lang]].countryName = countryName || "";
        }
    }
    const countriesBufArr = [];
    for (const k of Object.keys(countries)) {
        const {
            continentCode,
            countryCode,
            eu,
        } = countries[k];
        const dataArr = [];
        for (const kk of Object.keys(countries[k])) {
            if (["countryCode", "geoNameId", "eu", "continentCode"].indexOf(kk) !== -1) {
                continue;
            }
            dataArr.push(kk);
            dataArr.push(countries[k][kk].continentName);
            dataArr.push(countries[k][kk].countryName);
        }
        const dataStr = dataArr.join("\t");
        const countryDataBuf = Buffer.alloc(4 + 2 + 2 + 1 + 4 + (dataStr.length * 2));
        let offset = 0;
        countryDataBuf.writeUInt32BE(k, offset);
        offset += 4;
        countryDataBuf.write(continentCode, offset);
        offset += 2;
        countryDataBuf.write(countryCode, offset);
        offset += 2;
        countryDataBuf.writeUInt8(eu, offset);
        offset += 1;
        countryDataBuf.writeUInt16BE((dataStr.length * 2), offset);
        offset += 4;
        countryDataBuf.write(dataStr, offset, "utf8");
        const headBuf = Buffer.alloc(4);
        const compressedBuf = zlib.brotliCompressSync(countryDataBuf);
        headBuf.writeUInt32BE(compressedBuf.length);
        countriesBufArr.push(headBuf);
        countriesBufArr.push(compressedBuf);
    }
    fs.writeFileSync(path.join(__dirname, "/data/geoCountries.hgd"), Buffer.concat(countriesBufArr));
};

fs.ensureDirSync(path.join(__dirname, "data"));

console.log("Generating binary data for IPv4 blocks...");
generateCityBlocksBinaryV4();
console.log("Generating binary data for IPv6 blocks...");
generateCityBlocksBinaryV6();
console.log("Generating cities binary data...");
generateCityDataBinary();
console.log("Generating countries binary data...");
generateCountryDataBinary();
console.log("All done.");
