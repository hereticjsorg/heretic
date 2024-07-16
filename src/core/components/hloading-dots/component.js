import {
    v4 as uuid,
} from "uuid";

export default class {
    async onCreate(input) {
        this.state = {
            cid: uuid(),
        };
        if (input.admin) {
            await import( /* webpackChunkName: "hloading-dots-admin" */ "./style-admin.scss");
        } else {
            await import( /* webpackChunkName: "hloading-dots-frontend" */ "./style-frontend.scss");
        }
    }

    onMount() {
        setTimeout(() => document.getElementById(this.state.cid).style.opacity = "1", 300);
    }
}
