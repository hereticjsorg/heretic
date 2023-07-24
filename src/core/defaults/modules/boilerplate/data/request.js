export default {
    type: "object",
    properties: {
        update: {
            type: "array",
            items: {
                type: "string",
                minLength: 1,
                pattern: "[A-Za-z0-9_-]+",
            },
            minItems: 0,
            uniqueItems: true,
        },
        items: {
            type: "array",
            items: {
                type: "object",
            },
            minItems: 1,
            uniqueItems: true,
        },
    },
    required: ["update", "items"],
    additionalProperties: false,
};
