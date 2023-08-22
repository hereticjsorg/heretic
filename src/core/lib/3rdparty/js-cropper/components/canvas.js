import Element from "./element";
import Image from "./image";
import Pattern from "./pattern";
import Frame from "../objects/frame";
import Point from "../objects/point";
import Cutout from "./cutout";
import Generator from "./generator";
import MoveEventListener from "../events/move";
import Context from "../objects/context";

/**
 * Class representing a canvas element
 */
export default class Canvas extends Element {
    /**
     * Create a canvas element.
     */
    constructor() {
        super("canvas");
        this._context = new Context(this._node.getContext("2d"));
        this._image = new Image();
        this._pattern = new Pattern();
        this._frame = new Frame();
        this._cutout = new Cutout(this._frame, this);
        this._generator = new Generator(this._frame, this);
        this._moveEventListener = new MoveEventListener(this);

        this._lastPoint = new Point(0, 0);
        this._basePoint = new Point(0, 0);

        this._onChangeCallback = () => {};
    }

    /**
     * Render a canvas
     *
     * @param {Object} parent - The DOM Element object, parent node
     * @return {Canvas} An Canvas object.
     */
    render(parent) {
        super.render(parent);
        this._drawBackground();
        this._moveEventListener.init();
        this._moveEventListener.onPress((point) => {
            this._lastPoint = point;
        });
        this._moveEventListener.onMove((point) => {
            this._drawImage(point);
        });
        return this;
    }

    /**
     * Change width of Canvas, recalculate frame dimensions
     *
     * @param {Number} width - The number of pixels.
     * @return {Canvas} A Canvas object.
     */
    setWidth(width) {
        super.setWidth(width);
        this._frame.update(this.getNode());
        return this;
    }

    /**
     * Change height of Canvas
     *
     * @param {Number} height - The number of pixels.
     * @return {Canvas} A Canvas object.
     */
    setHeight(height) {
        super.setHeight(height);
        this._frame.update(this.getNode());
        return this;
    }

    /**
     * Pass the Image object into Canvas, reset saved points,
     * calculate scale value (image should fit in the frame)
     *
     * @param {Image} image - An Image object
     * @return {Canvas} A Canvas object.
     */
    setImage(image) {
        this._resetPoints();
        this._image = image;
        this._image.scaleToFit(this._frame);
        return this;
    }

    /**
     * Draw an Image at initial position
     *
     * @return {Canvas} A Canvas object.
     */
    draw() {
        this._drawImage(this._centerImagePoint());
        return this;
    }

    /**
     * Redraw an Image
     *
     * @return {Canvas} A Canvas object.
     */
    redraw() {
        this._resetPoints();
        this._image.scaleToFit(this._frame);
        this.draw();
        return this;
    }

    /**
     * Clear canvas context
     *
     * @return {Canvas} A Canvas object.
     */
    clear() {
        this._context.clearRect(0, 0, this.getNode().width, this.getNode().height);
        return this;
    }

    /**
     * Generates and returns a data URI containing a representation
     * of the image in the format specified by the type parameter (defaults to PNG).
     * The returned image is in a resolution of 96 dpi.
     *
     * @return {String} - A data URI.
     */
    toDataURL() {
        return this._generator.toDataURL();
    }

    /**
     * Sets zoom.
     *
     * @param {Number} zoom - Zoom value, from `0` = 0%, `1.0` = 100% of image size
     * @return {Canvas} - A Canvas object.
     */
    setZoom(zoom) {
        const lastImageSize = this._image.getSize();
        this._image.setZoom(zoom);
        const imageSize = this._image.getSize();
        const x = this._lastPoint.x - ((imageSize.width - lastImageSize.width) / 2);
        const y = this._lastPoint.y - ((imageSize.height - lastImageSize.height) / 2);
        this._drawImage(new Point(x, y));
        return this;
    }

    /**
     * Callback function which fires after canvas drawing
     *
     * @param {Function} callback - Callback.
     */
    onChange(callback) {
        this._onChangeCallback = callback;
    }

    /**
     *  Get Frame origin and size relative to an Image.
     *
     * @returns {{origin: {x: Number, y: Number}, size: {width: Number, height: Number}}}
     */
    getData() {
        const originX = (this._frame.getMinX() - this._basePoint.x) / this._image.getScale();
        const originY = (this._frame.getMinY() - this._basePoint.y) / this._image.getScale();
        const frameWidth = this._frame.getRect().size.width / this._image.getScale();
        const frameHeight = this._frame.getRect().size.width / this._image.getScale();
        return {
            origin: {
                x: originX,
                y: originY,
            },
            size: {
                width: frameWidth,
                height: frameHeight,
            },
        };
    }

    /**
     * Set a Frame origin and size relative to an Image.
     *
     * @param {Object} data - A frame origin (top, left) point and frame size.
     * @returns {Object} - A frame origin point and zoom value.
     */
    setData(data) {
        const expectedScale = this._frame.getRect().size.width / data.size.width;
        const zoom = (expectedScale - this._image.getOriginScale()) / this._image.getOriginScale();
        this.setZoom(zoom);

        const x = this._frame.getMinX() - (data.origin.x * this._image.getScale());
        const y = this._frame.getMinY() - (data.origin.y * this._image.getScale());
        const point = new Point(x, y);
        this._resetPoints();
        this._drawImage(point);

        return {
            origin: point,
            zoom,
        };
    }

    /**
     * Set points to zero
     *
     * @return {Canvas} A Canvas object.
     */
    _resetPoints() {
        this._lastPoint = new Point(0, 0);
        this._basePoint = new Point(0, 0);
        return this;
    }

    /**
     * Calculate and get origin Point for centered image (x-axis, y-axis)
     *
     * @return {Point} A Point.
     */
    _centerImagePoint() {
       const x = this._frame.getMidX() - (this._image.getSize().width / 2);
       const y = this._frame.getMidY() - (this._image.getSize().height / 2);
       return new Point(x, y);
    }

    /**
     * Calculate and get origin Point for centered image (x-axis, y-axis)
     *
     * @param {Point} point - Point to validate
     * @return {Point} A Point.
     */
    _validatePoint(point) {
        const validPoint = point;

        if (this._image.getSize().width < this._frame.getRect().size.width) {
            validPoint.x = this._centerImagePoint().x;
        } else if (point.x > this._frame.getMinX()) {
            validPoint.x = this._frame.getMinX();
        } else if (point.x + this._image.getSize().width < this._frame.getMaxX()) {
            validPoint.x = this._frame.getMaxX() - this._image.getSize().width;
        } else {
            validPoint.x = point.x;
        }

        if (this._image.getSize().height < this._frame.getRect().size.height) {
            validPoint.y = this._centerImagePoint().y;
        } else if (point.y > this._frame.getMinY()) {
            validPoint.y = this._frame.getMinY();
        } else if (point.y + this._image.getSize().height < this._frame.getMaxY()) {
            validPoint.y = this._frame.getMaxY() - this._image.getSize().height;
        } else {
            validPoint.y = point.y;
        }

        return validPoint;
    }

    /**
     * Draw an Image on canvas, clear canvas context before, draw a background pattern and frame
     *
     * @param {Point} point - An origin point
     * @return {Canvas} A Canvas object.
     */
    _drawImage(point = new Point(0, 0)) {
        this.clear();
        this._drawBackground();

        const baseX = this._basePoint.x + (point.x - this._lastPoint.x);
        const baseY = this._basePoint.y + (point.y - this._lastPoint.y);

        this._basePoint = this._validatePoint(new Point(baseX, baseY));
        this._lastPoint = point;

        this._context.drawImage(
            this._image.getNode(),
            this._basePoint.x,
            this._basePoint.y,
            this._image.getSize().width,
            this._image.getSize().height,
        );
        this._cutout.draw();
        this._onChangeCallback(this);
        return this;
    }

    /**
     * Draw pattern canvas on the Main canvas as background
     *
     * @return {Canvas} A Canvas object.
     */
    _drawBackground() {
        const pattern = this._context.createPattern(this._pattern.getNode(), "repeat");
        this._context.rect(0, 0, this.getNode().width, this.getNode().height);
        this._context.fillStyle(pattern);
        this._context.fill();
        return this;
    }
}
