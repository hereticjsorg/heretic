# Table Builder

Table Builder component (*hflextable*) allows you to dynamically display table data.

*Note*: a deprecated version of the dynamic table htable using the "table" tag is also available. 

Usage example:

```html
<hflextable 
    key=`${moduleConfig.id}List`
    id=`${moduleConfig.id}List`
    data=formData
    on-top-button-click("onTopButtonClick")
    on-action-button-click("onActionButtonClick")
    on-unauthorized("onUnauthorized")
    autoLoad=true
    queryString=true
    headers={}/>
```

## Data

In order to render table, you need to pass the *data* object. It contains everything the component needs to build tanle form data:

```javascript
// Import icons from Material Design Icons package
const {
    mdiPencilOutline,
    mdiTrashCanOutline,
    mdiAccountPlusOutline,
} = require("@mdi/js");
// Require form validator utilities library
const utils = require("#lib/formValidatorUtils");

export default class {
    // Pass translation function to the constructor
    constructor(t) {
        this.t = t || (id => id);
        // Form data object
        this.data = {
            form: [],
        };
    }

    // Getter: return form data
    getData() {
        return this.data;
    }

    // Returns an array of form data in flat mode
    getFieldsFlat() {
        return this.validationData.fieldsFlat;
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
}
```

Form data property structure and its elements are described in [Form Builder manual](form.md).

## Events

The following events are emitted by the table component.

### load-complete (data)

This event is emitted when data from server is loaded successfully.

### unauthorized ()

Emitted when receiving 403 error from server.

### top-button-click (id)

Emitted when top button is pressed.

### action-button-click (data)

Emitted when action button is pressed. *data* object:

```javascript
{
    buttonId: "buttonId", // Button ID
    itemId: "button", // Table row ID
}
```