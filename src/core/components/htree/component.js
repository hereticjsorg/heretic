import cloneDeep from "lodash/cloneDeep";

export default class {
    async onCreate(input) {
        this.state = {
            selected: null,
            drag: false,
            overRootGap: false,
            data: input.data || [],
            treeData: {},
            visibilityData: {},
            openData: {},
        };
        this.state.treeData = this.getTreeState();
        this.state.visibilityData = this.generateVisibilityState();
        this.state.openData = this.updateOpenData(this.state.visibilityData);
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

    isNodeAllowed(srcId, data = this.state.data) {
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

    findNodeById(id, data = this.state.data) {
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

    getNode(id) {
        let resultNode = null;
        const findNode = (node) => {
            if (node.id === id) {
                resultNode = node;
                return true;
            }
            if (node.children) {
                for (const child of node.children) {
                    if (findNode(child)) {
                        return true;
                    }
                }
            }
            return false;
        };
        this.state.data.forEach((node) => findNode(node));
        return resultNode;
    }

    getSelectedNodeId() {
        return this.state.selected;
    }

    setNode(id, data) {
        const tree = cloneDeep(this.state.data);
        let nodeUpdated = false;
        const updateNode = (node) => {
            if (node.id === id) {
                Object.assign(node, data);
                nodeUpdated = true;
                return true;
            }
            if (node.children) {
                for (const child of node.children) {
                    if (updateNode(child)) {
                        return true;
                    }
                }
            }
            return false;
        };
        tree.forEach((node) => updateNode(node));
        if (!nodeUpdated) {
            tree.unshift(data);
        }
        this.setState("visibilityData", this.generateVisibilityState(tree));
        this.setState("treeData", this.getTreeState(tree));
        this.setState(
            "openData",
            this.updateOpenData(this.state.visibilityData),
        );
        this.setState("data", tree);
    }

    removeNodeById(id, data = this.state.data) {
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

    insertNode(id, newNode, position, data = this.state.data) {
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

    cleanUpNodes(data = this.state.data) {
        for (let i = 0; i < data.length; i += 1) {
            if (data[i].children && data[i].children.length) {
                data[i].children = this.cleanUpNodes(data[i].children);
            } else {
                delete data[i].children;
            }
        }
        return data;
    }

    getTreeState(tree = cloneDeep(this.state.data)) {
        const result = {};
        const traverse = (node, pathState) => {
            const { id, children } = node;
            result[id] = [...pathState];
            if (children && children.length > 0) {
                children.forEach((child, index) => {
                    const isLast = index === children.length - 1;
                    traverse(child, [...pathState, !isLast]);
                });
            }
        };
        tree.forEach((rootNode, index) => {
            const isLast = index === tree.length - 1;
            traverse(rootNode, [!isLast]);
        });
        return result;
    }

    generateVisibilityState(data = this.state.data) {
        const visibilityData = {};
        function traverse(node, isVisible) {
            visibilityData[node.id] = isVisible;
            if (node.children) {
                node.children.forEach((child) => traverse(child, false));
            }
        }
        data.forEach((node) => traverse(node, true));
        return visibilityData;
    }

    toggleTree(id, visibilityStateData) {
        const tree = this.state.data;
        const visibilityData = cloneDeep(visibilityStateData);
        const findNode = (node) => {
            if (node.id === id) return node;
            if (node.children) {
                for (const child of node.children) {
                    const found = findNode(child);
                    if (found) return found;
                }
            }
            return null;
        };
        const toggleChildrenVisibility = (node, vs, makeVisible) => {
            if (!node.children) return;
            node.children.forEach((child) => {
                vs[child.id] = makeVisible;
                if (!makeVisible) {
                    toggleChildrenVisibility(child, vs, makeVisible);
                }
            });
        };
        tree.forEach((node) => {
            const targetNode = findNode(node);
            if (targetNode) {
                const makeVisible = !targetNode.children.some(
                    (child) => visibilityData[child.id],
                );
                toggleChildrenVisibility(
                    targetNode,
                    visibilityData,
                    makeVisible,
                );
            }
        });
        return visibilityData;
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
        const visibilityData = this.selectNode(data.dest, treeData);
        this.setState("visibilityData", visibilityData);
        this.setState("data", treeData);
        this.emit("drop", treeData);
        this.setState("treeData", this.getTreeState(treeData));
    }

    onTreeToggle(id) {
        const visibilityData = this.toggleTree(
            id,
            this.state.visibilityData,
            this.state.data,
        );
        this.setState("visibilityData", visibilityData);
        this.setState(
            "openData",
            this.updateOpenData(this.state.visibilityData),
        );
    }

    updateOpenData(visibilityData, tree = this.state.data) {
        const openData = {};
        function traverse(node) {
            if (node.children) {
                const anyChildVisible = node.children.some(
                    (child) => visibilityData[child.id],
                );
                openData[node.id] = anyChildVisible;
                node.children.forEach((child) => traverse(child));
            } else {
                openData[node.id] = false;
            }
        }
        tree.forEach((node) => traverse(node));
        return openData;
    }

    selectNode(id, tree = cloneDeep(this.state.data)) {
        const visibilityData = cloneDeep(this.state.visibilityData);
        const findAndSelectNode = (node, path = []) => {
            if (node.id === id) {
                path.forEach((ancestor) => {
                    visibilityData[ancestor.id] = true;
                });
                visibilityData[node.id] = true;
                return true;
            }
            if (node.children) {
                for (const child of node.children) {
                    if (findAndSelectNode(child, [...path, node])) {
                        return true;
                    }
                }
            }
            return false;
        };
        tree.forEach((node) => findAndSelectNode(node));
        this.setState("visibilityData", visibilityData);
        return visibilityData;
    }

    findNodePath(id) {
        const tree = cloneDeep(this.state.data);
        const path = [];
        const findPath = (node, currentPath = []) => {
            if (node.id === id) {
                currentPath.push({ id: node.id, label: node.label });
                path.push(...currentPath);
                return true;
            }
            if (node.children) {
                for (const child of node.children) {
                    if (
                        findPath(child, [
                            ...currentPath,
                            { id: node.id, label: node.label },
                        ])
                    ) {
                        return true;
                    }
                }
            }
            return false;
        };
        tree.forEach((node) => findPath(node));
        return path;
    }

    addChild(id, data) {
        const tree = cloneDeep(this.state.data);
        let nodeFound = false;
        const addChildToNode = (node) => {
            if (node.id === id) {
                if (!node.children) {
                    node.children = [];
                }
                node.children.push(data);
                nodeFound = true;
                return true;
            }
            if (node.children) {
                for (const child of node.children) {
                    if (addChildToNode(child)) {
                        return true;
                    }
                }
            }
            return false;
        };
        tree.forEach((node) => addChildToNode(node));
        if (!nodeFound) {
            tree.push(data);
        }
        const visibilityData = this.selectNode(id, tree);
        this.setState("visibilityData", visibilityData);
        this.setState("treeData", this.getTreeState(tree));
        this.setState(
            "openData",
            this.updateOpenData(this.state.visibilityData),
        );
        this.setState("data", tree);
    }

    setSelected(id) {
        this.setState("selected", id);
    }
}
