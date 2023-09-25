import {
    mdiContentCopy,
    mdiContentCut,
    mdiTrashCanOutline,
    mdiChevronDown,
} from "@mdi/js";

export default [{
    id: "copy",
    label: "copy",
    icon: mdiContentCopy,
}, {
    id: "cut",
    label: "cut",
    icon: mdiContentCut,
}, {
    id: "delete",
    label: "delete",
    icon: mdiTrashCanOutline,
    danger: true,
}, {
    id: "extras",
    label: "extras",
    icon: mdiChevronDown,
    menu: [{
        id: "rename",
        label: "rename"
    }, {
        id: "edit",
        label: "edit"
    }]
}];
