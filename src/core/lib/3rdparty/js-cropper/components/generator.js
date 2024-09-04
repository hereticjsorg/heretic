import Element from "./element.js";
import Context from "../objects/context.js";

/**
 * Class representing a Generator
 */
export default class Generator extends Element {
    /**
     * Create a generator.
     */
    constructor(frame, canvas) {
        super("canvas");
        this._frame = frame;
        this._canvas = canvas;
        this._context = new Context(this._node.getContext("2d"));
    }

    /**
     * Generates and returns a data URI containing a representation of the image in the format specified by the type parameter (defaults to PNG).
     * The returned image is in a resolution of 96 dpi.
     *
     * @return {String} - A data URI.
     */
    toDataURL() {
        this.setWidth(this._frame.getRect().size.width);
        this.setHeight(this._frame.getRect().size.height);
        this._context.drawImage(
            this._canvas.getNode(),
            this._frame.getMinX(),
            this._frame.getMinY(),
            this._frame.getRect().size.width,
            this._frame.getRect().size.height,
            0,

            0,
            this._frame.getRect().size.width,
            this._frame.getRect().size.height,
        );
        return this.getNode().toDataURL();
    }
}
