const id = "auth";

module.exports = {
    id,
    routes: {
        userspace: {
            signInUserspace: {
                path: "/signIn",
            },
            signOutUserspace: {
                path: "/signOut",
            },
            signUp: {
                path: "/signUp"
            },
            restorePassword: {
                path: "/restorePassword"
            },
            activate: {
                path: "/activate",
            },
            account: {
                path: "/account",
            },
        },
        admin: {
            signInAdmin: {
                path: "/signIn",
            },
            signOutAdmin: {
                path: "/signOut",
            },
        }
    },
    api: {
        signUp: "/api/signUp",
        restorePassword: "/api/user/password/restore",
        activate: "/api/user/activate",
        setPassword: "/api/user/password/set",
        getData: "/api/user/getData",
    },
};
