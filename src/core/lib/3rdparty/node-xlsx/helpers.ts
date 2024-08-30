// eslint-disable-next-line import/prefer-default-export
export const isString = (maybeString: unknown): maybeString is string =>
    typeof maybeString === "string";
