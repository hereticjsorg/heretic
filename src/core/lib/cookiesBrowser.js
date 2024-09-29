import cloneDeep from "lodash/cloneDeep";

export default class {
    constructor(optionsConfig = {}, siteId = "") {
        const defaults = {
            path: "/",
            domain: "",
            expires: new Date(new Date().getTime() + 604800000),
            secure: undefined,
            sameSite: undefined,
            userCheck: false,
        };
        const options = cloneDeep(optionsConfig);
        this.options = {
            ...defaults,
        };
        if (options && typeof options === "object") {
            options.expires =
                options.expires !== undefined && options.expires !== null
                    ? new Date(new Date().getTime() + options.expires * 1000)
                    : defaults.expires;
            Object.keys(options).map((o) => (this.options[o] = options[o]));
            options.expires = options.expires.toUTCString();
        }
        this.siteId = siteId;
    }

    isAllowed() {
        return this.options.userCheck
            ? String(this.get(`${this.siteId}.cookiesAllowed`)) === "true"
            : true;
    }

    set(name, value, optionsData, force = false) {
        if (!name || (!this.isAllowed() && !force)) {
            return;
        }
        const options = cloneDeep(this.options);
        if (optionsData && typeof optionsData === "object") {
            if (
                optionsData.expires !== undefined &&
                optionsData.expires !== null
            ) {
                optionsData.expires =
                    typeof optionsData.expires === "string"
                        ? new Date(optionsData.expires)
                        : new Date(
                              new Date().getTime() + optionsData.expires * 1000,
                          );
            } else {
                optionsData.expires = this.options.expires;
            }
            Object.keys(optionsData).map((o) => (options[o] = optionsData[o]));
        }
        if (
            options.expires &&
            typeof options.expires.toUTCString === "function"
        ) {
            options.expires = options.expires.toUTCString();
        }
        if (value instanceof Object) {
            value = JSON.stringify(value);
        }
        let updatedCookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        Object.keys(options).map((key) => {
            if (options[key] !== undefined && options[key] !== null) {
                updatedCookie += `;${key}`;
                const optionValue = options[key];
                if (optionValue !== true) {
                    updatedCookie += `=${optionValue}`;
                }
            }
        });
        document.cookie = updatedCookie;
    }

    get(name, json = false) {
        if (!name || !process.browser) {
            return null;
        }
        const matches = document.cookie.match(
            new RegExp(
                `(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`,
            ),
        );
        if (matches) {
            const res = decodeURIComponent(matches[1]);
            if (json) {
                try {
                    return JSON.parse(res);
                } catch (e) {
                    // Ignore
                }
            }
            return res;
        }
        return null;
    }

    delete(name) {
        this.set(name, null, {
            expires: "Thu, 01 Jan 1970 00:00:01 GMT",
            path: "/",
        });
    }
}
