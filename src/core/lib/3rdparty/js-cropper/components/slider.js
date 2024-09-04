import Element from "./element.js";

/**
 * Class representing a Slider
 */
export default class Slider extends Element {
    /**
     * Create a slider.
     */
    constructor() {
        super("input");
        this.setType("range");
        this.addClass("slider");
        this.setAttribute("min", 0);
        this.setAttribute("max", 100);
        this.setAttribute("value", 0);

        this._onChangeCallback = () => {};
        this._onChangeHandler = this._onChange.bind(this);
    }

    /**
     * Callback function, which be fired after changing the value
     *
     * @param {Function} callback - Callback.
     * @returns {Slider} - A Slider object.
     */
    onChange(callback) {
        this._onChangeCallback = callback;
        this.getNode().addEventListener("change", this._onChangeHandler, false);
        this.getNode().addEventListener("input", this._onChangeHandler, false);
        return this;
    }

    /**
     * Sets a value
     *
     * @param {Number} value - A value from 0 to 100
     * @returns {Slider} - A Slider object.
     */
    setValue(value) {
        this.getNode().value = value;
        return this;
    }

    /**
     * Fires custom callback.
     */
    _onChange() {
        this._onChangeCallback(Number(this.getNode().value));
    }
}
