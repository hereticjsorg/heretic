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

    getGroupsData() {
        return [{
            id: "admin",
            title: this.t("permissionAdmin"),
            type: "boolean",
            unique: true,
        }, {
            id: "comment",
            title: this.t("permissionComment"),
            type: "text",
        }];
    }
}
