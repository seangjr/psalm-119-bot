const fetch = require("node-fetch");

class ESVAPI {
    constructor(apiKey) {
        this.baseUrl = "https://api.esv.org/v3/passage/text/";
        this.apiKey = apiKey;
    }

    async getPassage(query) {
        const url = new URL(this.baseUrl);
        url.searchParams.set("q", query);
        url.searchParams.set("include-footnotes", false);
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${this.apiKey}`,
            },
        });
        const json = await response.json();
        return json;
    }
}

module.exports = ESVAPI;
