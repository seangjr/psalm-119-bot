import dotenv from "dotenv";
import moment from "moment-timezone";
import { Telegraf } from "telegraf";
import ESVAPI from "./esv.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN_DEV);
const esv = new ESVAPI(process.env.ESV_API_KEY);

/*
This bot will cover 1 verse per day of the Psalm 119 challenge, which is to read 1 verse of Psalm 119 per day for 176 days.

It will start from March 29, 2023 and end on September 20, 2023.
*/

// formatted date gmt +8
moment.tz.setDefault("Asia/Manila");
let date = moment().format("MMMM DD, YYYY @ h:mm A");

// Update the date every second
setInterval(() => {
    date = moment().format("MMMM DD, YYYY @ h:mm A");
}, 1000);

let reflection = [];
class Reflection {
    // everytime someone writes a reflection, it will be stored in a variable that resets every 24 hours. i want the instance to be shared across all users, so i made it a class

    constructor() {
        this.reflection = reflection;
    }

    addReflection = (text, ctx) => {
        // if the user has already written a reflection, it will replace the user's previous reflection
        if (reflection.some((ref) => ref.name === ctx.from.username)) {
            reflection = reflection.filter(
                (ref) => ref.name !== ctx.from.username,
            );
            // send a message that the user has updated their reflection
            ctx.replyWithHTML(
                `📖 Updated your reflection for today's verse to: <span class="tg-spoiler"><b>${text}</b></span>`,
            );
        } else {
            ctx.replyWithHTML(
                `📖 Added your reflection for today's verse: <span class="tg-spoiler"><b>${text}</b></span>`,
            );
        }
        reflection.push({
            name: ctx.from.username,
            text,
        });
    };

    getReflection() {
        // get the reflection for the day
        let reflectionStr = "";
        reflection.forEach((ref) => {
            reflectionStr += `<b>@${ref.name}</b>: ${ref.text}\n\n`;
        });
        return reflectionStr;
    }

    resetReflection(ctx) {
        reflection = [];
        ctx.replyWithHTML(`📖 <b>Reflections have been reset.</b>`);
    }

    async sendReflection(ctx) {
        const getReflectionStr = this.getReflection();
        if (getReflectionStr) {
            await ctx.replyWithHTML(
                `📖 <b>Reflection(s) for yesterday's verse</b>\n${getReflectionStr}`,
            );
        }
    }
}

const news = `<b>What's new on ${date}</b>❗\n\n- added A NEW feature: reflections. write a reflection for today's verse for it to be sent on the next day. hoping to see that this bot wont just help with convenience and keeping up with the challenge but also something that stimulates growth and intentionality. let's see what you guys have to say!`;

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

bot.command("donate", (ctx) => {
    ctx.reply(
        "🙏 Thank you for your support! You can donate here: https://www.buymeacoffee.com/seangjr",
    );
});

bot.command("paynow", (ctx) => {
    // reply with the paynow qr code
    ctx.replyWithPhoto(
        { source: "/public/paynow_qr.jpg" },
        {
            caption:
                "💸 You can also scan this PayNow QR to fund my future work!",
        },
    );
});

bot.command("reflection", async (ctx) => {
    const reflectionText = ctx.message.text.split(" ").slice(1).join(" ");
    if (!reflectionText) {
        await ctx.reply("Please enter a reflection! 😠");
        return;
    }

    const reflection = new Reflection();
    reflection.addReflection(reflectionText, ctx);
});

bot.command("getreflections", async (ctx) => {
    const reflection = new Reflection();
    reflection.sendReflection(ctx);
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
    const today10AM = moment().hour(10).minute(0).second(0);

    // If the current time is already past 10AM, schedule the job for tomorrow
    if (now.isAfter(today10AM)) {
        today10AM.add(1, "day");
    }

    const delay = today10AM.diff(now, "milliseconds");

    setTimeout(() => {
        sendVerseForToday(ctx);
        // reflection
        const reflection = new Reflection();
        new Promise((resolve, reject) => {
            reflection.sendReflection(ctx);
            resolve();
        })
            .then(() => {
                reflection.resetReflection(ctx);
            })
            .catch((err) => {
                console.log(err);
            });
        setInterval(() => {
            sendVerseForToday(ctx);
            // reflection
            const reflection = new Reflection();
            new Promise((resolve, reject) => {
                reflection.sendReflection(ctx);
                resolve();
            })
                .then(() => {
                    reflection.resetReflection(ctx);
                })
                .catch((err) => {
                    console.log(err);
                });
        }, 24 * 60 * 60 * 1000);
    }, delay);
}
bot.launch(console.log("Bot started!"));
bot.telegram.sendMessage("-1001965728464", news, { parse_mode: "HTML" });
