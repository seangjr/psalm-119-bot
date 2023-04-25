const https = require("https");

const API_BASE_URL = "https://api.esv.org/v3";

class ESVAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    request(endpoint, options = {}) {
        const queryStr = Object.entries(options)
            .map(
                ([key, value]) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
            )
            .join("&");
        const url = `${API_BASE_URL}/${endpoint}?${queryStr}`;

        return new Promise((resolve, reject) => {
            const req = http.request(
                url,
                {
                    headers: {
                        Authorization: `Token ${this.apiKey}`,
                    },
                },
                (res) => {
                    // reject on bad status
                    let body = "";
                    res.setEncoding("utf8");
                    res.on("data", (chunk) => (body += chunk)); // we need to get the whole response, so we append to the body
                    res.on("end", () => {
                        const result = JSON.parse(body);
                        if (res.statusCode === 200) {
                            resolve(result);
                        } else {
                            reject(
                                new Error(
                                    `Request failed: ${res.statusCode} ${res.statusMessage}`,
                                ),
                            );
                        }
                    });
                },
            );

            req.on("error", (err) => reject(err));

            req.end();
        });
    }

    getPassage(passage, options = {}) {
        return this.request("passage/text", {
            ...options,
            q: passage,
        });
    }

    getVerse(verse, options = {}) {
        return this.getPassage(`${verse}`, options);
    }
}

module.exports = ESVAPI;
