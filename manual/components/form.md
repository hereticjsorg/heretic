# Form Builder

Form Builder component (*hform*) allows you to dynamically build and validate forms.

Usage example:

```html
<hform 
    key="exampleForm"
    id="exampleForm"
    data=formData
    on-button-click("onFormButtonClick")
    on-form-submit("onFormSubmit")
    on-mount-complete("onFormMountComplete")/>
```

## Data

In order to build form data, you need to pass the *data* object. It contains everything the component needs to build and process form data:

```javascript
// Import icons from Material Design Icons package
const {
    mdiPencilOutline,
    mdiTrashCanOutline,
    mdiAccountPlusOutline,
} = require("@mdi/js");
// Require form validator utilities library
const utils = require("../../../core/lib/formValidatorUtils");

export default class {
    // Pass translation function to the constructor
    constructor(t) {
        this.t = t || (id => id);
        // Form data object
        this.data = {
            form: [],
        };
        // Extract validation data from form
        this.validationData = utils.getValidationData(this.data.form);
    }

    // Getter: return form data
    getData() {
        return this.data;
    }

    // Return validation schema for Ajv
    getValidationSchema() {
        return {
            type: "object",
            properties: this.validationData.validationSchema,
        };
    }

    // Returns an array of form data in flat mode
    getFieldsFlat() {
        return this.validationData.fieldsFlat;
    }

    // Get object of available field areas
    getFieldsArea() {
        return this.validationData.fieldsArea;
    }

    // Get table columns (used for mtable component)
    getTableColumns() {
        return Object.fromEntries(Object.entries(this.validationData.fieldsFlat).filter(([, value]) => ["text", "select", "column", "date", "div"].indexOf(value.type) > -1));
    }

    // Get default sort column (used for mtable component)
    getTableDefaultSortColumn() {
        return {
            id: "example",
            direction: 1, // 1 = asc, 2 = desc
        };
    }

    // Is action column enabled
    isActionColumn() {
        return true;
    }

    // Is checkbox column enabled
    isCheckboxColumn() {
        return this.checkboxColumn;
    }

    // Get buttons for action column
    getActions() {
        return [{
            id: "edit", // Button ID
            label: this.t("edit"), // Button label
            icon: mdiPencilOutline, // Icon
        }, {
            id: "delete", // Button ID
            label: this.t("delete"), // Button label
            icon: mdiTrashCanOutline, // Icon
            danger: true, // Red button
        }];
    }

    // Get top buttons
    getTopButtons() {
        return [{
            id: "newItem", // Button ID
            label: this.t("newItem"), // Button label
            icon: mdiAccountPlusOutline, // Icon
        }, {
            id: "delete", // Button ID
            label: this.t("deleteSelected"), // Button label
            icon: mdiTrashCanOutline, // Icon
            danger: true, // Red button
        }];
    }

    // Get data loading configuration (for mtable component)
    getTableLoadConfig() {
        return {
            url: `/api/${moduleConfig.id}/list`,
        };
    }

    // Get bulk edit configuration (for mtable component)
    getTableBulkUpdateConfig() {
        return {
            url: `/api/${moduleConfig.id}/bulkSave`,
        };
    }

    // Get table export configuration (for mtable component)
    getTableExportConfig() {
        return {
            url: `/api/${moduleConfig.id}/export`,
            download: `/api/${moduleConfig.id}/download`,
        };
    }

    // Get recycle bin configuration (for mtable component)
    getRecycleBinConfig() {
        return {
            enabled: true, // Is recycle bin enabled
            title: "label", // Field ID used to display in confirmation dialog
            id: "id", // Id field
            url: {
                list: `/api/${moduleConfig.id}/recycleBin/list`, // List endpoint
                restore: `/api/${moduleConfig.id}/recycleBin/restore`, // Restore endpoint
                delete: `/api/${moduleConfig.id}/recycleBin/delete`, // Delete endpoint
            },
        };
    }

    // Get item delete configuration
    getTableDeleteConfig() {
        return {
            url: `/api/${moduleConfig.id}/delete`, // Delete endpoint
            titleId: "id", // Field ID used to display in confirmation dialog
        };
    }

    // Process value based on cell data
    processTableCell(id, row) {
        return row[id]
    }

    // Allow to change the mode (view/edit)
    isModeChangeAllowed() {
        return false;
    }

    // Get form tabs array
    // When "id" is set to _default, no tabs are displayed
    getTabs() {
        return [{
            id: "_default",
            label: "",
        }];
    }

    // Which tabs should be displayed on first render
    getTabsStart() {
        return ["_default"];
    }

    // History configuration
    getHistoryConfig() {
        return {
            enabled: true, // Is history enabled
            list: `/api/${moduleConfig.id}/history/list`, // List endpoint
        };
    }

    // Fields with restricted access (array of strings)
    getRestrictedFields() {
        return [];
    }

    // Areas with restricted access (array of strings)
    getRestrictedAreas() {
        return [];
    }

    // When received, this hard-coded value means "access denied"
    getMagicStringAccessDenied() {
        return "WP0eX1QaOvhNWEgYa8Nx1X2f";
    }
}
```

Form data property has the following structure:

```
form [ { area }, { area }, ...]
```

Each area may contain one or more group of fields and may have it's own label and styling when necessary.

The following field types are available:

### text

Used to display a text input field.

```javascript
{
    id: "firstName", // Unique field ID
    type: "text", // Field type
    label: this.t("firstName"), // Field label
    mandatory: true, // Mandatory flag
    validation: { // Ajv validation schema
        type: ["string"],
    },
    sortable: true, // Is field sortable? (used by mtable)
    searchable: true, // Is field searchable (used by mtable)
    css: "hr-hf-field-large", // Field wrapper styling used to set field width
    column: true, // Should this field be displayed as column (used by mtable)
    createIndex: true, // Should this field be indexed in database (used by mtable)
    autoFocus: true, // Should this field be focused on first render?
    hidden: false, // Don't show this field as a table column by default (used by mtable)
    convert: "integer", // When set, result value will be converted to integer
    maskedOptions: { // IMask options for masked fields
        mask: Number,
        min: 1,
        max: 99,
    },
}
```

### select

Used to display a select input field.

```javascript
{
    id: "chapter", // Unique field ID
    type: "select", // Field type
    label: this.t("chapter"), // Field label
    mandatory: false, // Mandatory flag
    validation: { // Ajv validation schema
        type: ["string", "null"],
        enum: [null, "", "example1", "example2"],
    },
    options: [{ // List of options (value and label)
        value: "",
        label: "—"
    }, {
        value: "example1",
        label: this.t("example1"),
    }, {
        value: "example2",
        label: this.t("example2"),
    }],
    defaultValue: "", // Default value on form render
    sortable: true, // Is field sortable? (used by mtable)
    searchable: true, // Is field searchable (used by mtable)
    css: "hr-hf-field-large", // Field wrapper styling used to set field width
    column: true, // Should this field be displayed as column (used by mtable)
    createIndex: true, // Should this field be indexed in database (used by mtable)
    autoFocus: false, // Should this field be focused on first render?
    hidden: false, // Don't show this field as a table column by default (used by mtable)
}
```

### date

Used to display a date picker input field. Result value is stored as UNIX timestamp.

```javascript
{
    id: "hireDate", // Unique field ID
    type: "date", // Field type
    label: this.t("hireDate"), // Field label
    validation: { // Ajv validation schema
        type: ["integer", "null"],
    },
    convert: "integer", // When set, result value will be converted to integer
    sortable: true, // Is field sortable? (used by mtable)
    searchable: true, // Is field searchable? (used by mtable)
    css: "hr-hf-field-date", // Field wrapper styling used to set field width
    column: true, // Should this field be displayed as column (used by mtable)
    createIndex: true, // Should this field be indexed in database (used by mtable)
    hidden: true, // Don't show this field as a table column by default (used by mtable)
}
```

### column

Used to represent a table column by *mtable* component, not rendered as form field.

```javascript
{
    id: "id", // Unique field ID
    type: "column", // Field type
    label: this.t("id"), // Field label
    sortable: true, // Is field sortable? (used by mtable)
    column: true, // Should this field be displayed as column (used by mtable)
    createIndex: true,  // Should this field be indexed in database (used by mtable)
}
```

### div

Used to display a DIV element and then render its content programmatically.

```javascript
{
    id: "salaryStatus", // Unique field ID
    type: "div", // Field type
    label: this.t("salaryStatus"), // Field label
    validation: {}, // Validation (ignored)
    css: "hr-hf-field-large",  // Field wrapper styling used to set field width
    divClass: "input is-justify-content-center", // Element styling
}
```

### log

Used to display key-value fields combined with date, might be useful to display different event logs.

```javascript
{
    id: "salaryLog", // Unique field ID
    type: "log", // Field type
    label: this.t("salaryLog"), // Field label
    mandatory: false, // Mandatory flag
    validation: { // Ajv validation schema
        type: ["array", "null"],
        items: {
            type: "object",
            properties: {
                uid: {
                    type: "string",
                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                },
                logValue: {
                    type: ["string", "null"],
                    maxLength: 32,
                },
                logStatus: {
                    type: "string",
                    enum: ["planned", "negotiation", "done"],
                },
                logComments: {
                    type: ["string", "null"],
                    maxLength: 2048,
                },
                logDate: {
                    type: ["integer", "null"],
                }
            },
            required: ["uid"],
        },
        minItems: 0,
        uniqueItems: false,
    },
    options: [{ // List of options for logStatus
        value: "planned",
        label: this.t("logValue.planned"),
    }, {
        value: "negotiation",
        label: this.t("logValue.negotiation"),
    }, {
        value: "done",
        label: this.t("logValue.done"),
    }],
    defaultOption: "planned", // Default logStatus option
}
```

### files

Used to upload files to server.

```javascript
{
    id: "attachments", // Unique field ID
    type: "files", // Field type
    label: this.t("attachments"), // Field label
    buttonLabel: this.t("select"), // Select button label
    multiple: true, // Allow to upload multiple files
    validation: { // Validation
        minCount: 0, // Min. count of files
        maxCount: 10, // Max. count of files
        maxSize: 5096000, // Max. file size
    },
    download: "/api/example/download", // URL used to download files
}
```

### wysiwyg

Used to display a WYSIWYG editor.

```javascript
{
    id: "comments", // Unique field ID
    type: "wysiwyg", // Field type
    label: this.t("notes"), // Field label
}
```

## Events

The following events are emitted by the form builder component.

### mount-complete ()

This event is emitted when all fields are rendered and settled on view.

### mode-change (mode)

Emitted when user changes form mode. Possible *mode* values: *view*, *edit*.

### form-submit ()

Emitted when form is submitted.

### button-click (data)

Emitted when form button is pressed. *data* object:

```javascript
{
    id: "buttonId", // Button ID
    type: "button", // Button type (button, submit etc.)
}
```

### request-history (data)

Emitted when history is requested by user. *data* object:

```javascript
{
    page: 1,
}
```

### restore-history (id)

Emitted when history element with *id* needs to be restored.

### delete-history (id)

Emitted when history element with *id* needs to be deleted.

### value-change (data)

Emitted when field value changes. *data* object:

```javascript
{
    id: "fieldId", // Field ID
    type: "text", // Field Type
    value: "example" // Field Value
}
```