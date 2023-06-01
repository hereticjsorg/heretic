const languages = Object.keys(require("#etc/languages.json"));

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
