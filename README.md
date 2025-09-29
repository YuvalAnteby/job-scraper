# 🧠 Job Scraper - Real-Time Alerts from Company Sites

This Node.js script monitors job listings from company career pages and recruiting platforms using the **Google Custom Search API**, and alerts you **via email** the moment new jobs are posted.

Perfect if you're a student, junior developer, or job seeker who wants to be **faster than LinkedIn** and gain an edge.

---

## 🔍 What It Does

- Queries Google with a custom search like:  
  `("Software Developer" OR "Software Engineer") Israel`  
  while **excluding** senior roles like "Manager", "Team Lead", etc.
- Filters results, detects **new jobs**.
- Sends you an **email** with the new results.
- Repeats automatically every **30 minutes**.

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/OfekSagiv/job-scraper.git
cd job-scraper
npm install
```

---

## 🔐 2. Get a Google Custom Search API Key

### A. Create a Programmable Search Engine (CSE)

1. Go to: [https://programmablesearchengine.google.com/about/](https://programmablesearchengine.google.com/about/)
2. Click “Get started”
3. Under “Sites to search” - enter:
   ```
   *.greenhouse.io
   *.lever.co
   *.workable.com
   *.recruitee.com
   *.bamboohr.com
   careers.microsoft.com
   jobs.apple.com
   ```
   or every website of a company you wish to reach
4. Enable “Search the entire web” if you want broader results.
5. Save your **Search Engine ID (CX)**.

### B. Enable the Google Search API

1. Go to: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Create a project (or use an existing one)
3. Enable the **Custom Search API**
4. Go to **APIs & Services > Credentials** and click “Create API Key”
5. Save your **API Key**

---

## 📧 3. Set Up Email Notifications (Gmail)

To allow Node.js to send emails via Gmail:

### A. Enable 2-Step Verification on your Google account
- https://myaccount.google.com/security

### B. Create an App Password

1. Go to: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app, and **Other** for the device name (e.g. "JobScraper")
3. Click **Generate** - copy the password (you'll need it only once)

---

## 📝 4. Configure the Script

In the script, update at the end of the query the Search Engine ID (CX) and gmail password app:

```js
const API_URL = 'https://www.googleapis.com/customsearch/v1?q=("Software Developer" OR "Software Engineer") Israel&exactTerms=junior&excludeTerms=Senior,Lead,Experienced,Manager,Architect,Principal,Mid,Mid-level,Midlevel,"Mid Level","Mid Senior","Mid-Senior","Team Lead","Director","Head","Tech Lead"&gl=IL&cx=YOUR_CX&key=YOUR_API_KEY';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password' // from app passwords
    }
});
```

---

## 📁 5. Script Behavior

- Saves all previously seen job links to `jobs.json`
- Runs once on startup and then every 30 minutes (`setInterval`)
- Sends formatted email for every new job found

---

## 🧪 Example Output

**Email body:**

```
Found 3 new jobs:

1. Software Engineer – Papaya Global
https://jobs.lever.co/papaya-global/abc123
Join our engineering team...

2. Backend Intern – RapidAPI
https://boards.greenhouse.io/rapidapi/jobs/xyz456
Work with APIs at scale...
...
```

## 💡 Tips

- You can tweak the query in the `API_URL` to fit specific roles or locations.
- Add or remove exclusion terms to match your target level (e.g., keep `junior`, exclude `senior`)
- The script stays within **Google's free tier** for up to 100 queries/day.
- To get the best results, read about how to write effective queries for the [Google Search API](https://developers.google.com/custom-search/docs/overview#standard_search).


---

## 🤝 Contribution

Feel free to fork and customize for your use case.  
PRs and suggestions are welcome!

---

## 📫 Contact

Created by Ofek Sagiv - if this helped you, feel free to reach out or share!
