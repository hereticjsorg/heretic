import path from "path";
import opentype from "opentype.js";

export default class {
    constructor(fastify, options = {}) {
        this.options = {
            width: 100,
            height: 40,
            background: "",
            charPreset: "0123456789",
            size: 4,
            noise: 5,
            ...options,
        };
        this.font = opentype.loadSync(path.join(__dirname, "data", "captcha.ttf"));
        this.fastify = fastify;
    }

    rndPathCmd(cmd) {
        const r = (Math.random() * 0.2) - 0.1;
        switch (cmd.type) {
        case "M":
        case "L":
            cmd.x += r;
            cmd.y += r;
            break;
        case "Q":
        case "C":
            cmd.x += r;
            cmd.y += r;
            cmd.x1 += r;
            cmd.y1 += r;
            break;
        default:
            // Close path cmd
            break;
        }
        return cmd;
    }

    chrToPath(char, x, y, fontSize, font) {
        const fontScale = fontSize / font.unitsPerEm;
        const glyph = font.charToGlyph(char);
        const width = glyph.advanceWidth ? glyph.advanceWidth * fontScale : 0;
        const left = x - (width / 2);
        const height = (font.ascender + font.descender) * fontScale;
        const top = y + (height / 2);
        const glyphPath = glyph.getPath(left, top, fontSize);
        glyphPath.commands.forEach(this.rndPathCmd);
        return glyphPath.toPathData();
    }

    hue2rgb(p, q, h) {
        h = (h + 1) % 1;
        if (h * 6 < 1) {
            return p + (q - p) * h * 6;
        }
        if (h * 2 < 1) {
            return q;
        }
        if (h * 3 < 2) {
            return p + (q - p) * ((2 / 3) - h) * 6;
        }
        return p;
    }

    getLightness(rgbColor) {
        if (rgbColor[0] !== "#") {
            return 1.0; // Invalid color ?
        }
        rgbColor = rgbColor.slice(1);
        if (rgbColor.length === 3) {
            rgbColor = rgbColor[0] + rgbColor[0]
                + rgbColor[1] + rgbColor[1] + rgbColor[2] + rgbColor[2];
        }
        const hexColor = parseInt(rgbColor, 16);
        // eslint-disable-next-line no-bitwise
        const r = hexColor >> 16;
        // eslint-disable-next-line no-bitwise
        const g = (hexColor >> 8) & 255;
        // eslint-disable-next-line no-bitwise
        const b = hexColor & 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return (max + min) / (2 * 255);
    }

    invertColor(bgColor) {
        const hue = this.randomInt(0, 360) / 360;
        const saturation = this.randomInt(60, 80) / 100;
        const baseLightness = bgColor ? this.getLightness(bgColor) : 1.0;
        let lightness;
        if (baseLightness >= 0.5) {
            lightness = baseLightness - 0.3 - Math.random() * 0.2;
        } else {
            lightness = baseLightness + 0.3 + Math.random() * 0.2;
        }
        const q = lightness < 0.5 ? lightness * (lightness + saturation) : lightness + saturation - (lightness * saturation);
        const p = (2 * lightness) - q;
        const r = Math.floor(this.hue2rgb(p, q, hue + (1 / 3)) * 255);
        const g = Math.floor(this.hue2rgb(p, q, hue) * 255);
        const b = Math.floor(this.hue2rgb(p, q, hue - (1 / 3)) * 255);
        // eslint-disable-next-line no-mixed-operators, no-bitwise
        const c = ((b | g << 8 | r << 16) | 1 << 24).toString(16).slice(1);
        return `#${ c}`;
    }

    mathExpr() {
        const left = this.randomInt(1, 9);
        const right = this.randomInt(1, 9);
        const text = (left + right).toString();
        const equation = `${left }+${ right}`;
        return {
            text,
            equation
        };
    }

    randomInt(min, max) {
        return Math.round(min + (Math.random() * (max - min)));
    }

    captchaText() {
        const chars = this.options.charPreset;
        let i = -1;
        let out = "";
        const len = chars.length - 1;
        // eslint-disable-next-line no-plusplus
        while (++i < this.options.size) {
            out += chars[this.randomInt(0, len)];
        }
        return out;
    }

    getLineNoise(width, height, noise, background) {
        const noiseLines = [];
        let i = -1;
        // eslint-disable-next-line no-plusplus
        while (++i < noise) {
            const start = `${this.randomInt(1, 21)} ${this.randomInt(1, height - 1)}`;
            const end = `${this.randomInt(width - 21, width - 1)} ${this.randomInt(1, height - 1)}`;
            const mid1 = `${this.randomInt((width / 2) - 21, (width / 2) + 21)} ${this.randomInt(1, height - 1)}`;
            const mid2 = `${this.randomInt((width / 2) - 21, (width / 2) + 21)} ${this.randomInt(1, height - 1)}`;
            const color = this.invertColor(background);
            noiseLines.push(`<path d="M${start} C${mid1},${mid2},${end}" stroke="${color}" fill="none"/>`);
        }
        return noiseLines;
    }

    getText(text, width, height) {
        const len = text.length;
        const spacing = (width - 2) / (len + 1);
        let i = -1;
        const out = [];
        // eslint-disable-next-line no-plusplus
        while (++i < len) {
            const x = spacing * (i + 1);
            const y = height / 2;
            const charPath = this.chrToPath(text[i], x, y, 50, this.font);
            const color = this.invertColor(this.options.background);
            out.push(`<path fill="${color}" d="${charPath}"/>`);
        }
        return out;
    }

    createCaptcha(text) {
        const {
            width,
            height,
            noise,
            background
        } = this.options;
        const bgRect = background ? `<rect width="100%" height="100%" fill="${background}"/>` : "";
        const paths = [].concat(this.getLineNoise(width, height, noise, background)).concat(this.getText(text, width, height)).join("");
        const start = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
        return `${start}${bgRect}${paths}</svg>`;
    }

    async verifyCaptcha(imageSecret, code) {
        let codeDb;
        if (this.fastify.redis) {
            codeDb = await this.redis.get(`${this.fastify.siteConfig.id}_captcha_${imageSecret}}`);
            await this.fastify.redis.del(`${this.fastify.siteConfig.id}_captcha_${imageSecret}}`);
        } else {
            const dbData = await this.fastify.mongo.db.collection(this.fastify.systemConfig.collections.captcha).findOne({
                _id: imageSecret,
            });
            if (dbData) {
                await this.fastify.mongo.db.collection(this.fastify.systemConfig.collections.captcha).updateOne({
                    _id: imageSecret,
                }, {
                    $set: {
                        code: null,
                    },
                }, {
                    upsert: false,
                });
                codeDb = dbData.code;
            }
        }
        return code && codeDb && String(codeDb) === String(code);
    }
}
