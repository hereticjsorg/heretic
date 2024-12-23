import { SchemaFieldTypes } from "redis";
import redisLanguages from "#lib/data/redis-languages.json";

export default class {
    constructor(fastify) {
        this.fastify = fastify;
    }

    getFullLanguage(lang) {
        return redisLanguages[lang.split(/-/)[0]];
    }

    processContent(blocks) {
        let content = "";
        for (const block of blocks) {
            switch (block.type) {
                case "paragraph":
                case "header":
                case "quote":
                    content += `${block.data.text} `;
                    break;
                case "list":
                    if (block.data.items && Array.isArray(block.data.items)) {
                        for (const listItem of block.data.items) {
                            content += `${listItem} `;
                        }
                    }
                    break;
                case "table":
                    if (block.data.content && Array.isArray(block.data.content)) {
                        for (const row of block.data.content) {
                            for (const col of row) {
                                content += `${col} `;
                            }
                        }
                    }
                    break;
                case "rawTool":
                    content += this.htmlToText(block.data.html);
                    break;
                case "warning":
                    content += `${block.data.title} ${block.data.message} `;
                    break;
            }
        }
        return content.trim();
    }

    async setSearchIndex(id, data) {
        if (
            !this.fastify.systemConfig.redis ||
            !this.fastify.systemConfig.redis.enabled ||
            !this.fastify.systemConfig.redis.stack
        ) {
            return;
        }
        let currentIndex;
        try {
            currentIndex = await this.fastify.redis.ft.info(
                `idx:${this.fastify.systemConfig.id}_fulltext`,
            );
        } catch {
            //
        }
        if (!currentIndex) {
            try {
                await this.fastify.redis.ft.create(
                    `${this.fastify.systemConfig.id}-fulltext`,
                    {
                        route: SchemaFieldTypes.TEXT,
                        url: SchemaFieldTypes.TEXT,
                        language: SchemaFieldTypes.TEXT,
                        title: SchemaFieldTypes.TEXT,
                        content: SchemaFieldTypes.TEXT,
                    },
                    {
                        ON: "HASH",
                        PREFIX: `${this.fastify.systemConfig.id}-fulltext`,
                        LANGUAGE_FIELD: "language",
                    },
                );
            } catch {
                //
            }
        }
        await this.fastify.redis.hSet(
            `${this.fastify.systemConfig.id}-fulltext:${id}`,
            data,
        );
    }

    async delSearchIndex(id) {
        if (
            !this.fastify.systemConfig.redis ||
            !this.fastify.systemConfig.redis.enabled ||
            !this.fastify.systemConfig.redis.stack
        ) {
            return;
        }
        await this.fastify.redis.hDel(
            `${this.fastify.systemConfig.id}-fulltext:${id}`
        );
    }
}
