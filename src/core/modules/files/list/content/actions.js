import {
    mdiContentCopy,
    mdiContentCut,
    mdiTrashCanOutline,
    mdiChevronDown,
} from "@mdi/js";

export default [
    {
        id: "copy",
        label: "copy",
        icon: mdiContentCopy,
    },
    {
        id: "cut",
        label: "cut",
        icon: mdiContentCut,
    },
    {
        id: "delete",
        label: "delete",
        icon: mdiTrashCanOutline,
        danger: true,
    },
    {
        id: "extras",
        label: "extras",
        icon: mdiChevronDown,
        menu: [
            {
                id: "rename",
                label: "rename",
            },
            {
                id: "edit",
                label: "edit",
                dir: false,
                binary: false,
            },
            {
                id: "unzip",
                label: "unzip",
                ext: "zip",
            },
            {
                id: "untar",
                label: "untar",
                ext: "tar",
            },
            {
                id: "untgz",
                label: "untgz",
                ext: "tgz",
            },
            {
                id: "download",
                label: "download",
                dir: false,
            },
        ],
    },
];
