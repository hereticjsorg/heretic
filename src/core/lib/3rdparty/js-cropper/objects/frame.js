import Point from "./point.js";
import Size from "./size.js";

const frameProportion = 0.85;

/**
 * Class representing a Frame element
 */
export default class Frame {
    /**
     * Create a frame
     */
    constructor() {
        this._size = 0;
        this._origin = {
            x: 0,
            y: 0,
        };
    }

    /**
     * Update size and coordinates of rectangle (frame)
     *
     * @param {Object} parent - A parent node.
     * @return {Pattern} A Pattern object.
     */
    update(parent) {
        this._size =
            parent.width > parent.height
                ? parent.height * frameProportion
                : parent.width * frameProportion;
        this._origin = {
            x: (parent.width - this._size) / 2,
            y: (parent.height - this._size) / 2,
        };
        return this;
    }

    /**
     * Get rectangle properties.
     *
     * @return {Object} - Object.point is an origin Point,
     * which in the upper-left corner and the rectangle extends towards the lower-right corner.
     * Object.size is a size that specifies the height and width of the rectangle.
     */
    getRect() {
        return {
            origin: new Point(this._origin.x, this._origin.y),
            size: new Size(this._size, this._size),
        };
    }

    /**
     * Get the smallest value of the x-coordinate for the rectangle.
     *
     * @return {Number} - The smallest value of the x-coordinate for the rectangle.
     */
    getMinX() {
        return this._origin.x;
    }

    /**
     * Get the largest value of the x-coordinate for the rectangle.
     *
     * @return {Number} - The largest value of the x-coordinate for the rectangle.
     */
    getMaxX() {
        return this._origin.x + this._size;
    }

    /**
     * Get the x- coordinate that establishes the center of a rectangle.
     *
     * @returns {Number} - The x-coordinate that establishes the center of a rectangle.
     */
    getMidX() {
        return this._origin.x + this._size / 2;
    }

    /**
     * Get the smallest value of the x-coordinate for the rectangle.
     *
     * @return {Number} - The smallest value of the x-coordinate for the rectangle.
     */
    getMinY() {
        return this._origin.y;
    }

    /**
     * Get the largest value of the x-coordinate for the rectangle.
     *
     * @return {Number} - The largest value of the x-coordinate for the rectangle.
     */
    getMaxY() {
        return this._origin.y + this._size;
    }

    /**
     * Get the y-coordinate that establishes the center of the rectangle.
     *
     * @returns {Number} - The y-coordinate that establishes the center of a rectangle.
     */
    getMidY() {
        return this._origin.y + this._size / 2;
    }
}
