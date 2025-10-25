import 'dotenv/config';

/**
 * Send a given message to the telegram bot.
 * @param text will be sent to the bot, if length exceeds 4000 chars will cut the message.
 */
export default async function sendTelegram(text) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
        console.warn('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID; skipping Telegram send.');
        return;
    }
    let message = `*${text}`;
    if (message.length > 4000) message = message.slice(0, 3997) + '...';
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = {chat_id: chatId, text: message /*, parse_mode: 'Markdown' */};
    const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
        console.error('Telegram API returned error:', res.status, data);
        throw new Error('Telegram API error');
    }
}
