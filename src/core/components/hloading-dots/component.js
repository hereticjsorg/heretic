import { v4 as uuid } from "uuid";
import Utils from "#lib/componentUtils.js";

export default class {
    async onCreate(input) {
        this.state = {
            cid: uuid(),
        };
        if (input.admin) {
            await import(
                /* webpackChunkName: "hloading-dots-admin" */ "./style-admin.scss"
            );
        } else {
            await import(
                /* webpackChunkName: "hloading-dots-frontend" */ "./style-frontend.scss"
            );
        }
        this.utils = new Utils(this, this.language);
    }

    onMount() {
        setTimeout(async () => {
            try {
                await this.utils.waitForElement(this.state.cid);
                document.getElementById(this.state.cid).style.opacity = "1";
            } catch {
                // Ignore
            }
        }, 300);
    }
}
