import Element from "./element";
import { styles } from "../config/default";
import Context from "../objects/context";

/**
 * Class representing a Pattern element
 */
export default class Pattern extends Element {
    /**
     * Create a pattern, set size
     */
    constructor() {
        super("canvas");
        this._context = new Context(this._node.getContext("2d"));

        this.setWidth(styles.pattern.size);
        this.setHeight(styles.pattern.size);

        this._draw();
    }

    /**
     * Draw pattern on canvas
     *
     * @return {Pattern} A Pattern object.
     */
    _draw() {
        this._context.fillStyle(styles.pattern.fill1);
        this._context.fillRect(0, 0, 8, 8);
        this._context.fillStyle(styles.pattern.fill2);
        this._context.fillRect(8, 0, 8, 8);
        this._context.fillRect(0, 8, 8, 8);
        this._context.fillStyle(styles.pattern.fill1);
        this._context.fillRect(8, 8, 8, 8);
        return this;
    }
}
