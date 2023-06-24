/* eslint-disable no-promise-executor-return */
/*
    A fork of https://github.com/alexbbt/read-last-lines
    Copyright (c) 2016 Alexander Bell-Towne
    MIT License
    Modified by Mikhail Matveev (c) 2023
*/

const fs = require("fs-extra");

const NEW_LINE_CHARACTERS = ["\n"];

module.exports = class {
    async readPreviousChar(stat, file, currentCharacterCount) {
        const position = stat.size - 1 - currentCharacterCount;
        const {
            buffer
        } = await fs.read(
            file,
            Buffer.alloc(1),
            0,
            1,
            position,
        );
        return String.fromCharCode(buffer[0]);
    }

    async doWhileLoop(
        self,
        lines,
        chars,
        lineCount,
        maxLineCount,
        resolve
    ) {
        if (lines.length > self.stat.size) {
            lines = lines.substring(lines.length - self.stat.size);
        }
        if (lines.length >= self.stat.size || lineCount >= maxLineCount) {
            if (NEW_LINE_CHARACTERS.includes(lines.substring(0, 1))) {
                lines = lines.substring(1);
            }
            fs.close(self.file);
            return resolve(Buffer.from(lines, "binary").toString("utf8"));
        }
        const nextCharacter = await this.readPreviousChar(self.stat, self.file, chars);
        lines = nextCharacter + lines;
        if (NEW_LINE_CHARACTERS.includes(nextCharacter) && lines.length > 1) {
            lineCount += 1;
        }
        chars += 1;
        await this.doWhileLoop(self, lines, chars, lineCount, maxLineCount, resolve);
    }

    async read(inputFilePath, maxLineCount) {
        return new Promise(async (resolve, reject) => {
            const self = {
                stat: null,
                file: null
            };
            try {
                await Promise.all([
                    fs.stat(inputFilePath).then((stat) => (self.stat = stat)),
                    fs.open(inputFilePath, "r").then((file) => (self.file = file)),
                ]);
                const chars = 0;
                const lines = "";
                return this.doWhileLoop(self, lines, chars, 0, maxLineCount, resolve);
            } catch (reason) {
                if (self.file !== null) {
                    try {
                        fs.close(self.file);
                    } catch {
                        // We might get here if the encoding is invalid
                        // Since we are already rejecting, let's ignore this error
                    }
                }
                return reject(reason);
            }
        });
    }
};
