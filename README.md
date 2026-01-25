# 💼 RoleMatch AI – Job Automation Suite

An intelligent job hunting automation tool that combines a Chrome extension for multi-platform job scraping with a Streamlit-powered AI assistant for automated email applications.

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-1.0+-red.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20v3-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🌟 Features

### Chrome Extension - Job Scanner
- **Multi-Platform Support**: Scan jobs from LinkedIn, Internshala, Indeed, Naukri, or custom URLs
- **Background Scanning**: Runs in background while you use other tabs
- **Auto-Scroll**: Automatically scrolls pages to load more job listings
- **Configurable Duration**: Set scan time from 30 seconds to 5 minutes
- **Auto-Export**: Downloads scanned data as `.txt` file
- **Seamless Integration**: Auto-opens RoleMatch AI after scan completion

### Streamlit App - RoleMatch AI
- **AI-Powered Analysis**: Uses Google Gemini to extract job details from scraped text
- **Smart Filtering**: Filters jobs by location (India) and valid email addresses
- **Auto Email Drafting**: Generates professional application emails using AI
- **Resume Attachment**: Attach and send your resume with applications
- **Application Tracking**: Track all sent applications in CSV
- **Duplicate Prevention**: Automatically blocks duplicate applications

## 📁 Project Structure

```
jobauto/
├── jobauto.py              # Main Streamlit application
├── requirements.txt        # Python dependencies
├── job_tracker.csv         # Application tracking database
├── .env                    # Environment variables (API keys)
├── .streamlit/             # Streamlit configuration
└── chrome-extension-v2/    # Chrome Extension
    ├── manifest.json       # Extension manifest (v3)
    ├── popup.html          # Extension popup UI
    ├── popup.js            # Popup functionality
    ├── background.js       # Background service worker
    └── icons/              # Extension icons
```

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/jobauto.git
cd jobauto
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### 4. Install Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `chrome-extension-v2` folder

## 💻 Usage

### Step 1: Start the Streamlit App
```bash
streamlit run jobauto.py
```

### Step 2: Use the Chrome Extension
1. Click the Job Scanner extension icon
2. Select a platform from the dropdown (LinkedIn, Internshala, Indeed, Naukri)
3. Enter your job search keyword (e.g., "Python Developer")
4. Set the scan duration
5. Click **Start Scan**
6. The extension will:
   - Open the job site in the current tab
   - Auto-scroll to load more listings
   - Extract job data
   - Download results as a `.txt` file
   - Auto-open RoleMatch AI

### Step 3: Process Jobs in RoleMatch AI
1. Upload the downloaded `.txt` file (or it auto-loads from extension)
2. Click **Analyze with Gemini** to extract job details
3. Review extracted jobs and generated emails
4. Enter your Gmail credentials (App Password required)
5. Upload your resume (PDF)
6. Send applications!

## 📧 Gmail Setup

To send emails, you need a Gmail App Password:

1. Enable 2-Step Verification on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate a new App Password for "Mail"
4. Use this password in the app (not your regular Gmail password)

## ⚠️ Limitations

- Only jobs **located in India** are processed
- Jobs must contain a **valid apply email** to be considered
- Gmail allows ~100 emails/day (recommended: ≤50/day)
- Emails are sent one at a time to avoid spam detection
- Credentials are session-based only (not stored)

## 🛠️ Tech Stack

- **Frontend**: Streamlit, HTML/CSS/JavaScript
- **Backend**: Python 3.10+
- **AI**: Google Gemini API
- **Extension**: Chrome Manifest V3
- **Email**: SMTP (Gmail)
- **Storage**: Local CSV

## 📝 License

MIT License - feel free to use and modify!

## 👤 Author

**Vaibhaw Upadhyay**  
LinkedIn: https://www.linkedin.com/in/vaibhaw-upadhyay-8aa4b31aa//

---

⭐ If this project helped you, please give it a star!
