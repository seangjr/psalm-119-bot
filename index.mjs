import dotenv from "dotenv";
import moment from "moment-timezone";
import { Telegraf } from "telegraf";
import ESVAPI from "./esv.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const esv = new ESVAPI(process.env.ESV_API_KEY);

/*
This bot will cover 1 verse per day of the Psalm 119 challenge, which is to read 1 verse of Psalm 119 per day for 176 days.

It will start from March 29, 2023 and end on September 20, 2023.
*/

// formatted date gmt +8
moment.tz.setDefault("Asia/Manila");
const date = moment().format("MMMM DD, YYYY @ h:mm A");

const news = `<b>What's new on ${date}</b>❗\n\n- Fixed scheduling issues, now added a new command to schedule it instead of start\n- Added a /report command to report bugs or issues\n- Added a /daysleft command`;

bot.command("help", (ctx) => {
    ctx.replyWithHTML(
        `<b>To start, here's the list of the commands:</b>\n/start - Start the bot\n/verse - Get the verse for today\n/schedule - Schedule the verse to be sent at 10AM daily\n/news - Get the latest news about the bot\n/daysleft - Get the number of days left to complete the challenge\n/report - Report bugs or issues. <i>Usage: /report [message]</i>\n/group - Join the announcement group for this bot to receive updates`,
    );
});

bot.start((ctx) => {
    ctx.replyWithHTML(
        `This bot will cover 1 verse per day of the Psalm 119 challenge, which is to read 1 verse of Psalm 119 per day for 176 days.\n\nIt will start from <b><u>March 29, 2023</u></b> and end on <b><u>September 20, 2023.</u></b>The verse will be sent at <b>10AM</b> daily.\n\n🖥️ <i>Source code: <a>https://github.com/seangjr/psalm-119-bot</a></i>\n\n<b>To start, here's the list of the commands:</b>\n/start - Start the bot\n/verse - Get the verse for today\n/schedule - Schedule the verse to be sent at 10AM daily\n/news - Get the latest news about the bot\n\n<b>Note:</b> this bot is still in development, so expect some bugs. Contact @lilricefield if you have any questions or suggestions, alternatively join the group link down below!\n/report to report bugs or issues. Thank you!\n\nIf you would like to join the announcement group for this bot to receive updates and give suggestions, click here: https://t.me/+98vqICnSRQE0MDU1`,
    );
});

bot.command("news", (ctx) => {
    ctx.replyWithHTML(news);
});

bot.command("verse", (ctx) => {
    sendVerseForToday(ctx);
});

bot.command("schedule", (ctx) => {
    ctx.reply("📅 Scheduling the verse to be sent at 10AM daily!");
    scheduleJob(ctx);
});

bot.command("daysleft", (ctx) => {
    const now = moment();
    const daysUntil = moment("2023-09-20").diff(now, "days");
    ctx.replyWithHTML(
        `You have 📆 <b>${daysUntil}</b> days left to complete the challenge! Press on!`,
    );
});

bot.command("report", async (ctx) => {
    const reportMessage = ctx.message.text.split(" ").slice(1).join(" ");
    if (!reportMessage) {
        await ctx.reply("Please enter a message! 😠");
        return;
    }

    await ctx.telegram.forwardMessage(
        "5005274603",
        ctx.message.chat.id,
        ctx.message.message_id,
    );
    await ctx.telegram.sendMessage(
        "5005274603",
        `Report from ${ctx.message.from.first_name}:\n\n${reportMessage}`,
    );

    await ctx.reply("📩 Your report has been sent! Thank you!");
});

bot.command("group", (ctx) => {
    ctx.reply(
        "🌏 Join the announcement group for this bot to receive updates: https://t.me/+98vqICnSRQE0MDU1",
    );
});

async function sendVerseForToday(ctx) {
    const now = moment();
    const tenAM = moment().hour(10).minute(0).second(0);
    const daysSinceStart = now.diff(moment("2023-03-29"), "days");
    const daysUntil = moment("2023-09-20").diff(now, "days");
    const verseNumber = daysSinceStart + 1;

    if (now.isSameOrAfter(tenAM)) {
        await esv.getPassage(`Psalm 119:${verseNumber}`).then((data) => {
            const text = data.passages[0];
            const elements = text.split("\n");
            const verse = elements[0];
            // the verse text is the elements after the first element joined
            const verseText = elements.slice(1).join("\n");
            ctx.replyWithHTML(
                `📅 <b><u>${date}</u></b>\n\n<b>${verse}</b>\n${verseText}\n\n📍<i>Source: <a>https://www.esv.org/Psalm 119:${verseNumber}</a></i>`,
                { parse_mode: "HTML" },
            );
        });
    } else {
        bot.telegram.sendMessage(
            ctx.chat.id,
            `📅 <b><u>${date}</u></b>\n\n<b>Psalm 119:${verseNumber}</b>\n<i>Verse for today will be sent at 10AM</i>`,
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

bot.launch(console.log("Bot started!"));
bot.telegram.sendMessage("-901315742", news, { parse_mode: "HTML" });
