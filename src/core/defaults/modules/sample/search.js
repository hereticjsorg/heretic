import { compile } from "html-to-text";
import moduleConfig from "./module.js";

export default class {
    constructor(id, fastify, func) {
        this.fastify = fastify;
        this.id = id;
        this.func = func;
        this.convert = compile({
            wordwrap: null,
            preserveNewlines: true,
            formatters: {
                uppercase: false,
            },
        });
    }

    async process() {
        // This is an example on how to extract the text from the Marko pages directly
        // It is suitable for static pages based on <lang-switch/> technique
        const data = [];
        const dirs = [
            ...Object.keys(moduleConfig.routes.userspace),
            ...Object.keys(moduleConfig.routes.admin),
        ];
        for (const dir of dirs) {
            const urlData =
                moduleConfig.routes.userspace[dir] ||
                moduleConfig.routes.admin[dir];
            for (const lang of Object.keys(this.fastify.languages)) {
                try {
                    const item = {
                        route: `${moduleConfig.id}_${dir}`,
                        url: urlData.path || "/",
                        id: `${moduleConfig.id}-${dir}-${lang}`,
                    };
                    item.url =
                        lang === Object.keys(this.fastify.languages)[0]
                            ? item.url
                            : `/${lang}${item.url}`;
                    const pageMeta = await import(`./${dir}/meta.json`);
                    const pageContent = (
                        await import(
                            `./${dir}/content/lang-${lang}/index.marko`
                        )
                    ).default;
                    const text = this.convert(pageContent.render().getOutput())
                        .replace(/\n/gm, " ")
                        .replace(/\s\s+/g, " ");
                    item.title = pageMeta.title[lang];
                    item.content = text;
                    item.language = lang;
                    data.push(item);
                } catch {
                    // Ignore
                }
            }
        }
        return data;
    }
}
