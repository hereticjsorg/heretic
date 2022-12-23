export default class {
    constructor(t = id => id, data = {}) {
        this.data = data;
        this.t = t;
    }

    setData(data) {
        this.data = data;
    }

    setTranslations(t = id => id) {
        this.t = t;
    }

    getEvents() {
        return [{
            id: "loginSuccess",
            title: this.t("loginSuccess"),
            level: "info",
        }, {
            id: "loginFail",
            title: this.t("loginFail"),
            level: "warning",
        }];
    }
}
