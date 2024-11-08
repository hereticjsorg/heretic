import { v4 as uuidv4 } from "uuid";
import cloneDeep from "lodash/cloneDeep";
import Utils from "#lib/componentUtils.js";
import languages from "#etc/languages.json";

export default class {
    onCreate(input, out) {
        this.state = {
            ready: !process.browser,
            navItemOpen: null,
            navigationRoutes: null,
            navItemDragging: false,
            overNavGap: null,
            selected: [],
            anyCheckboxesSelected: false,
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
            this.navigation =
                out.global.navigation ||
                window.__heretic.outGlobal.navigation;
            this.i18nNavigation = out.global.i18nNavigation ||
                window.__heretic.outGlobal.i18nNavigation;
        }
        this.id = input.id || "__hnv__";
        this.idRex = new RegExp(`^${this.id}`);
        this.utils = new Utils(this, this.language);
    }

    addUniqueIds(tree) {
        return tree.map(item => {
            if (typeof item === "string") {
                return { id: item, uid: uuidv4() };
            } if (typeof item === "object") {
                if (!Object.prototype.hasOwnProperty.call(item, "id")) {
                    item.id = uuidv4();
                }
                item.uid = uuidv4();
                if (Object.prototype.hasOwnProperty.call(item, "routes") && Array.isArray(item.routes)) {
                    item.routes = this.addUniqueIds(item.routes);
                }
                return item;
            }
        });
    }

    async onMount() {
        const navigationRoutes = this.addUniqueIds(this.input.navigationRoutes);
        this.setState("navigationRoutes", navigationRoutes);
        this.setState("ready", true);
        window.addEventListener("click", (e) => {
            if (
                this.state.navItemOpen &&
                document.getElementById(
                    `hr_navbar_item_${this.state.navItemOpen}`,
                ) &&
                !document
                    .getElementById(`hr_navbar_item_${this.state.navItemOpen}`)
                    .contains(e.target)
            ) {
                this.setState("navItemOpen", "");
            }
        });
    }

    onNavItemDragStart(e) {
        const { uid } = e.target.closest("[data-uid]").dataset;
        this.setState("navItemDragging", true);
        e.dataTransfer.setData("text/plain", `__hnv__${uid}`);
    }

    onNavItemDragEnd() {
        this.setState("navItemDragging", false);
    }

    onNavItemDrag() {
        return true;
    }

    onNavItemGapDragOver(e) {
        e.preventDefault();
    }

    onNavItemGapDragEnter(e) {
        e.preventDefault();
        const { uid } = e.target.closest("[data-uid]").dataset;
        const { dir } = e.target.closest("[data-dir]").dataset;
        this.setState("overNavGap", `${uid}_${dir}`);
    }

    onNavItemGapDragLeave(e) {
        e.preventDefault();
        this.setState("overNavGap", null);
    }

    findNodeAndParent(tree, uid, parent = null) {
        for (let i = 0; i < tree.length; i += 1) {
            const node = tree[i];
            if (typeof node === "object" && node.uid === uid) {
                return { node, parent, index: i };
            } if (typeof node === "object" && node.routes) {
                const result = this.findNodeAndParent(node.routes, uid, node);
                if (result) { return result; }
            }
        }
        return null;
    }

    isDescendant(tree, sourceUid, destUid) {
        const stack = [sourceUid];
        while (stack.length > 0) {
            const currentUid = stack.pop();
            const { node } = this.findNodeAndParent(tree, currentUid) || {};
            if (!node) continue;
            if (node.routes) {
                for (const route of node.routes) {
                    if (typeof route === "object" && route.uid === destUid) {
                        return true;
                    }
                    stack.push(route.uid);
                }
            }
        }
        return false;
    }

    moveNode(tree, sourceUid, destUid, position) {
        const sourceData = this.findNodeAndParent(tree, sourceUid);
        if (!sourceData) { return tree; }
        const { node: sourceNode, parent: sourceParent, index: sourceIndex } = sourceData;
        const destData = this.findNodeAndParent(tree, destUid);
        if (!destData) { return tree; }
        const { node: destNode, parent: destParent, index: destIndex } = destData;
        if (sourceNode === destNode || this.isDescendant(tree, sourceUid, destUid)) {
            return tree;
        }
        if (sourceParent) {
            sourceParent.routes.splice(sourceIndex, 1);
        } else {
            tree.splice(sourceIndex, 1);
        }
        if (destParent) {
            const newIndex = position === "top" ? destIndex : destIndex + 1;
            destParent.routes.splice(newIndex, 0, sourceNode);
        } else {
            const newIndex = position === "top" ? destIndex : destIndex + 1;
            tree.splice(newIndex, 0, sourceNode);
        }
        return tree;
    }

    onNavItemGapDrop(e) {
        if (
            !e.dataTransfer.getData("text/plain") ||
            !e.dataTransfer.getData("text/plain").match(this.idRex)
        ) {
            e.preventDefault();
            return;
        }
        const { uid } = e.target.closest("[data-uid]").dataset;
        const { dir } = e.target.closest("[data-dir]").dataset;
        const [itemId] = e.dataTransfer
            .getData("text/plain")
            .replace(this.idRex, "")
            .split(/_/);
        const navigationRoutes = this.moveNode(this.state.navigationRoutes, itemId, uid, dir);
        this.setState("navigationRoutes", navigationRoutes);
        this.setState("overNavGap", null);
        this.setState("navItemDragging", false);
    }

    async navItemClick(e) {
        e.preventDefault();
        await this.utils.waitForComponent("navItemModal");
        const { uid } = e.target.closest("[data-uid]").dataset;
        const { node } = this.findNodeAndParent(this.state.navigationRoutes, uid);
        const data = {
            id: node.id || "",
            url: node.url || "",
            target: node.target || "",
        };
        this.editNodeRoutes = node.routes || null;
        if (node.label) {
            for (const k of Object.keys(node.label)) {
                data[k] = node.label[k] || "";
            }
        }
        this.getComponent("navItemModal").setActive(true);
        await this.utils.waitForComponent("navItemForm");
        for (const k of Object.keys(data)) {
            this.getComponent("navItemForm").setValue(k, data[k]);
        }
        this.navItemModalId = uid;
    }

    setNodeValue(tree, uid, value) {
        for (let i = 0; i < tree.length; i += 1) {
            if (typeof tree[i] === "object" && tree[i].uid === uid) {
                tree[i] = value;
            } if (typeof tree[i] === "object" && tree[i].routes) {
                this.setNodeValue(tree[i].routes, uid, value);
            }
        }
    }

    findNodeByUid(nodes, uid) {
        for (const node of nodes) {
            if (node.uid === uid) {
                return node;
            }
            if (node.routes) {
                const found = this.findNodeByUid(node.routes, uid);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    addNode(tree, newNode, uid = null) {
        // Helper function to find node by UID
        if (uid === null) {
            // If no UID is provided, add the node to the root level
            tree.push(newNode);
        } else {
            // Find the node by UID
            const parentNode = this.findNodeByUid(tree, uid);
            if (parentNode) {
                // If routes array doesn't exist, create it
                if (!parentNode.routes) {
                    parentNode.routes = [];
                }
                parentNode.routes.push(newNode);
            }
        }
    }

    async onNavItemFormSubmit() {
        this.setCheckboxes([]);
        await this.utils.waitForComponent("navItemForm");
        const navItemForm = this.getComponent("navItemForm");
        navItemForm.setErrors(false);
        navItemForm.setErrorMessage(false);
        const validationResult = navItemForm.validate(navItemForm.saveView());
        if (validationResult) {
            return navItemForm.setErrors(navItemForm.getErrorData(validationResult));
        }
        const formData = navItemForm.serializeData();
        const data = formData.formTabs._default;
        data.label = {};
        data.uid = uuidv4();
        if (this.editNodeRoutes) {
            data.routes = this.editNodeRoutes;
        }
        for (const k of Object.keys(languages)) {
            data.label[k] = data[k];
            delete data[k];
        }
        const navigationRoutes = cloneDeep(this.state.navigationRoutes);
        if (this.navItemModalId) {
            this.setNodeValue(navigationRoutes, this.navItemModalId, formData.formTabs._default);
        } else {
            this.addNode(navigationRoutes, data);
        }
        this.setState("navigationRoutes", navigationRoutes);
        this.getComponent("navItemModal").setActive(false);
    }

    onNavItemModalButtonClick(btn) {
        switch (btn.id) {
            case "cancel":
                this.getComponent("navItemModal").setActive(false);
                break;
            case "save":
                this.onNavItemFormSubmit();
                break;
        }
    }

    async onNavItemAddBtnClick(e) {
        e.preventDefault();
        this.navItemModalId = null;
        await this.utils.waitForComponent("navItemModal");
        this.getComponent("navItemModal").setActive(true);
        await this.utils.waitForComponent("navItemForm");
        this.getComponent("navItemForm").clearValues();
    }

    navItemAddChildLinkClick(e) {
        e.preventDefault();
    }

    onNavItemDragOver(e) {
        e.preventDefault();
    }

    onNavItemDragEnter(e) {
        e.preventDefault();
        const { uid } = e.target.closest("[data-uid]").dataset;
        this.setState("overNavGap", uid);
    }

    onNavItemDragLeave(e) {
        e.preventDefault();
        if (e.target.closest("[data-iid]").dataset && e.target.closest("[data-iid]").dataset.iid === "a") {
            this.setState("overNavGap", null);
        }
    }

    moveNodeAsChild(tree, sourceNodeUid, destinationNodeUid) {
        function findAndRemoveNode(nodes, uid) {
            for (let i = 0; i < nodes.length; i += 1) {
                if (nodes[i].uid === uid) {
                    return nodes.splice(i, 1)[0];
                }
                if (nodes[i].routes) {
                    const result = findAndRemoveNode(nodes[i].routes, uid);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        }
        if (sourceNodeUid === destinationNodeUid) {
            return tree;
        }
        const sourceNode = findAndRemoveNode(tree, sourceNodeUid);
        const destinationNode = this.findNodeByUid(tree, destinationNodeUid);
        if (!destinationNode) {
            return tree;
        }
        if (!destinationNode.routes) {
            destinationNode.routes = [];
        }
        destinationNode.routes.push(sourceNode);
        return tree;
    }

    onNavItemDrop(e) {
        if (
            !e.dataTransfer.getData("text/plain") ||
            !e.dataTransfer.getData("text/plain").match(this.idRex)
        ) {
            e.preventDefault();
            return;
        }
        this.setState("overNavGap", null);
        this.setState("navItemDragging", false);
        const { uid } = e.target.closest("[data-uid]").dataset;
        const [itemId] = e.dataTransfer
            .getData("text/plain")
            .replace(this.idRex, "")
            .split(/_/);
        const movingNode = this.findNodeByUid(this.state.navigationRoutes, itemId);
        if (movingNode.routes && movingNode.routes.length) {
            return;
        }
        const navigationRoutes = this.moveNodeAsChild(this.state.navigationRoutes, itemId, uid);
        this.setState("navigationRoutes", navigationRoutes);
    }

    onNavItemCheckboxClick(e) {
        e.stopPropagation();
    }

    onNavItemCheckboxChange(e) {
        let selected = cloneDeep(this.state.selected);
        const { checkbox } = e.target.closest("[data-checkbox]").dataset;
        if (e.target.checked) {
            selected.push(checkbox);
        } else {
            selected = selected.filter(i => i !== checkbox);
        }
        this.setState("selected", selected);
        this.setCheckboxes(selected);
    }

    async onNavDeleteClick(e) {
        e.preventDefault();
        if (!this.state.selected.length) {
            return;
        }
        await this.utils.waitForComponent("deleteConfirmation");
        this.getComponent("deleteConfirmation").setActive(true);
    }

    deleteNodesByUID(tree, uids) {
        const deleteNodes = (node) => {
            if (typeof node !== "object") return node;
            if (uids.includes(node.uid)) {
                return null; // Mark this node as deleted by returning null
            }

            if (node.routes) {
                node.routes = node.routes
                    .map(route => deleteNodes(route))
                    .filter(route => route !== null); // Remove null nodes
            }

            return node;
        };
        return tree.map(node => deleteNodes(node)).filter(node => node !== null);
    }

    setCheckboxes(selected) {
        const checkboxes = document.querySelectorAll("input[type=\"checkbox\"][data-checkbox]");
        checkboxes.forEach(checkbox => {
            const uid = checkbox.getAttribute("data-checkbox");
            checkbox.checked = selected.includes(uid);
        });
        this.setState("anyCheckboxesSelected", this.state.selected.length > 0);
    }

    onDeleteConfirmationButtonClick(btn) {
        switch (btn) {
            case "confirm":
                this.setState("navigationRoutes", this.deleteNodesByUID(this.state.navigationRoutes, this.state.selected));
                this.getComponent("deleteConfirmation").setActive(false);
                this.setState("selected", []);
                this.setCheckboxes([]);
                break;
        }
    }

    getNavigationRoutes() {
        return this.state.navigationRoutes;
    }
}
