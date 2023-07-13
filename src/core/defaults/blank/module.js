import {
    id,
} from "./module.json";

export default {
    id,
    routes: {
        userspace: {
            page: {
                path: `/${id}`,
            },
        },
        admin: {}
    },
};
