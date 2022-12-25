# Modal Window

Display modal window with different options and handle corresponding events.

```html
<hmodal
    key="exampleModal"
    id="exampleModal"
    on-button-click("onExampleModalButtonClick")
    close=true
    cardClass="pl-3 pr-3"
    backgroundClass="hr-hm-background-60"
    title="exampleModalTitle"
    actions=[
        {
            id: "delete",
            label: "exampleModalDelete",
            class: "button is-danger",
        },
        {
            id: "cancel",
            label: "exampleModalCancel",
            class: "button is-light",
            close: true,
        }
    ]>
    <section
        class="modal-card-body"
        style={
            order: "2"
        }>
        <t>modalWindowContentsGoesHere</t>
    </section>
</hmodal>
```

## Settings

The following settings might be set:

* **close** *(true/false)* - allow to close dialog
* **cardClass** *(string)* - optionally set additional class for modal card
* **backgroundClass** *(string)* - optionally set additional class for modal background
* **title** *(string)* - modal title
* **actions** *(array)* - modal dialog buttons

Modal dialog may have one or more sections in order to display content. Make sure to set *order* property in style *2*, *3*, *4* etc. for each next section.

```javascript
style={
    order: "2"
}>
```

## Events

### button-click (id)

Emitted when dialog button is pressed
