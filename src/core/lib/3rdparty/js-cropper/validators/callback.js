/**
 * Validates provided callback
 *
 * @param {Function} callback - Callback function.
 */
export default function validateCallback(callback) {
    if (typeof callback === "undefined") {
        return () => {};
    }
    if (!callback || typeof callback !== "function") {
        throw Error("Invalid callback.");
    }
    return callback;
}
