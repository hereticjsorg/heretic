class Splitter {
    constructor({ data, api }) {
        this.api = api;
        this.data = data;
    }

    static get toolbox() {
        return {
            title: "Splitter",
            icon: `<svg viewBox="0 0 24 24"><title>checkbox-blank-outline</title><path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z" /></svg>`,
        };
    }

    render() {
        const wrap = document.createElement("div");
        const input = document.createElement("input");
        input.type = "number";
        input.step = 1;
        input.classList.add("hr-hc-splitter-input");
        input.placeholder = this.api.i18n.t("Height");
        input.value =
            this.data && this.data.height ? String(this.data.height) : "0";
        const tagLabel = document.createElement("span");
        tagLabel.classList.add("tag");
        tagLabel.innerHTML = this.api.i18n.t("Splitter");
        wrap.appendChild(tagLabel);
        wrap.appendChild(input);
        wrap.appendChild(document.createTextNode(this.api.i18n.t("px")));
        return wrap;
    }

    save(blockContent) {
        const input = blockContent.querySelector("input");
        return {
            height: parseInt(input.value || "0", 10),
        };
    }
}

export default Splitter;
