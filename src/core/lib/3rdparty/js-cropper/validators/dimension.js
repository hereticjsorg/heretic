/**
 * Validates provided dimension (width or height)
 *
 * @param {Number} value - config object
 * @return {Number} value - valid dimension
 */
export default function validateDimension(value) {
    if (!value && value !== 0) {
        throw Error("Dimension is not passed or invalid.");
    }

    if (typeof value !== "number") {
        throw Error("Invalid dimension.");
    }

    // eslint-disable-next-line no-restricted-globals
    if (!isFinite(value)) {
        throw Error("Invalid dimension.");
    }

    if (value < 0) {
        throw Error("Invalid dimension.");
    }

    return value;
}
