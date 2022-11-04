/* eslint-disable object-shorthand */
/* eslint-disable func-names */
export default {
    list: function () {
        return ["success", "error"];
    },
    success: function (data = {}) {
        return this.code(200).send(data);
    },
    error: function (data = {}, code = 400) {
        return this.code(code).send(data);
    },
};
