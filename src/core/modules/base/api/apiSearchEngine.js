import redisLanguages from "#lib/data/redis-languages.json";

export default () => ({
    async handler(req, rep) {
        try {
            let multipartData;
            try {
                multipartData = await req.processMultipart();
            } catch (e) {
                await req.removeMultipartTempFiles();
                return rep.error({
                    message: e.message,
                });
            }
            await req.removeMultipartTempFiles();
            let {
                // eslint-disable-next-line prefer-const
                query,
                language,
                limit,
                offset,
            } = multipartData.fields;
            if (!query || typeof query !== "string" || query.length > 128 || !language || typeof language !== "string" || Object.keys(this.languages).indexOf(language) < 0) {
                return rep.error({
                    message: "Invalid query",
                });
            }
            limit = typeof limit === "string" && limit.match(/^[0-9]{1,3}$/) ? limit : "10";
            offset = typeof offset === "string" && offset.match(/^[0-9]{1,6}$/) ? offset : "0";
            language = redisLanguages[language.split(/-/)[0]];
            const words = query
                .replace(/[`~!@#$%^&*()|+?;:'",.<>{}[\]\\/]/gi, "")
                .replace(/\s\s+/g, " ")
                .split(/ /)
                .map(i => `%${i}%`)
                .join(" ");
            let result = {};
            try {
                result = await this.redis.ft.search(`${this.systemConfig.id}-fulltext`, words, {
                    LANGUAGE: language,
                    SUMMARIZE: {
                        FIELDS: ["content"],
                    },
                    HIGHLIGHT: {
                        FIELDS: ["title", "content"],
                        TAGS: {
                            open: "<b>",
                            close: "</b>",
                        },
                    },
                    LIMIT: {
                        from: offset,
                        size: limit,
                    },
                });
            } catch {
                // Ignore
            }
            return rep.success(result);
        } catch (e) {
            await req.removeMultipartTempFiles();
            this.log.error(e);
            return Promise.reject(e);
        }
    }
});
