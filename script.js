import 'dotenv/config';
import fs from 'fs';

import sendTelegram from './TelegramBot.js';
import {DATE_RESTRICT, exactTerms, JOB_SITES, query} from "./ScrapingParams.js";


const apiKey = process.env.GOOGLE_API_KEY;
const cxKey = process.env.CX_KEY;

if (!apiKey || !cxKey) {
    console.error('Missing GOOGLE_API_KEY or CX_KEY in .env file');
    process.exit(1);
}


// Helper to build URL with proper params (exactTerms / excludeTerms are separate params)
function buildSearchUrl(start = 1) {
    const sitesFragment = JOB_SITES.map(s => `site:${s}`).join(' OR ');
    // base query: job title OR synonyms and required keyword(s)
    const baseQuery = `${query} ${exactTerms} ${sitesFragment}`;

    const params = new URLSearchParams({
        key: apiKey,
        cx: cxKey,
        q: baseQuery,
        //exactTerms,
        //excludeTerms.join(' '),
        gl: 'IL', // geolocation hint
        cr: 'countryIL', // country restrict
        dateRestrict: DATE_RESTRICT || undefined,
        num: '10',
        start: String(start)
    });
    return `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
}

// normalize URL for stable dedupe (strip common tracking params)
function normalizeUrl(raw) {
    try {
        const u = new URL(raw);
        // Remove common tracking UTM params and others
        const remove = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','fbclid','gclid','trk','trkSite'];
        for (const p of remove) u.searchParams.delete(p);
        // If page is index-like, remove trailing slash for canonical
        let pathname = u.pathname.replace(/\/+$/, '');
        // Some job pages use different host forms (www.), keep hostname as-is
        return `${u.protocol}//${u.hostname}${pathname}${u.search ? '?' + u.searchParams.toString() : ''}`;
    } catch (e) {
        // fallback
        return raw;
    }
}

/**
 * Fetches jobs using the given params in the Google API
 * @returns {Promise<*|*[]>} list of the roles as an object made of title, link and snippet
 */
async function fetchJobs({maxPages = 3, pageDelayMs = 400} = {}) {
    const seen = new Set();
    const results = [];

    for (let page = 0; page < maxPages; page++) {
        const start = 1 + page * 10; // CSE start param is 1-based
        const url = buildSearchUrl(start);
        console.log('Google Custom Search URL:', url);
        const res = await fetch(url);
        console.log('Google API status:', res.status, res.statusText);
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = null;
        }
        if (!res.ok) {
            console.error('Google API non-OK:', text);
            break;
        }
        const items = data?.items || [];
        if (items.length === 0) {
            console.log('No items on this page, stopping pagination.');
            break;
        }

        for (const i of items) {
            const normalized = normalizeUrl(i.link || i.displayLink || i.formattedUrl || '');
            if (!normalized) continue;
            if (seen.has(normalized)) continue;
            seen.add(normalized);
            results.push({
                link: i.link,
                normalized,
                title: i.title,
                snippet: i.snippet || ''
            });
        }

        // small delay before next page to be polite and avoid quotas
        if (page < maxPages - 1) await new Promise(r => setTimeout(r, pageDelayMs));
    }

    console.log('fetchJobs: total unique items collected:', results.length);
    return results;
}


// Helper function to add delay between messages
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * loads previous jobs from jobs.json file, if it doesn't exist - creates it and returns empty array.
 */
function fetchOldLinks() {
    const fileExists = fs.existsSync('jobs.json');
    if (fileExists) {
        try {
            return JSON.parse(fs.readFileSync('jobs.json', 'utf-8')) || [];
        } catch (e) {
            console.warn('Failed to parse jobs.json, using empty array.');
            return [];
        }
    }
}

async function checkAndSend() {
    let oldLinks = fetchOldLinks() || [];

    // fetch new jobs
    const newJobs = await fetchJobs();
    console.log('Fetched jobs count:', newJobs.length);

    // check differences - if none found will end here
    const newLinks = newJobs.map(j => j.link);
    const diff = newJobs.filter(j => !oldLinks.includes(j.link));
    console.log('New vs old counts:', newLinks.length, oldLinks.length, 'Diff count:', diff.length);
    if (diff.length <= 0) {
        console.log('====== No new jobs ======');
        return;
    }

    // Send each new role as a separate message
    let successCount = 0;
    for (let i = 0; i < diff.length; i++) {
        const job = diff[i];
        const shortDesc = job.snippet.length > 500 ? job.snippet.slice(0, 500) + '...' : job.snippet;
        const text = `**${job.title}**\n\n${job.link}\n\n${shortDesc}`;

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
        const diffLinks = diff.map(j => j.link);
        const updatedLinks = Array.from(new Set([...oldLinks, ...diffLinks]));

        fs.writeFileSync('jobs.json', JSON.stringify(updatedLinks, null, 2));
        console.log(`Sent ${successCount}/${diff.length} jobs to Telegram and updated jobs.json`);
    }
}


checkAndSend()
    .then(() => console.log('====== Done! ======'))
    .catch(err => console.error('====== Fatal error ======\n', err));

// Run every hour
const MINUTES_INTERVAL = 2;
//const MINUTES_INTERVAL = 60;
setInterval(checkAndSend, MINUTES_INTERVAL * 60 * 1000);
