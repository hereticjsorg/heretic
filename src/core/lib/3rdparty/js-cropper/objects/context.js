/**
 * Class representing a drawing context on the canvas
 */
export default class Context {
    /**
     * Create a context
     */
    constructor(context) {
        this._context = context;
    }

    /**
     * Draws a filled rectangle at (x, y) position whose size is determined by width and height and whose style
     * is determined by the fillStyle attribute.
     *
     * @param {Number} x - The x axis of the coordinate for the rectangle starting point.
     * @param {Number} y - The y axis of the coordinate for the rectangle starting point.
     * @param {Number} width - The rectangle's width.
     * @param {Number} height - The rectangle's height.
     */
    fillRect(x, y, width, height) {
        return this._context.fillRect(x, y, width, height);
    }

    /**
     * Sets a property of the Canvas 2D API, which specifies the color or style to use inside shapes.
     *
     * @param {String|Object} style - A CSS <color> value, Canvas gradient or Canvas pattern
     */
    fillStyle(style) {
        return this._context.fillStyle = style;
    }

    /**
     * Creates a pattern using the specified image (a CanvasImageSource).
     * It repeats the source in the directions specified by the repetition argument.
     *
     * @param {CanvasImageSource} image - A CanvasImageSource to be used as image to repeat.
     * @param {String} repetition - A DOMString indicating how to repeat the image.
     */
    createPattern(image, repetition) {
        return this._context.createPattern(image, repetition);
    }

    /**
     * Creates a path for a rectangle at position (x, y) with a size that is determined by width and height.
     * Those four points are connected by straight lines and the sub-path is marked as closed,
     * so that you can fill or stroke this rectangle.
     *
     * @param {Number} x - The x axis of the coordinate for the rectangle starting point.
     * @param {Number} y - The y axis of the coordinate for the rectangle starting point.
     * @param {Number} width - The rectangle's width.
     * @param {Number} height - The rectangle's height.
     */
    rect(x, y, width, height) {
        return this._context.rect(x, y, width, height);
    }

    /**
     * Fills the current or given path with the current fill style using the non-zero or even-odd winding rule.
     */
    fill() {
        return this._context.fill();
    }

    /**
     * Starts a new path by emptying the list of sub-paths. Call this method when you want to create a new path.
     */
    beginPath() {
        return this._context.beginPath();
    }

    /**
     * Moves the starting point of a new sub-path to the (x, y) coordinates.
     *
     * @param {Number} x -The x axis of the point.
     * @param {Number} y -The y axis of the point.
     */
    moveTo(x, y) {
        return this._context.moveTo(x, y);
    }

    /**
     * Connects the last point in the sub-path to the x, y coordinates with a straight line
     * (but does not actually draw it).
     *
     * @param {Number} x - The x axis of the coordinate for the end of the line.
     * @param {Number} y - The y axis of the coordinate for the end of the line.
     */
    lineTo(x, y) {
        return this._context.lineTo(x, y);
    }

    /**
     * Causes the point of the pen to move back to the start of the current sub-path.
     * It tries to add a straight line (but does not actually draw it) from the current point to the start.
     * If the shape has already been closed or has only one point, this function does nothing.
     */
    closePath() {
        return this._context.closePath();
    }

    /**
     * Sets all pixels in the rectangle defined by starting point (x, y) and size (width, height) to transparent black,
     * erasing any previously drawn content.
     *
     * @param {Number} x - The x axis of the coordinate for the rectangle starting point.
     * @param {Number} y - The y axis of the coordinate for the rectangle starting point.
     * @param {Number} width - The rectangle's width.
     * @param {Number} height - The rectangle's height.
     */
    clearRect(x, y, width, height) {
        return this._context.clearRect(x, y, width, height);
    }

    /**
     * Provides different ways to draw an image onto the canvas.
     *
     * @param {Number} image - An element to draw into the context.
     * @param {Number} sx - The X coordinate of the top left corner of the sub-rectangle of the source image to draw
     * into the destination context.
     * @param {Number} sy - The Y coordinate of the top left corner of the sub-rectangle of the source image to draw
     * into the destination context.
     * @param {Number} sWidth - The width of the sub-rectangle of the source image to draw into the destination context.
     * @param {Number} sHeight - The height of the sub-rectangle of the source image to draw into the destination context.
     * @param {Number} dx - The X coordinate in the destination canvas at which to place the top-left corner
     * of the source image.
     * @param {Number} dy - The Y coordinate in the destination canvas at which to place the top-left corner
     * of the source image.
     * @param {Number} dWidth - The width to draw the image in the destination canvas.
     * @param {Number} dHeight - The height to draw the image in the destination canvas.
     */
    drawImage(...args) {
        // eslint-disable-next-line prefer-spread
        return this._context.drawImage.apply(this._context, args);
    }
}
