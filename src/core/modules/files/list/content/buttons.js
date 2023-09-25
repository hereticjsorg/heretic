import {
    mdiArrowUpThin,
    mdiRefresh,
    mdiContentCopy,
    mdiContentCut,
    mdiTrashCanOutline,
    mdiFolderPlusOutline,
    mdiFileUploadOutline,
    mdiContentPaste,
    mdiFileDocumentPlusOutline,
} from "@mdi/js";

export default [{
    id: "refresh",
    label: "refresh",
    icon: mdiRefresh,
}, {
    id: "dirUp",
    label: "dirUp",
    icon: mdiArrowUpThin,
}, {
    separator: true,
}, {
    id: "copy",
    label: "copy",
    icon: mdiContentCopy,
}, {
    id: "cut",
    label: "cut",
    icon: mdiContentCut,
}, {
    id: "paste",
    label: "paste",
    icon: mdiContentPaste,
}, {
    id: "delete",
    label: "delete",
    icon: mdiTrashCanOutline,
    danger: true,
}, {
    separator: true,
}, {
    id: "newDir",
    label: "newDir",
    icon: mdiFolderPlusOutline,
}, {
    id: "newFile",
    label: "newFile",
    icon: mdiFileDocumentPlusOutline,
}, {
    id: "upload",
    label: "upload",
    icon: mdiFileUploadOutline,
}];
