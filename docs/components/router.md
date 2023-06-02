# Router Components

Router components are required for navigation between pages and modules in SPA mode.

## Router

Display different content based on current route.

Usage:

```html
<if(process.browser)>
    <hrouter on-route-change("onRouteChange")/>
    <if(state.routed)>
        <div id="hr_content_render_wrap"/>
    </if>
</if>
```

Then, load the content which is appropriate to the current route:

```javascript
const pagesLoader = require("#build/loaders/page-loader-userspace");
const routesData = require("#build/build.json");

async onCreate(input, out) {
    this.state = {
        mounted: false,
        route: null,
        routed: false,
    };
    this.componentsLoaded = {};
    this.serverRoute = out.global.route;
    this.webSockets = out.global.webSockets;
    this.utils = new Utils(this, this.language);
}

async onRouteChange(router) {
    let component = null;
    const route = router.getRoute();
    const routeData = routesData.routes.userspace.find(r => r.id === route.id);
    if ((route.id !== this.serverRoute || this.state.routed) && routeData) {
        try {
            component = await pagesLoader.loadComponent(route.id);
            const renderedComponent = await component.default.render();
            this.setState("routed", true);
            await this.utils.waitForElement("hr_content_render_wrap");
            const contentRenderWrap = document.getElementById("hr_content_render_wrap");
            renderedComponent.replaceChildrenOf(contentRenderWrap);
            this.componentsLoaded[route.id] = true;
        } catch {
            // Do something with this error
            return;
        }
    }
    if (this.state.routed && !routeData) {
        component = await pagesLoader.loadComponent(null);
        this.componentsLoaded["404"] = true;
        this.setState("route", cloneDeep(route));
    }
}
```
## Router-Link

Router-links are functioning the same way as normal *<a\/>* tags with only difference that those links are toggling different routes without actually reloading the page.

Usage:

```html
<hrouter-link 
    route="routeId" class="is-underlined">
    Link Text
</hrouter-link>
```

You may wish to set any value for *routeId* which corresponds to your page ID you wish to link to.

## Admin Routes

There are to different components to use for *Admin Panel*: 

* *<hrouter\/>*
* *<hrouter-link\/>*

They do work the same way as regular components. Other than the area of use, there is no other difference. 