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
        }, {
            id: "comment",
            title: this.t("permissionComment"),
            type: "text",
        }, {
            id: "users",
            title: this.t("usersList"),
            type: "database",
            collection: "users",
            field: "username"
        }, {
            id: "test",
            title: this.t("testList"),
            type: "list",
            items: [{
                id: "item1",
                label: "Item one",
            }, {
                id: "item2",
                label: "Item two",
            }, {
                id: "item3",
                label: "Item three",
            }]
        }];
    }
}
