const fs = require("fs-extra");
const zlib = require("zlib");

/* eslint-disable no-console */
const {
    MongoClient,
    Long,
} = require("mongodb");
const config = require("../../etc/system");

const connectDatabase = async dbName => {
    const mongoClient = new MongoClient(config.mongo.url, config.mongo.options);
    await mongoClient.connect();
    const db = mongoClient.db(dbName || config.mongo.dbName);
    return [
        mongoClient,
        db,
    ];
};

const importBlocksV4 = async db => {
    const {
        size: fileSize,
    } = fs.statSync(`${__dirname}/data/geoNetworksV4.hgd`);
    const fd = fs.openSync(`${__dirname}/data/geoNetworksV4.hgd`);
    let globalOffset = 0;
    while (globalOffset <= fileSize) {
        const bufHead = Buffer.alloc(4);
        fs.readSync(fd, bufHead, 0, 4, globalOffset);
        const size = bufHead.readUInt32BE();
        if (!size) {
            break;
        }
        const bufData = Buffer.alloc(size);
        fs.readSync(fd, bufData, 0, size, globalOffset + 4);
        const uncompressedBuf = zlib.brotliDecompressSync(bufData);
        let pos = 0;
        const insertData = [];
        while (pos < uncompressedBuf.length) {
            const geoNameIdCity = uncompressedBuf.readUInt32BE(pos);
            pos += 4;
            const geoNameIdCountry = uncompressedBuf.readUInt32BE(pos);
            pos += 4;
            const blockEnd = uncompressedBuf.readUInt32BE(pos);
            pos += 4;
            if (blockEnd) {
                insertData.push({
                    geoNameIdCity: geoNameIdCity ? parseInt(geoNameIdCity, 10) : null,
                    geoNameIdCountry: geoNameIdCountry ? parseInt(geoNameIdCountry, 10) : null,
                    blockEnd,
                });
            }
        }
        if (insertData.length) {
            await db.collection(config.collections.geoNetworks).insertMany(insertData);
        }
        globalOffset = globalOffset + size + 4;
    }
    fs.closeSync(fd);
};

const importBlocksV6 = async db => {
    const {
        size: fileSize,
    } = fs.statSync(`${__dirname}/data/geoNetworksV6.hgd`);
    const fd = fs.openSync(`${__dirname}/data/geoNetworksV6.hgd`);
    let globalOffset = 0;
    while (globalOffset <= fileSize) {
        const bufHead = Buffer.alloc(4);
        fs.readSync(fd, bufHead, 0, 4, globalOffset);
        const size = bufHead.readUInt32BE();
        if (!size) {
            break;
        }
        const bufData = Buffer.alloc(size);
        fs.readSync(fd, bufData, 0, size, globalOffset + 4);
        const uncompressedBuf = zlib.brotliDecompressSync(bufData);
        let pos = 0;
        const insertData = [];
        while (pos < uncompressedBuf.length) {
            const geoNameIdCity = uncompressedBuf.readUInt32BE(pos);
            const geoNameIdCountry = uncompressedBuf.readUInt32BE(pos + 4);
            const blockEnd1 = uncompressedBuf.readBigUint64BE(pos + 8);
            const blockEnd2 = uncompressedBuf.readBigUint64BE(pos + 16);
            const blockEnd = BigInt(`${blockEnd1.toString()}${blockEnd2.toString()}`);
            pos += 24;
            if (blockEnd) {
                insertData.push({
                    geoNameIdCity: geoNameIdCity ? parseInt(geoNameIdCity, 10) : null,
                    geoNameIdCountry: geoNameIdCountry ? parseInt(geoNameIdCountry, 10) : null,
                    blockEnd: Long(blockEnd),
                });
            }
        }
        if (insertData.length) {
            await db.collection(config.collections.geoNetworks).insertMany(insertData);
        }
        globalOffset = globalOffset + size + 4;
    }
    fs.closeSync(fd);
};

const importCountries = async db => {
    const {
        size: fileSize,
    } = fs.statSync(`${__dirname}/data/geoCountries.hgd`);
    const fd = fs.openSync(`${__dirname}/data/geoCountries.hgd`);
    let globalOffset = 0;
    const insertData = [];
    while (globalOffset <= fileSize) {
        const bufHead = Buffer.alloc(4);
        fs.readSync(fd, bufHead, 0, 4, globalOffset);
        const size = bufHead.readUInt32BE();
        if (!size) {
            break;
        }
        const bufData = Buffer.alloc(size);
        fs.readSync(fd, bufData, 0, size, globalOffset + 4);
        const uncompressedBuf = zlib.brotliDecompressSync(bufData);
        let pos = 0;
        const geoNameId = parseInt(uncompressedBuf.readUInt32BE(pos), 10);
        pos += 4;
        const continentCode = uncompressedBuf.subarray(pos, pos + 2).toString();
        pos += 2;
        const countryCode = uncompressedBuf.subarray(pos, pos + 2).toString();
        pos += 2;
        const eu = uncompressedBuf.readUInt8(pos);
        pos += 1;
        const strDataLen = uncompressedBuf.readUInt16BE(pos);
        pos += 4;
        const strData = uncompressedBuf.subarray(pos, pos + strDataLen).toString();
        const data = {};
        const strArr = strData.split(/\t/);
        for (let i = 0; i < strArr.length; i += 3) {
            if (strArr[i + 1]) {
                data[strArr[i]] = data[strArr[i]] || {};
                data[strArr[i]].continent = strArr[i + 1];
            }
            if (strArr[i + 2]) {
                data[strArr[i]] = data[strArr[i]] || {};
                // eslint-disable-next-line no-control-regex
                data[strArr[i]].country = strArr[i + 2].replace(/\x00/gm, "");
            }
        }
        insertData.push({
            _id: String(geoNameId),
            continentCode,
            countryCode,
            eu: eu === 1,
            ...data,
        });
        globalOffset = globalOffset + size + 4;
    }
    if (insertData.length) {
        await db.collection(config.collections.geoCountries).insertMany(insertData);
    }
    fs.closeSync(fd);
};

const importCities = async db => {
    const {
        size: fileSize,
    } = fs.statSync(`${__dirname}/data/geoCities.hgd`);
    const fd = fs.openSync(`${__dirname}/data/geoCities.hgd`);
    let globalOffset = 0;
    const insertData = [];
    while (globalOffset <= fileSize) {
        const bufHead = Buffer.alloc(4);
        fs.readSync(fd, bufHead, 0, 4, globalOffset);
        const size = bufHead.readUInt32BE();
        if (!size) {
            break;
        }
        const bufData = Buffer.alloc(size);
        fs.readSync(fd, bufData, 0, size, globalOffset + 4);
        const uncompressedBuf = zlib.brotliDecompressSync(bufData);
        let pos = 0;
        const geoNameId = parseInt(uncompressedBuf.readUInt32BE(pos), 10);
        pos += 4;
        const strDataLen = uncompressedBuf.readUInt16BE(pos);
        pos += 4;
        const strData = uncompressedBuf.subarray(pos, pos + strDataLen).toString();
        const data = {};
        const strArr = strData.split(/\t/);
        for (let i = 0; i < strArr.length; i += 2) {
            if (strArr[i + 1]) {
                data[strArr[i]] = data[strArr[i]] || {};
                // eslint-disable-next-line no-control-regex
                data[strArr[i]] = strArr[i + 1].replace(/\x00/gm, "");
            }
        }
        if (geoNameId && Object.keys(data).length) {
            insertData.push({
                _id: String(geoNameId),
                ...data,
            });
            // await db.collection(config.collections.geoCities).insertOne({
            //     _id: geoNameId,
            //     ...data,
            // });
        }
        if (insertData.length > 9999) {
            await db.collection(config.collections.geoCities).insertMany(insertData);
            insertData.length = 0;
        }
        globalOffset = globalOffset + size + 4;
    }
    if (insertData.length) {
        await db.collection(config.collections.geoCities).insertMany(insertData);
    }
    fs.closeSync(fd);
};

(async () => {
    try {
        const [
            mongoClient,
            db,
        ] = await connectDatabase(config.mongo.dbName);
        console.log("Cleaning up...");
        await db.collection(config.collections.geoNetworks).deleteMany({});
        console.log("Inserting network data (IPv4)...");
        await importBlocksV4(db);
        console.log("Inserting network data (IPv6)...");
        await importBlocksV6(db);
        try {
            await db.collection(config.collections.geoNetworks).createIndex({
                blockEnd: 1,
            }, {
                name: "blockEndIndex",
            });
        } catch {
            // Ignore
        }
        console.log("Cleaning up...");
        await db.collection(config.collections.geoCountries).deleteMany({});
        console.log("Inserting countries data...");
        await importCountries(db);
        console.log("Cleaning up...");
        await db.collection(config.collections.geoCities).deleteMany({});
        console.log("Inserting cities data...");
        await importCities(db);
        mongoClient.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
