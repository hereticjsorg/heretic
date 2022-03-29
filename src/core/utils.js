export default class {
    constructor(languages) {
        this.languages = languages;
    }

    getLanguageFromUrl(url) {
        let languageDetected = this.languages[0];
        const parts = url.split(/\//).filter(i => i);
        for (const language of this.languages) {
            if (parts[0] === language) {
                languageDetected = language;
                break;
            }
        }
        return languageDetected;
    }
}
