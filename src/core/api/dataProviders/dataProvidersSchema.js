const languages = Object.keys(require("../../../config/languages.json"));

module.exports = {
    type: "object",
    properties: {
        language: {
            type: "string",
            enum: languages,
        }
    },
    required: ["language"]
};
