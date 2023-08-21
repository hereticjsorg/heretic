import Utils from "#lib/componentUtils";

export default class {
    async onCreate(input) {
        this.state = {
            active: false,
        };
        if (input.admin) {
            await import(/* webpackChunkName: "havatar-admin" */ "./style-admin.scss");
        } else {
            await import(/* webpackChunkName: "havatar-frontend" */ "./style-frontend.scss");
        }
    }

    onMount() {
        this.utils = new Utils(this);
    }

    async show() {
        this.setState("active", true);
        await this.utils.waitForComponent("avatarEditor");
        this.getComponent("avatarEditor").setActive(true);
    }
}
