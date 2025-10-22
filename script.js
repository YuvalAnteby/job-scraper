require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');

const SEED_FIRST_RUN = false; // keep or set to false if you want first-run notifications

const apiKey = process.env.GOOGLE_API_KEY;
const cxKey = process.env.CX_KEY;

if (!apiKey || !cxKey) {
    console.error('Missing GOOGLE_API_KEY or CX_KEY in .env file');
    process.exit(1);
}

// Query pieces
const q = 'junior software developer Israel';
const exactTerms = 'junior';
const excludeTerms = [
    'Senior', 'Lead', 'Experienced', 'Manager', 'Architect', 'Principal', 'Mid', 'Mid-level', 'Midlevel',
    'Mid Level', 'Mid Senior', 'Mid-Senior', 'Team Lead', 'Director', 'Head', 'Tech Lead'
].join(',');

// Helper to build URL with proper params (exactTerms / excludeTerms are separate params)
function buildSearchUrl() {
    const params = new URLSearchParams({
        key: apiKey,
        cx: cxKey,
        q,
        exactTerms,
        //excludeTerms,
        gl: 'IL',
        //num: '10'
    });
    return `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
}

/**
 * Fetches jobs using the given params in the Google API
 * @returns {Promise<*|*[]>} list of the roles as an object made of title, link and snippet
 */
async function fetchJobs() {
    const url = buildSearchUrl();
    console.log('Google Custom Search URL:', url);
    const res = await fetch(url);
    console.log('Google API response status:', res.status, res.statusText);
    const text = await res.text();
    // Try to parse JSON if possible (some error responses may be JSON)
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = null;
    }
    if (!res.ok) {
        console.error('Non-OK response body:', text);
        throw new Error('Google API returned non-OK');
    }
    // log the summary so we can see totalResults and items count
    const totalResults = data?.searchInformation?.totalResults ?? 'unknown';
    const itemsCount = (data?.items || []).length;
    console.log('Google API summary - totalResults:', totalResults, 'itemsCount:', itemsCount);
    if (!data?.items || data.items.length === 0) return [];
    return data.items.map(i => ({
        link: i.link,
        title: i.title,
        snippet: i.snippet || ''
    }));
}

async function sendTelegram(text) {
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

// Helper function to add delay between messages
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkAndSend() {
    let oldLinks = [];
    const fileExists = fs.existsSync('jobs.json');
    // load previous jobs from jobs.json file, if it doesn't exist - create it.
    if (fileExists) {
        try {
            oldLinks = JSON.parse(fs.readFileSync('jobs.json', 'utf-8')) || [];
        } catch (e) {
            console.warn('Failed to parse jobs.json, using empty array.');
            oldLinks = [];
        }
    }

    // fetch new jobs
    const newJobs = await fetchJobs();
    console.log('Fetched jobs count:', newJobs.length);

    // TODO probably delete
    if (!fileExists && SEED_FIRST_RUN) {
        const newLinks = newJobs.map(j => j.link);
        fs.writeFileSync('jobs.json', JSON.stringify(newLinks, null, 2));
        console.log('jobs.json did not exist. Created it with current results (SEED_FIRST_RUN=true). No messages sent.');
        return;
    }

    // check differences - if none found will end here
    const newLinks = newJobs.map(j => j.link);
    const diff = newJobs.filter(j => !oldLinks.includes(j.link));
    console.log('New vs old counts:', newLinks.length, oldLinks.length, 'Diff count:', diff.length);
    if (diff.length <= 0) {
        console.log('No new jobs');
        return;
    }

// Send each new role as a separate message
    let successCount = 0;
    for (let i = 0; i < diff.length; i++) {
        const job = diff[i];
        const shortDesc = job.snippet.length > 150 ? job.snippet.slice(0, 150) + '...' : job.snippet;
        const text = `${i + 1}. ${job.title}\n\n${job.link}\n\n${shortDesc}`;

        try {
            await sendTelegram(text);
            successCount++;
            console.log(`Sent job ${i + 1}/${diff.length}: ${job.title}`);

            // Add a small delay between messages to avoid rate limiting
            if (i < diff.length - 1) await delay(1000); // 1 sec delay
        } catch (err) {
            console.error(`Failed sending job ${i + 1} to Telegram: `, err);
        }
    }

    // Update jobs.json after all messages are sent
    if (successCount > 0) {
        fs.writeFileSync('jobs.json', JSON.stringify(newLinks, null, 2));
        console.log(`Sent ${successCount}/${diff.length} jobs to Telegram and updated jobs.json`);
    }
}


checkAndSend()
    .then(() => console.log('=== Done! ==='))
    .catch(err => console.error('====== Fatal error ======\n', err));

// Run every hour
const MINUTES_INTERVAL = 60;
setInterval(checkAndSend, MINUTES_INTERVAL * 60 * 1000);
