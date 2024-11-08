import axios from "axios";
import cloneDeep from "lodash/cloneDeep";
import Utils from "#lib/componentUtils.js";
import moduleConfig from "../../module.js";
import Cookies from "#lib/cookiesBrowser.js";
import pageConfig from "../page.js";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
        };
        this.language = out.global.language;
        this.siteTitle = out.global.siteTitle;
        this.siteId = out.global.siteId;
        this.cookieOptions = out.global.cookieOptions;
        this.systemRoutes = out.global.systemRoutes;
        this.authOptions = out.global.authOptions;
        this.mongoEnabled = out.global.mongoEnabled;
        this.navigation = out.global.navigation;
        this.i18nNavigation = out.global.i18nNavigation;
        if (process.browser) {
            window.__heretic = window.__heretic || {};
            window.__heretic.outGlobal =
                window.__heretic.outGlobal || out.global || {};
            this.authOptions =
                this.authOptions || window.__heretic.outGlobal.authOptions;
            this.mongoEnabled =
                this.mongoEnabled || window.__heretic.outGlobal.mongoEnabled;
            this.language =
                this.language || window.__heretic.outGlobal.language;
            this.siteTitle =
                out.global.siteTitle || window.__heretic.outGlobal.siteTitle;
            this.siteId =
                out.global.siteId || window.__heretic.outGlobal.siteId;
            this.cookieOptions =
                out.global.cookieOptions ||
                window.__heretic.outGlobal.cookieOptions;
            this.systemRoutes =
                out.global.systemRoutes ||
                window.__heretic.outGlobal.systemRoutes;
            document.title = `${pageConfig.title[this.language]} – ${this.siteTitle}`;
            this.navigation =
                out.global.navigation ||
                window.__heretic.outGlobal.navigation;
            this.i18nNavigation = out.global.i18nNavigation ||
                window.__heretic.outGlobal.i18nNavigation;
        }
        this.utils = new Utils(this, this.language);
    }

    async onMount() {
        await this.utils.waitForLanguageData();
        await this.utils.loadLanguageData(moduleConfig.id);
        this.cookies = new Cookies(this.cookieOptions, this.siteId);
        this.currentToken = this.cookies.get(`${this.siteId}.authToken`);
        if (!this.currentToken) {
            setTimeout(
                () =>
                (window.location.href = this.utils.getLocalizedURL(
                    this.systemRoutes.signInAdmin,
                )),
                100,
            );
            return;
        }
        this.setState("ready", true);
        await this.utils.waitForComponent("navMetaForm");
        this.getComponent("navMetaForm").setValue("homeId", this.navigation.home || "");
    }

    async showNotification(message, css = "is-success") {
        await this.utils.waitForComponent("notify");
        this.getComponent("notify").show(window.__heretic.t(message), css);
    }

    cleanNode(node) {
        const copyNode = cloneDeep(node);
        if (typeof copyNode === "object") {
            delete copyNode.uid;
            if (copyNode.label) {
                const labels = Object.values(copyNode.label);
                const allLabelsEmpty = labels.every(label => label === "");
                if (allLabelsEmpty) {
                    delete copyNode.label;
                }
            }
            if (copyNode.id && !copyNode.label && !copyNode.routes && Object.keys(copyNode).length === 1) {
                return copyNode.id;
            }
            if (copyNode.routes) {
                copyNode.routes = copyNode.routes.map(route => this.cleanNode(route));
            }
        }
        return copyNode;
    }

    cleanTree(tree) {
        return tree.map(node => this.cleanNode(node));
    }

    async onNavSaveClick(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        if (this.loading) {
            return;
        }
        await this.utils.waitForComponent("navTree");
        const navigationRoutes = this.getComponent("navTree").getNavigationRoutes();
        const tree = this.cleanTree(navigationRoutes);
        const navigationRoutesSecondary = this.getComponent("secondaryTree").getNavigationRoutes();
        const treeSecondary = this.cleanTree(navigationRoutesSecondary);
        await this.utils.waitForComponent("navMetaForm");
        const homeId = this.getComponent("navMetaForm").getValue("homeId");
        await this.utils.waitForComponent("loading");
        const loading = this.getComponent("loading");
        try {
            loading.setActive(true);
            this.loading = true;
            const data = new FormData();
            data.append("tree", JSON.stringify(tree));
            data.append("treeSecondary", JSON.stringify(treeSecondary));
            data.append("homeId", JSON.stringify(homeId));
            await axios({
                method: "post",
                url: `/api/${moduleConfig.id}/save`,
                data,
                headers: {
                    Authorization: `Bearer ${this.currentToken}`,
                },
            });
            await this.showNotification("saveSuccessPleaseRestart");
        } catch (err) {
            await this.showNotification("saveFail", "is-danger");
        } finally {
            loading.setActive(false);
            this.loading = false;
        }
    }

    onNavMetaFormSubmit() {
        this.onNavSaveClick();
    }
}
