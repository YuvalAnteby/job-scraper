const fs = require('fs');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const API_URL = 'https://www.googleapis.com/customsearch/v1?q=("Software Developer" OR "Software Engineer") Israel&exactTerms=junior&excludeTerms=Senior,Lead,Experienced,Manager,Architect,Principal,Mid,Mid-level,Midlevel,"Mid Level","Mid Senior","Mid-Senior","Team Lead","Director","Head","Tech Lead"l&gl=IL&cx=YOUR_CX&key=YOUR_GOOGLE_API_KEY';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'yourmail@gmail.com',
        pass: 'yourpasswordhere'
    }
});

async function sendEmail(subject, text) {
    await transporter.sendMail({
        from: 'yourmail@gmail.com',
        to: 'yourmail@gmail.com',
        subject,
        text
    });
}

async function fetchJobs() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const items = data.items || [];
    return items.map(i => ({
        link: i.link,
        title: i.title,
        snippet: i.snippet
    }));
}

async function checkAndSend() {
    let oldLinks = [];
    if (fs.existsSync('jobs.json')) {
        oldLinks = JSON.parse(fs.readFileSync('jobs.json', 'utf-8'));
    }

    const newJobs = await fetchJobs();
    const newLinks = newJobs.map(j => j.link);
    const diff = newJobs.filter(j => !oldLinks.includes(j.link));

    if (diff.length > 0) {
        const formattedLinks = diff.map((job, idx) => {
            const shortDesc = job.snippet.length > 40
                ? job.snippet.slice(0, 80) + '...'
                : job.snippet;
            return `${idx + 1}. ${job.title}\n${job.link}\n${shortDesc}`;
        }).join('\n\n');

        await sendEmail(
            'New Job Postings',
            `Found ${diff.length} new jobs:\n\n${formattedLinks}`
        );

        fs.writeFileSync('jobs.json', JSON.stringify(newLinks, null, 2));
        console.log(`Sent email with ${diff.length} new jobs`);
    } else {
        console.log('No new jobs');
    }
}

checkAndSend();
setInterval(checkAndSend, 30 * 60 * 1000);
