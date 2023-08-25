import validateNode from "../validators/node";
import validateConfig from "../validators/config";
import validateDimension from "../validators/dimension";
import validateCallback from "../validators/callback";
import { defaultDimensions } from "../config/default";
import Canvas from "../components/canvas";
import Image from "../components/image";
import Slider from "../components/slider";
import Element from "../components/element";
import Icon from "../components/icon";

/**
 * Class representing Image Crop
 */
export default class Cropper {
    /**
     * Create an Cropper.
     *
     * @param {Object} config - The config for Image Crop
     */
    constructor(config = {}) {
        validateConfig(config);

        this._canvas = new Canvas();
        this._image = new Image();
        this._slider = new Slider();

        this.setWidth(config.width || defaultDimensions.width);
        this.setHeight(config.height || defaultDimensions.height);

        this._onInitCallback = validateCallback(config.onInit);
        this._onChangeCallback = validateCallback(config.onChange);
    }

    /**
     * Create Image Crop container at the end of the list of children of a specified parent node
     *
     * @param {Object} node - The DOM Element object, parent node
     * @return {Cropper} An Cropper object.
     */
    render(node) {
        this._node = validateNode(node);

        const wrapper = new Element();
        wrapper.addClass("cropper");
        wrapper.render(this._node);
        this._canvas.render(wrapper.getNode());

        const tools = new Element();
        tools.addClass("cropper-tools");
        tools.render(wrapper.getNode());

        const zoomSlider = new Element();
        zoomSlider.addClass("cropper-zoom");
        zoomSlider.render(tools.getNode());

        const leftIcon = new Icon("frame-landscape");
        const rightIcon = new Icon("frame-landscape");

        leftIcon.render(zoomSlider.getNode());

        this._slider.render(zoomSlider.getNode());
        this._slider.onChange((value) => {
            this._canvas.setZoom(value / 100);
        });

        rightIcon.render(zoomSlider.getNode());

        this._onInitCallback(this);

        this._canvas.onChange(() => {
            this._onChangeCallback(this);
        });

        return this;
    }

    /**
     * Change width of Cropper container
     *
     * @param {Number} width - The number of pixels.
     * @return {Cropper} An Cropper object.
     */
    setWidth(width) {
        try {
            validateDimension(width);
        } catch (error) {
            throw Error(`Width property: ${error.message}`);
        }
        this._canvas.setWidth(width);
        this._canvas.redraw();
        return this;
    }

    /**
     * Change height of Cropper container
     *
     * @param {Number} height - The number of pixels.
     * @return {Cropper} An Cropper object.
     */
    setHeight(height) {
        try {
            validateDimension(height);
        } catch (error) {
            throw Error(`Height property: ${error.message}`);
        }
        this._canvas.setHeight(height);
        this._canvas.redraw();
        return this;
    }

    /**
     * Load an image and draw canvas
     *
     * @param {String} url - Url or path to image
     * @return {Promise} A promise that returns {@link loadImage~resolve} if resolved and {@link loadImage~reject} if rejected.
     */
    loadImage(url) {
        if (!url) {
            throw Error("Image url or path is not passed.");
        }

        if (typeof url !== "string") {
            throw Error("Invalid url or path.");
        }

        return this._image.load(url).then((image) => {
            this._canvas.setImage(image);
            this._canvas.draw();
            this._slider.setValue(0);
            return this;
        });
    }

    /**
     * Load an image and draw canvas
     *
     * @param {String} url - Url or path to image
     * @return {Promise} A promise that returns {@link loadImage~resolve} if resolved and {@link loadImage~reject} if rejected.
     */
    loadImageData(file) {
        if (!file) {
            throw Error("Image data is not passed.");
        }
        return this._image.loadData(file).then(image => {
            this._canvas.setImage(image);
            this._canvas.draw();
            this._slider.setValue(0);
            return this;
        });
    }

    /**
     * Generates and returns a data URI containing a representation of the image in the format specified by the type parameter (defaults to PNG).
     * The returned image is in a resolution of 96 dpi.
     *
     * @return {String} - A data URI.
     */
    getCroppedImage() {
        return this._canvas.toDataURL();
    }

    /**
     * Sets zoom.
     *
     * @param {Number} zoom - Zoom value, from `0` = 0%, `1.0` = 100% of image size
     * @return {Cropper} An Cropper object.
     */
    setZoom(zoom) {
        try {
            validateDimension(zoom);
        } catch (error) {
            throw Error(`Zoom property: ${error.message}`);
        }
        this._canvas.setZoom(zoom);
        this._slider.setValue(zoom * 100);
        return this;
    }

    reset() {
        this.setZoom(0);
        this._canvas.redraw();
        return this;
    }

    /**
     * Get Frame origin and size relative to an Image.
     *
     * @returns {{origin: {x: Number, y: Number}, size: {width: Number, height: Number}}}
     */
    getData() {
        return this._canvas.getData();
    }

    /**
     * Set a Frame origin and size relative to an Image.
     *
     * @param {Object} data - A frame origin (top, left) point and frame size.
     * @returns {Cropper} - An Cropper instance.
     */
    setData(data) {
        const { zoom } = this._canvas.setData(data);
        this._slider.setValue(zoom * 100);
        return this;
    }

    destroy() {
        this._canvas.destroy();
    }
}
