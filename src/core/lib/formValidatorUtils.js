module.exports = {
    getValidationData: (formData) => {
        const validationSchema = {};
        const fieldsFlat = {};
        const fieldsArea = {};
        for (const area of formData) {
            if (area.id) {
                fieldsArea[area.id] = [];
            }
            for (const item of area.fields) {
                if (Array.isArray(item)) {
                    for (const subItem of item) {
                        if (subItem.validation) {
                            validationSchema[subItem.id] = subItem.validation;
                        }
                        fieldsFlat[subItem.id] = subItem;
                        if (area.id) {
                            fieldsArea[area.id].push(subItem.id);
                        }
                    }
                } else {
                    if (item.validation) {
                        validationSchema[item.id] = item.validation;
                    }
                    fieldsFlat[item.id] = item;
                    if (area.id) {
                        fieldsArea[area.id].push(item.id);
                    }
                }
            }
        }
        return {
            validationSchema,
            fieldsFlat,
            fieldsArea,
        };
    },
    getErrorData: (validationResult, t) => {
        const errorData = [];
        for (const item of validationResult) {
            const instanceArr = item.instancePath.split(/\//);
            const id = instanceArr[instanceArr.length - 1];
            let errorCode = null;
            switch (item.keyword) {
                case "type":
                    errorCode = "hform_error_type";
                    break;
                case "maximum":
                    errorCode = "hform_error_max";
                    break;
                case "minLength":
                    errorCode = "hform_error_minLength";
                    break;
                case "maxLength":
                    errorCode = "hform_error_maxLength";
                    break;
                case "pattern":
                case "format":
                case "anyOf":
                case "enum":
                    errorCode = "hform_error_format";
                    break;
                case "filesMinCount":
                    errorCode = "hform_error_filesMinCount";
                    break;
                case "filesMaxCount":
                    errorCode = "hform_error_filesMaxCount";
                    break;
                case "filesMaxSize":
                    errorCode = "hform_error_filesMaxSize";
                    break;
                case "filesBadExtension":
                    errorCode = "hform_error_filesBadExtension";
                    break;
                case "passwordsDoNotMatch":
                    errorCode = "hform_error_passwordsDoNotMatch";
                    break;
                default:
                    errorCode = `hform_error_${item.keyword || "generic"}`;
            }
            errorData.push({
                id,
                tab: item.tab,
                errorCode,
                errorMessage: t ? t(errorCode) : null,
            });
        }
        return errorData;
    },
};
