import Element from "./element";

/**
 * Class representing an Icon element
 */
export default class Icon extends Element {
    /**
     * Create an Icon element.
     *
     * @param {String} name - An Icon name.
     */
    constructor(name) {
        super("svg");
        this.setAttribute("class", `icon icon-${name}`);
        this._use = new Element("use");
        this._use.getNode().setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#icon-${name}`);
        this._use.render(this.getNode());
    }
}
