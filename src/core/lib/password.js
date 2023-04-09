export default class {
    constructor(policy) {
        this.policy = policy;
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
}
