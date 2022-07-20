/* eslint-disable object-shorthand */
/* eslint-disable func-names */
export default {
    success: function (data = {}) {
        return this.code(200).send(data);
    },
    error: function (data = {}, code = 400) {
        return this.code(code).send(data);
    }
};
