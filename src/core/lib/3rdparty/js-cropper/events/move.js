import Element from "../components/element";
import Point from "../objects/point";

/**
 * Class representing a MoveEventListener
 */
export default class MoveEventListener {
    /**
     * Create a MoveEventListener.
     *
     * @param {Element} element - A main container.
     * @param {Element} parent - A parent element (window)
     */
    constructor(element, parent = new Element(document.body)) {
        this._element = element;
        this._parent = parent;

        this._onMoveCallback = () => {};
        this._onPressCallback = () => {};
        this._onReleaseCallback = () => {};

        this._onReleaseHandler = this.onReleaseHandler.bind(this);
        this._onPressHandler = this.onPressHandler.bind(this);
        this._onMoveHandler = this.onMoveHandler.bind(this);
    }

    /**
     * Callback function which fires after (touch/mouse) moving (dragging)
     *
     * @param {Function} callback - Callback.
     */
    onMove(callback) {
        this._onMoveCallback = callback;
    }

    /**
     * Callback function which fires after touch press / mouse click
     *
     * @param {Function} callback - Callback.
     */
    onPress(callback) {
        this._onPressCallback = callback;
    }

    /**
     * Callback function which fires after mouse/finger releasing
     *
     * @param {Function} callback - Callback.
     */
    onRelease(callback) {
        this._onReleaseCallback = callback;
    }

    /**
     * Initialize event listeners
     */
    init() {
        this._element
            .getNode()
            .addEventListener("mousedown", this._onPressHandler, false);
        this._element
            .getNode()
            .addEventListener("touchstart", this._onPressHandler, false);
        this._parent
            .getNode()
            .addEventListener("mouseup", this._onReleaseHandler, false);
        this._parent
            .getNode()
            .addEventListener("touchend", this._onReleaseHandler, false);
    }

    /**
     * Handler for (touch/mouse) move action.
     *
     * @param {Object} event - Event object.
     */
    onMoveHandler(event) {
        this._onMoveCallback(this._getEventPoint(event));
    }

    /**
     * Handler for (touch/mouse) press action.
     *
     * @param {Object} event - Event object.
     */
    onPressHandler(event) {
        this._parent
            .getNode()
            .addEventListener("mousemove", this._onMoveHandler, false);
        this._parent
            .getNode()
            .addEventListener("touchmove", this._onMoveHandler, false);
        this._onPressCallback(this._getEventPoint(event));
    }

    /**
     * Handler for (touch/mouse) release action.
     */
    onReleaseHandler(event) {
        this._parent
            .getNode()
            .removeEventListener("mousemove", this._onMoveHandler, false);
        this._parent
            .getNode()
            .removeEventListener("touchmove", this._onMoveHandler, false);
        this._onReleaseCallback(this._getEventPoint(event));
    }

    /**
     * Translate viewport coordinates to coordinates relative to the element.
     *
     * @param {Point} point - Viewport coordinates
     * @return {Object} - Coordinates relative to the element.
     */
    _convertCoordinates(point) {
        const box = this._element.getNode().getBoundingClientRect();
        const x =
            point.x - box.left * (this._element.getNode().width / box.width);
        const y =
            point.y - box.top * (this._element.getNode().height / box.height);
        return new Point(x, y);
    }

    _getEventPoint(event) {
        if (event && (event.clientX || (event.touches && event.touches[0]))) {
            const x = event.clientX || event.touches[0].clientX;
            const y = event.clientY || event.touches[0].clientY;
            return this._convertCoordinates(new Point(x, y));
        }
    }

    destroy() {
        this._parent
            .getNode()
            .removeEventListener("mousemove", this._onMoveHandler, false);
        this._parent
            .getNode()
            .removeEventListener("touchmove", this._onMoveHandler, false);
        this._element
            .getNode()
            .removeEventListener("mousedown", this._onPressHandler, false);
        this._element
            .getNode()
            .removeEventListener("touchstart", this._onPressHandler, false);
        this._parent
            .getNode()
            .removeEventListener("mouseup", this._onReleaseHandler, false);
        this._parent
            .getNode()
            .removeEventListener("touchend", this._onReleaseHandler, false);
    }
}
