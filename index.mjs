import dotenv from "dotenv";
import moment from "moment";
import { Telegraf } from "telegraf";
import bible from "bible-english";
import ESVAPI from "./esv.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const esv = new ESVAPI(process.env.ESV_API_KEY);

/*
This bot will cover 1 verse per day of the Psalm 119 challenge, which is to read 1 verse of Psalm 119 per day for 176 days.

It will start from March 29, 2023 and end on September 20, 2023.
*/
bot.command("help", (ctx) => {
    ctx.replyWithHTML(
        `<b>To start, here's the list of the commands:</b>\n/start - Start the bot\n/verse - Get the verse for today`,
    );
});

bot.command("start", (ctx) => {
    ctx.replyWithHTML(
        `This bot will cover 1 verse per day of the Psalm 119 challenge, which is to read 1 verse of Psalm 119 per day for 176 days.\n\nIt will start from <b><u>March 29, 2023</u></b> and end on <b><u>September 20, 2023.</u></b>\n\n<i>Source code: <a>https://github.com/seangjr/psalm-119-bot</a></i>\n\n<b>To start, here's the list of the commands:</b>\n/start - Start the bot\n/verse - Get the verse for today`,
    );
    scheduleJob(ctx);
});

bot.command("debug", (ctx) => {
    ctx.reply(
        `Today is ${moment().format(
            "ddd, Do MMM, YYYY kk:mm",
        )}\n\n${moment().diff(
            moment("2023-03-29"),
            "days",
        )} days since start\n${moment("2023-09-20").diff(
            moment(),
            "days",
        )} days until end\n\n${
            moment().diff(moment("2023-03-29"), "days") + 1
        } verse number`,
    );
});

bot.command("verse", (ctx) => {
    const now = moment();
    const tenAM = moment().hour(10).minute(0).second(0);
    if (now.isSameOrAfter(tenAM)) {
        scheduleJob(ctx);
    } else {
        sendVerseForToday(ctx);
    }
});

bot.command("/esv", async (ctx) => {
    const now = moment();
    const tenAM = moment().hour(10).minute(0).second(0);
    const daysSinceStart = now.diff(moment("2023-03-29"), "days");
    const verseNumber = daysSinceStart + 1;

    if (now.isSameOrAfter(tenAM)) {
        esv.getVerse(`Psalm 119:${verseNumber}`, (err, data) => {
            if (err) ctx.reply(err.toString());
            const c = data.passages[0];
            ctx.replyWithHTML(
                `Today is <b>${date}</b>\n\n<b>Psalm 119:${verseNumber}</b>\n<i>${c.text}</i>`,
            );
        });
    }
});

async function sendVerseForToday(ctx) {
    const now = moment();
    const tenAM = moment().hour(10).minute(0).second(0);
    const daysSinceStart = now.diff(moment("2023-03-29"), "days");
    const daysUntil = moment("2023-09-20").diff(now, "days");
    const verseNumber = daysSinceStart + 1;

    if (now.isSameOrAfter(tenAM)) {
        await bible.getVerse(`Psalm 119:${verseNumber}`, (err, data) => {
            if (err) throw err;
            const c = data[0];
            bot.telegram.sendMessage(
                ctx.chat.id,
                `Today is <b>${date}</b>\n\n<b>Psalm 119:${verseNumber}</b>\n<i>${c.text}</i>`,
                { parse_mode: "HTML" },
            );
        });
    } else {
        bot.telegram.sendMessage(
            ctx.chat.id,
            `Today is <b>${date}</b>\n\n<b>Psalm 119:${verseNumber}</b>\n<i>Verse for today will be sent at 10AM</i>`,
            { parse_mode: "HTML" },
        );
    }

    if (daysUntil === 0) {
        bot.telegram.sendMessage(
            ctx.chat.id,
            `<b>Today is the last day of the challenge!</b>\n\n<i>Source code: <a>https://github.com/seangjr/psalm-119-bot</a></i>`,
            { parse_mode: "HTML" },
        );
    }
}

function scheduleJob(ctx) {
    const now = moment();
    const tenAM = moment().hour(10).minute(0).second(0);
    const delay = tenAM.diff(now, "milliseconds");

    setTimeout(() => {
        sendVerseForToday(ctx);
        setInterval(() => {
            sendVerseForToday(ctx);
        }, 24 * 60 * 60 * 1000);
    }, delay);
}

bot.launch(console.log("Bot is running"));
