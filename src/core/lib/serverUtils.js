import fs from "fs-extra";

export default class {
    static async readLastStringsFromFile(inputFilePath, readLength) {
        try {
            const handle = await fs.open(inputFilePath, "r");
            const {
                size,
            } = await fs.stat(inputFilePath);
            readLength = size > readLength ? readLength : size;
            const position = size - readLength;
            const {
                buffer,
            } = await fs.read(handle, Buffer.alloc(readLength), 0, readLength, position);
            await fs.close(handle);
            return buffer.toString().split(/\n/).filter((_, i) => i > 0);
        } catch {
            return [];
        }
    }
}
