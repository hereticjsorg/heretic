export default class {
    constructor(policy, t) {
        this.policy = policy;
        this.t = t;
    }

    checkPolicy(password) {
        if (!password || typeof password !== "string") {
            return {
                errors: ["invalidParameters"],
                groups: [],
            };
        }
        password = password.trim();
        const errors = [];
        if ((this.policy.minLength && password.length < this.policy.minLength) || (this.policy.maxLength && password.length > this.policy.maxLength)) {
            errors.push("errorPasswordLength");
        }
        const availGroups = {
            Lowercase: !!(this.policy.lowercase && password.match(/[a-z]+/)),
            Uppercase: !!(this.policy.uppercase && password.match(/[A-Z]+/)),
            Numbers: !!(this.policy.numbers && password.match(/[0-9]+/)),
            Special: !!(this.policy.special && password.match(/[^a-zA-Z0-9]+/)),
        };
        const groups = Object.keys(availGroups).filter(k => availGroups[k]).map(k => k.toLowerCase());
        if (this.policy.minGroups && groups.length < this.policy.minGroups) {
            errors.push("errorMinGroups");
        } else if (!this.policy.minGroups) {
            Object.keys(availGroups).map(i => {
                if (!availGroups[i]) {
                    errors.push(`errorPassword${i}`);
                }
            });
        }
        return {
            errors,
            groups,
        };
    }

    onPasswordChange(passwordPolicyFieldId, passwordFieldId) {
        setTimeout(() => {
            const passwordPolicyDiv = document.getElementById(passwordPolicyFieldId);
            const password = document.getElementById(passwordFieldId).value.trim();
            const check = this.checkPolicy(password);
            const htmlArr = [`<span class="tag is-light ${(!password.length || check.errors.indexOf("errorPasswordLength")) !== -1 ? "is-danger" : "is-success"}">${this.t(`passwordLength`)}: ${password.length}</span>`];
            for (const k of ["uppercase", "lowercase", "numbers", "special"]) {
                if (this.policy.minGroups) {
                    htmlArr.push(`<span class="tag ${(check.groups.length >= this.policy.minGroups ? (check.groups.indexOf(k) > -1 ? "is-success" : "") : (check.groups.indexOf(k) > -1 ? "is-success" : "is-danger"))} is-light">${this.t(`password_${k}`)}</span>`);
                } else {
                    htmlArr.push(`<span class="tag ${(check.groups.indexOf(k) > -1 ? "is-success" : "is-danger")} is-light">${this.t(`password_${k}`)}</span>`);
                }
            }
            passwordPolicyDiv.innerHTML = `<div class="tags">${htmlArr.join("")}</div>`;
        });
    }

    getPasswordPolicyData(password) {
        const check = this.checkPolicy(password);
        const dataArr = [{
            label: `${this.t(`passwordLength`)}: ${password.length}`,
            type: (!password.length || check.errors.indexOf("errorPasswordLength") !== -1) ? "is-danger" : "is-success",
        }];
        for (const k of ["uppercase", "lowercase", "numbers", "special"]) {
            if (this.policy.minGroups) {
                dataArr.push({
                    type: (check.groups.length >= this.policy.minGroups ? (check.groups.indexOf(k) > -1 ? "is-success" : "") : (check.groups.indexOf(k) > -1 ? "is-success" : "is-danger")),
                    label: this.t(`password_${k}`),
                });
            } else {
                dataArr.push({
                    type: (check.groups.indexOf(k) > -1 ? "is-success" : "is-danger"),
                    label: this.t(`password_${k}`),
                });
            }
        }
        return dataArr;
    }
}
