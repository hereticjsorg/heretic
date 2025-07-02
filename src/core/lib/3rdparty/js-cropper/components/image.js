import Promise from "es6-promise";
import Element from "./element.js";
import Size from "../objects/size.js";

/**
 * Class representing an Image element
 */
export default class Image extends Element {
    /**
     * Create an element
     *
     */
    constructor() {
        super("img");
        // eslint-disable-next-line no-multi-assign
        this._scale = this._originScale = 1;
        this._zoom = 0;
    }

    /**
     * Load an image by URL and set 'src' attribute.
     *
     * @param {String} url - The url or path to image
     * @return {Promise} A promise that returns {@link load~resolve} if resolved and {@link load~reject} if rejected.
     */
    load(url) {
        return new Promise((resolve, reject) => {
            this.getNode().onload = () => {
                this._checkFormat();
                resolve(this);
            };
            this.getNode().onerror = () => {
                reject(Error("Can't load an image."));
            };
            this.getNode().src = url;
            this.getNode().crossOrigin = "Anonymous";
        });
    }

    toBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });

    /**
     * Load an image by data and set 'src' attribute (base64).
     *
     * @param {String} url - The url or path to image
     * @return {Promise} A promise that returns {@link load~resolve} if resolved and {@link load~reject} if rejected.
     */
    loadData(file) {
        return new Promise(async (resolve, reject) => {
            this.getNode().onload = () => {
                this._checkFormat();
                resolve(this);
            };
            this.getNode().onerror = () => {
                reject(Error("Can't load an image."));
            };
            this.getNode().src = await this.toBase64(file);
            this.getNode().crossOrigin = "Anonymous";
        });
    }

    loadDataBase64(imageData) {
        return new Promise(async (resolve, reject) => {
            this.getNode().onload = () => {
                this._checkFormat();
                resolve(this);
            };
            this.getNode().onerror = () => {
                reject(Error("Can't load an image."));
            };
            this.getNode().src = imageData;
            this.getNode().crossOrigin = "Anonymous";
        });
    }

    /**
     * Method, which check image format is portrait.
     *
     * @return {Boolean} Returns true if portrait.
     */
    isPortrait() {
        return this._checkFormat() === "portrait";
    }

    /**
     * Method, which check image format is landscape.
     *
     * @return {Boolean} Returns true if landscape.
     */
    isLandscape() {
        return this._checkFormat() === "landscape";
    }

    /**
     * Method, which check image format is square.
     *
     * @return {Boolean} Returns true if square.
     */
    isSquare() {
        return this._checkFormat() === "square";
    }

    /**
     * Scale image to fit Frame.
     *
     * @param {Frame} frame - A Frame object.
     * @return {Number} - Scale value.
     */
    scaleToFit(frame) {
        const widthScale = frame.getRect().size.width / this.getNode().width;
        const heightScale = frame.getRect().size.height / this.getNode().height;
        const largestScale =
            widthScale > heightScale ? widthScale : heightScale;
        // eslint-disable-next-line no-multi-assign
        this._scale = this._originScale = largestScale;
        return this._scale;
    }

    /**
     * Get actual size of image
     *
     * @return {Size} - Returns Size object, which contain weight and height
     */
    getSize() {
        const w = this.getNode().width * this._scale;
        const h = this.getNode().height * this._scale;
        return new Size(w, h);
    }

    /**
     * Zoom an image
     *
     * @param {Number} zoom - Zoom value, from 0 to 1.0
     * @return {Image} - An Image object.
     */
    setZoom(zoom) {
        this._zoom = zoom;
        this._scale = this._originScale + (this._originScale * zoom);
        return this;
    }

    /**
     * Get actual zoom value
     *
     * @return {Number} - Zoom value.
     */
    getZoom() {
        return this._zoom;
    }

    /**
     * Get actual scale value
     *
     * @returns {Number} - An actual scale value.
     */
    getScale() {
        return this._scale;
    }

    /**
     * Get origin scale value (without zoom)
     *
     * @returns {Number} - An origin scale value.
     */
    getOriginScale() {
        return this._originScale;
    }

    /**
     * Method, which check an image format (landscape or portrait) and save it.
     *
     * @return {String} Format.
     */
    _checkFormat() {
        if (this.getNode().width > this.getNode().height) {
            return "landscape";
        }
        if (this.getNode().width < this.getNode().height) {
            return "portrait";
        }
        return "square";
    }
}
