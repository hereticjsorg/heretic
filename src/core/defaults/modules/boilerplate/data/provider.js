export default class {
    constructor(t = (id) => id, data = {}) {
        this.data = data;
        this.t = t;
    }

    setData(data) {
        this.data = data;
    }

    setTranslations(t = (id) => id) {
        this.t = t;
    }

    getGroupsData() {
        return [
            {
                id: "personalInfoAreaPermission",
                title: this.t("personalInfoAreaPermission"),
                type: "boolean",
                unique: true,
            },
        ];
    }
}
