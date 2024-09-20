import cloneDeep from "lodash/cloneDeep";

export default class {
    async onCreate(input) {
        this.state = {
            selected: null,
            drag: false,
            overRootGap: false,
            data: input.data || [],
        };
        if (input.admin) {
            await import(
                /* webpackChunkName: "hselect-admin" */ "./style-admin.scss"
            );
        } else {
            await import(
                /* webpackChunkName: "hselect-frontend" */ "./style-frontend.scss"
            );
        }
    }

    onItemClick(data) {
        this.setState("selected", data.id);
    }

    onRootItemClick(e) {
        e.preventDefault();
        this.setState("selected", null);
    }

    onDragStart() {
        this.setState("drag", true);
    }

    onDragEnd() {
        this.setState("drag", false);
    }

    onDrag() {}

    isNodeAllowed(srcId, data) {
        for (let i = 0; i < data.length; i += 1) {
            if (data[i].id === srcId) {
                return false;
            }
            if (data[i].children) {
                if (!this.isNodeAllowed(srcId, data[i].children)) {
                    return false;
                }
            }
        }
        return true;
    }

    findNodeById(id, data) {
        let node;
        data.map((i) => {
            if (i.id === id) {
                node = i;
            }
            if (!node && i.children) {
                node = this.findNodeById(id, i.children);
            }
        });
        return node;
    }

    removeNodeById(id, data) {
        return data
            .map((i) => {
                if (i.id === id) {
                    i = null;
                }
                if (i && i.children && i.children.length) {
                    i.children = this.removeNodeById(id, i.children);
                }
                return i;
            })
            .filter((i) => i);
    }

    insertNode(id, newNode, position, data) {
        for (let i = 0; i < data.length; i += 1) {
            if (data[i].id === id) {
                switch (position) {
                    case "top":
                        data.splice(i, 0, newNode);
                        break;
                    case "bottom":
                        data.splice(i + 1, 0, newNode);
                        break;
                    default:
                        // eslint-disable-next-line no-console
                        console.log(data[i].children);
                        data[i].children = data[i].children || [];
                        data[i].children.splice(0, 0, newNode);
                        break;
                }
                break;
            }
            if (data[i].children) {
                data[i].children = this.insertNode(
                    id,
                    newNode,
                    position,
                    data[i].children,
                );
            }
        }
        return data;
    }

    cleanUpNodes(data) {
        for (let i = 0; i < data.length; i += 1) {
            if (data[i].children && data[i].children.length) {
                data[i].children = this.cleanUpNodes(data[i].children);
            } else {
                delete data[i].children;
            }
        }
        return data;
    }

    onDrop(data) {
        this.setState("drag", false);
        let treeData = cloneDeep(this.state.data);
        const srcNode = this.findNodeById(data.src, treeData);
        if (!this.isNodeAllowed(data.dest, [srcNode])) {
            return;
        }
        treeData = this.removeNodeById(data.src, treeData);
        treeData = this.insertNode(data.dest, srcNode, data.position, treeData);
        treeData = this.cleanUpNodes(treeData);
        this.setState("data", treeData);
        this.emit("drop", data);
    }
}
