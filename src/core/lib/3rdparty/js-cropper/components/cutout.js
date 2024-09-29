import { styles } from "../config/default.js";
import Context from "../objects/context.js";

/**
 * Class representing a cutout over canvas
 */
export default class Cutout {
    /**
     * Create a canvas element.
     *
     * @param {Frame} frame - A Frame object
     * @param {Object} canvas - A Canvas element
     */
    constructor(frame, canvas) {
        this._frame = frame;
        this._canvas = canvas;
        this._context = new Context(this._canvas.getNode().getContext("2d"));
    }

    /**
     * Draw the cutout over canvas, clockwise rectangle and anti-clock wise rectangle
     *
     * @return {Cutout} A Cutout object.
     */
    draw() {
        this._context.fillStyle(styles.cutout.fill);
        this._context.beginPath();
        this._context.rect(
            0,
            0,
            this._canvas.getNode().width,
            this._canvas.getNode().height,
        );
        this._context.moveTo(this._frame.getMinX(), this._frame.getMinY());
        this._context.lineTo(this._frame.getMinX(), this._frame.getMaxY());
        this._context.lineTo(this._frame.getMaxX(), this._frame.getMaxY());
        this._context.lineTo(this._frame.getMaxX(), this._frame.getMinY());
        this._context.closePath();
        this._context.fill();
        return this;
    }
}
