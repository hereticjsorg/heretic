import { mdiContentCopy, mdiContentCut, mdiTrashCanOutline } from "@mdi/js";

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
}];
