export default class {
    buildStore() {
        const regex = /([^&=]+)=?([^&]*)/g;
        const input = window.location.search || window.location.hash || "";
        const query = input.substring(input.indexOf("?") + 1, input.length);
        this.store = {};
        let match;
        while ((match = regex.exec(query))) {
            this.store[decodeURIComponent(match[1])] = decodeURIComponent(
                match[2],
            );
        }
    }

    constructor() {
        this.buildStore();
    }

    get(id) {
        return this.store[id];
    }

    set(id, value) {
        this.store[id] = value;
        this.replace(this.store);
    }

    replace(obj = {}) {
        const params = new URLSearchParams(window.location.search);
        Object.keys(obj).map((i) => {
            if (obj[i] !== undefined) {
                params.set(i, obj[i]);
            } else {
                params.delete(i);
            }
        });
        window.history.replaceState(
            {},
            "",
            `${window.location.pathname}?${params.toString()}`,
        );
    }

    getStore() {
        return this.store;
    }
}
