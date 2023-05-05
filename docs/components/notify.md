# Notification

Display notification messages on top of the page.

Usage:

```html
<hnotify 
    key="notifyExample"/>
```

## Methods

Use *show* method to display notification messages:

```javascript
this.getComponent("notifyExample").show(window.__heretic.t("notificationMessage"), "is-danger");
```

Use classes from [Bulma](https://bulma.io/documentation/elements/notification/) in order to have different styling for your notifications. 