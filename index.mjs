import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import bible from "bible-english";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

/*
This bot will cover 1 verse per day of the Psalm 119 challenge, which is to read 1 verse of Psalm 119 per day for 176 days.

It will start from March 29, 2023 and end on September 20, 2023.
*/

let verse = 28;
const chapter = 119;
const book = "psalm";

// formatted date
const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
});

bot.start((ctx) => {
    ctx.replyWithHTML(
        `<b>Psalm 119 Buddy</b>\n\nThis bot will cover 1 verse per day of the Psalm 119 challenge, which is to read 1 verse of Psalm 119 per day for 176 days.\n\nIt will start from <b><u>March 29, 2023</u></b> and end on <b><u>September 20, 2023.</u></b>\n\n<i>Source code: <a>https://github.com/seangjr/psalm-119-bot</a></i>`,
    );
});

verseToSend();

// send a message every 24 hours
setInterval(() => {
    verseToSend();
}, 24 * 60 * 60 * 1000);

bot.launch(console.log("Bot is running"));

function verseToSend() {
    if (verse > 176) {
        verse = 1;
    }
    bible.getVerse(`${book} ${chapter}:${verse}`, (err, data) => {
        if (err) throw err;
        const c = data[0];
        bot.telegram.sendMessage(
            process.env.CHAT_ID,
            `Today is ${date}. Let's read together!\n\n<b>${c.bookname} ${c.chapter}:${c.verse}</b>\n${c.text}\n\n<i>Do share what you've taken away from reading this word too!</i>`,
            { parse_mode: "HTML" },
        );
    });
    verse++;
}
