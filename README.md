# 🚀 Job Automation Suite

**Automate your job search with AI-powered job extraction, intelligent email drafting, and seamless application tracking**

![GitHub Stars](https://img.shields.io/github/stars/yourusername/job-automation?style=social)
![GitHub Forks](https://img.shields.io/github/forks/yourusername/job-automation?style=social)
![GitHub Issues](https://img.shields.io/github/issues/yourusername/job-automation)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.0%2B-green.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-v3.0-blue)

---

## ✨ What is Job Automation Suite?

Job Automation Suite is a **powerful, all-in-one solution** for job seekers who want to **eliminate manual work** from their job search process. This project combines:

- **Chrome Extension**: Scrape job listings from multiple platforms (LinkedIn, Internshala, Indeed, Naukri) with customizable scan durations
- **Web Application**: AI-powered job analysis, email drafting, and application tracking
- **Multi-format Resume Support**: Process PDFs, DOCX files, and images
- **Secure Cloud Storage**: Store all your job data and application history in Supabase

Perfect for **students, professionals, and recruiters** who want to **save hours of manual work** while applying to multiple positions.

---

## 🎯 Key Features

### 🔍 Chrome Extension (Job Scanner)
- **Multi-platform support**: Scrape jobs from LinkedIn, Internshala, Indeed, Naukri, or custom URLs
- **Auto-scrolling & background processing**: Loads more listings automatically
- **Customizable scan duration**: From 30 seconds to 5 minutes
- **Auto-export**: Downloads scraped data as `.txt` files
- **Custom URL support**: Scrape any job listing page
- **Background service worker**: Runs efficiently without consuming too many resources

### 🤖 Web App (RoleMatch AI)
- **Supabase Authentication**: Secure user login/sign-up and session management natively using Supabase.
- **Supabase Cloud Database**: Stores your strictly managed sent-email telemetry using Row Level Security (RLS) keeping everyone’s application history private.
- **Persistent Data**: Securely saves user credentials (API keys, Gmail app passwords) and uploaded files to prevent repetitive data entry.
- **AI-powered job analysis**: Uses **OpenRouter** (and Google Gemini fallback) with robust JSON parsing to extract key details and match roles.
- **Smart filtering**: Automatically detects valid emails and jobs.
- **Professional email drafting**: Generates polished application emails, strictly ensuring no job listings are missed.
- **Resume attachment**: Send your resume with applications reliably via Base64 encoding. Auto-converts images & documents to PDF.
- **One-click emailing**: Uses backend SMTP to dispatch emails directly to recruiters without opening an email client.
- **Serverless Ready**: Fully configured for seamless deployment on Vercel.

### 📊 Application Tracking
- **Real-time tracking**: Monitor your application status
- **Email analytics**: Track sent emails and responses
- **Secure storage**: All data stored in encrypted Supabase database

---

## 🛠️ Tech Stack

| Category       | Technologies Used                          |
|----------------|-------------------------------------------|
| **Frontend**   | HTML5, CSS3, Vanilla JavaScript, Supabase UI Components |
| **Backend**    | Python (Flask), Google Generative AI, OpenRouter API |
| **Database**   | Supabase (PostgreSQL) with Row Level Security |
| **Chrome Extension** | Manifest V3, Chrome Extensions API |
| **Email**      | SMTP, Email MIME, PDF/DOCX Processing |
| **AI**         | Google Gemini API, OpenRouter API |
| **Build**      | Vercel, Node.js, Python |

**System Requirements:**
- Python 3.8+
- Node.js (for `npx supabase-cli` usage)
- Chrome browser (for extension)
- Google Cloud account (for API keys)

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js](https://nodejs.org/)
- [Chrome Browser](https://www.google.com/chrome/)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/job-automation.git
   cd job-automation
   ```

2. **Set up environment variables:**
   - Create a `.env` file based on `.env.example`
   - Get your **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)
   - Set up a **Google Sheets Service Account** as described in `.env.example`

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Supabase:**
   ```bash
   npx supabase init
   ```
   Follow the prompts to set up your Supabase project.

5. **Run the application:**
   ```bash
   python server.py
   ```

6. **Install Chrome Extension:**
   - Navigate to `chrome-extension-v2` directory
   - Load the unpacked extension in Chrome:
     - Go to `chrome://extensions/`
     - Enable "Developer mode"
     - Click "Load unpacked" and select the `chrome-extension-v2` folder

---

## 🎯 Usage

### Basic Usage

#### Chrome Extension
1. Open the Chrome extension popup
2. Enter your job search keyword
3. Select a platform (LinkedIn, Internshala, Indeed, Naukri) or use a custom URL
4. Choose a scan duration (30s to 5m)
5. Click "Start Scan" to begin scraping job listings
6. After completion, download the `.txt` file containing all scraped jobs

#### Web Application
1. Access the web application at `http://localhost:5000`
2. Sign in or create an account using Supabase authentication
3. Upload your resume (PDF, DOCX, or image)
4. Upload your job scrape file (`.txt` from Chrome extension)
5. Analyze jobs using AI to extract key details
6. Draft and send application emails directly to recruiters

### Advanced Usage

#### Customizing Email Templates
1. Navigate to the settings panel in the web application
2. Edit your email template to include placeholders like `{job_title}`, `{company}`, etc.
3. Save the template for future use

#### Automating Email Sending
1. Configure your SMTP settings in the `.env` file
2. Set up your email credentials in the application settings
3. Use the one-click email feature to send applications directly

#### Advanced Job Analysis
1. Use the AI analysis to extract specific details from job postings
2. Filter jobs based on keywords, skills, or other criteria
3. Save frequently used filters for quick access

---

## 📁 Project Structure

```
job-automation/
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── README.md                   # Project documentation
├── requirements.txt            # Python dependencies
├── server.py                   # Flask backend server
├── vercel.json                 # Vercel deployment configuration
├── chrome-extension-v2/        # Chrome extension files
│   ├── background.js           # Background service worker
│   ├── manifest.json           # Extension manifest
│   ├── popup.html             # Extension popup UI
│   └── popup.js               # Extension popup logic
├── ui/                         # Web application UI
│   ├── jobs.html               # Job dashboard
│   ├── jobs.js                 # Job dashboard logic
│   ├── login.html              # Login page
│   ├── login.js                # Login logic
│   ├── upload.html             # File upload page
│   ├── upload.js               # File upload logic
│   └── supabase_init.js        # Supabase initialization
└── uploads/                    # File upload directory
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example` with the following variables:

```env
# Gemini API Key Configuration
GEMINI_API_KEY=your_actual_api_key_here

# Google Sheets – Service Account JSON key file
GOOGLE_SERVICE_ACCOUNT_JSON=service_account.json

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# SMTP Configuration
SMTP_SERVER=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Customizing the Chrome Extension

1. Modify `chrome-extension-v2/manifest.json` to change extension metadata
2. Update `chrome-extension-v2/popup.html` and `popup.js` to change UI and functionality
3. Add or remove platforms from the `SITES` object in `background.js`

### Customizing the Web Application

1. Edit CSS variables in the UI files to change the color scheme
2. Update the AI analysis logic in `jobs.js` to modify how jobs are processed
3. Modify the email template structure in the settings panel

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup

1. Fork the repository
2. Clone your fork locally
3. Install dependencies as described in the Installation section
4. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Code Style Guidelines

- Follow the existing code style in the repository
- Write clear, concise comments
- Use consistent naming conventions
- Keep functions and methods small and focused

### Pull Request Process

1. Write tests for your changes
2. Ensure all tests pass
3. Update the documentation if necessary
4. Submit a pull request with a clear description of your changes

---

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 👥 Authors & Contributors

**Maintainers:**
- [Your Name](https://github.com/yourusername) - Initial work and ongoing maintenance

**Contributors:**
- [Contributor Name](https://github.com/contributor) - Contributed feature X
- [Contributor Name](https://github.com/contributor) - Contributed feature Y

---

## 🐛 Issues & Support

### Reporting Issues

If you encounter any problems or have feature requests, please:
1. Check the [GitHub Issues](https://github.com/yourusername/job-automation/issues) for existing issues
2. Open a new issue with a clear description of the problem
3. Include steps to reproduce the issue and any relevant error messages

### Getting Help

- Join our [Discord Community](https://discord.gg/your-invite-link)
- Ask questions on the [GitHub Discussions](https://github.com/yourusername/job-automation/discussions)
- Check out our [FAQ](https://github.com/yourusername/job-automation/wiki/FAQ)

---

## 🗺️ Roadmap

### Planned Features

- **Multi-language support**: Add support for non-English job listings
- **Advanced AI analysis**: More sophisticated job matching and recommendation algorithms
- **Calendar integration**: Sync applications with Google Calendar
- **Mobile app**: iOS and Android applications
- **Team collaboration**: Allow multiple users to work on the same job board

### Known Issues

- Chrome extension may not work on all job platforms due to dynamic content loading
- Some PDFs may not be processed correctly due to complex layouts
- Email sending may be limited by SMTP provider restrictions

### Future Improvements

- Add more job platforms to the Chrome extension
- Implement a more sophisticated AI model for job analysis
- Add support for more file formats (PPTX, etc.)
- Improve the user interface with more animations and visual feedback

---

## 🚀 Get Started Today!

Ready to automate your job search? Follow the installation instructions and start saving hours of manual work today!

[![GitHub Stars](https://img.shields.io/github/stars/yourusername/job-automation?style=social)](https://github.com/yourusername/job-automation/stargazers)
[![GitHub Fork](https://img.shields.io/github/forks/yourusername/job-automation?style=social)](https://github.com/yourusername/job-automation/fork)

Join our community and help us make job searching easier for everyone!
