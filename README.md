```markdown
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

Job Automation Suite is a **powerful job search automation tool** that combines:
- **Chrome Extension** for scraping job listings from multiple platforms
- **Modern Web Application** with AI-powered email drafting
- **Automated Application Tracking** with secure cloud storage via Supabase
- **Resume Processing** with support for multiple file formats

Perfect for job seekers who want to **save hours of manual work** while applying to multiple positions.

---

## 🎯 Key Features

### 🔍 Chrome Extension (Job Scanner)
- **Multi-platform support**: Scrape jobs from LinkedIn, Internshala, Indeed, Naukri, or custom URLs
- **Auto-scrolling & background processing**: Loads more listings automatically
- **Customizable scan duration**: 30 seconds to 5 minutes
- **Auto-export**: Downloads scraped data as `.txt` files
- **Custom URL support**: Scrape any job listing page

### 🤖 Web Application
- **Supabase Authentication**: Secure user login/sign-up and session management
- **AI-powered job analysis**: Uses **Google Gemini** (or OpenRouter fallback) to extract key details
- **Smart filtering**: Automatically detects valid emails and jobs
- **Professional email drafting**: Generates polished application emails
- **Resume attachment**: Send your resume with applications (supports PDF, DOCX, images)
- **One-click emailing**: Uses backend SMTP to dispatch emails directly to recruiters

### 📊 Application Tracking
- **Real-time tracking**: Monitor your application status
- **Email analytics**: Track sent emails and responses
- **Secure storage**: All data stored in encrypted Supabase database

---

## 🛠️ Tech Stack

| Category       | Technologies Used                          |
|----------------|-------------------------------------------|
| **Frontend**   | HTML5, CSS3, Vanilla JavaScript, Supabase UI Components |
| **Backend**   | Python (Flask), Google Generative AI, OpenRouter API |
| **Database**  | Supabase (PostgreSQL) with Row Level Security |
| **Chrome Extension** | Manifest V3, Chrome Extensions API |
| **Email**     | SMTP, Email MIME, PDF/DOCX Processing |
| **AI**        | Google Gemini API, OpenRouter API |

**System Requirements:**
- Python 3.8+
- Node.js (for `npx supabase-cli` usage)
- Chrome browser (for extension)
- Google Cloud account (for API keys)

---

## 📦 Installation

### Prerequisites

1. **Python Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: `venv\Scripts\activate`
   ```

2. **Node.js**:
   Download and install from [Node.js official website](https://nodejs.org/)

3. **Google Cloud Setup**:
   - Create a project at [Google Cloud Console](https://console.cloud.google.com)
   - Enable "Google Sheets API" and "Google Drive API"
   - Create a Service Account and download the JSON key

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/job-automation.git
   cd job-automation
   ```

2. **Set up environment variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your API keys and paths:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   GOOGLE_SERVICE_ACCOUNT_JSON=path/to/your/service_account.json
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Supabase**:
   ```bash
   npx supabase init
   ```
   Follow the prompts to set up your Supabase project.

5. **Run the application**:
   ```bash
   python server.py
   ```

6. **Install Chrome Extension**:
   - Go to `chrome-extension-v2` directory
   - Load the unpacked extension in Chrome:
     - Go to `chrome://extensions`
     - Enable "Developer mode"
     - Click "Load unpacked" and select the `chrome-extension-v2` directory

---

## 🎯 Usage

### Basic Usage with Chrome Extension

1. **Open the extension popup**:
   - Click the extension icon in your Chrome toolbar

2. **Configure your scan**:
   - Select a platform (LinkedIn, Internshala, Indeed, Naukri)
   - Enter your job keyword
   - Choose scan duration (30s to 5m)
   - Click "Start Scan"

3. **Review and export results**:
   - The extension will automatically download scraped job listings to your `uploads` directory

### Web Application Usage

1. **Access the dashboard**:
   - Open `http://localhost:5000` in your browser
   - Log in or sign up using Supabase authentication

2. **Upload your resume**:
   - Navigate to the Upload page
   - Drag and drop your resume (PDF, DOCX, or image)
   - The system will process and store your resume

3. **Upload job listings**:
   - Drag and drop your `.txt` files from the Chrome extension
   - The system will parse and display the job listings

4. **Analyze and apply**:
   - Use the AI to analyze job descriptions
   - Generate personalized email drafts
   - Send applications with one click

---

## 📁 Project Structure

```
job-automation/
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── chrome-extension-v2/          # Chrome extension files
│   ├── background.js             # Background service worker
│   ├── manifest.json             # Extension manifest
│   ├── popup.html                # Extension popup UI
│   └── popup.js                  # Extension popup logic
├── requirements.txt              # Python dependencies
├── server.py                     # Flask backend server
├── vercel.json                   # Vercel deployment config
├── ui/                           # Web application UI
│   ├── jobs.html                 # Main jobs dashboard
│   ├── jobs.js                   # Jobs dashboard logic
│   ├── login.html                # Login page
│   ├── login.js                  # Login logic
│   ├── upload.html               # Upload page
│   ├── upload.js                 # Upload logic
│   └── supabase_init.js          # Supabase initialization
└── README.md                     # This file
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```
# Gemini API Key Configuration
GEMINI_API_KEY=your_actual_api_key_here

# Google Sheets – Service Account JSON key file
GOOGLE_SERVICE_ACCOUNT_JSON=path/to/your/service_account.json

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### Customization Options

1. **Chrome Extension**:
   - Modify `manifest.json` to change extension name, version, and permissions
   - Update `popup.html` and `popup.js` to change UI/UX

2. **Web Application**:
   - Edit CSS in UI files to change the theme and styling
   - Update `server.py` to modify backend logic and API endpoints

3. **AI Configuration**:
   - Change the AI provider by modifying the API calls in `server.py`
   - Adjust the AI prompts in the email drafting logic

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### How to Contribute

1. **Fork the repository**:
   ```bash
   git clone https://github.com/yourusername/job-automation.git
   cd job-automation
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**:
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation

4. **Commit your changes**:
   ```bash
   git commit -m "Add your descriptive commit message"
   ```

5. **Push to the branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**:
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch and submit

### Development Setup

1. **Set up your development environment**:
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt

   # Install Node.js dependencies (if needed)
   npm install
   ```

2. **Run the development server**:
   ```bash
   python server.py
   ```

3. **Test the Chrome extension**:
   - Load the unpacked extension in Chrome
   - Test all functionality thoroughly

### Code Style Guidelines

- Follow **PEP 8** guidelines for Python code
- Use **consistent indentation** (4 spaces)
- Write **clear, concise comments**
- Use **meaningful variable and function names**
- Keep functions **small and focused**

---

## 📝 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for more details.

---

## 👥 Authors & Contributors

**Maintainers**:
- [Your Name](https://github.com/yourusername) - Initial work and ongoing development

**Contributors**:
- [Contributor Name](https://github.com/contributorusername) - [Contribution Description]

---

## 🐛 Issues & Support

### Reporting Issues

If you encounter any problems or have feature requests, please:

1. **Check existing issues** to avoid duplicates
2. **Open a new issue** with:
   - Clear description of the problem
   - Steps to reproduce
   - Screenshots or error logs (if applicable)
   - Your environment details (Python version, Chrome version, etc.)

### Getting Help

- **Discussions**: Join our [GitHub Discussions](https://github.com/yourusername/job-automation/discussions)
- **Community**: Ask questions in the [#job-automation](https://discord.gg/your-server) Discord channel
- **Email**: For urgent support, contact support@jobautomation.com

### FAQ

**Q: How secure is my data?**
A: All user data is stored in Supabase with Row Level Security (RLS) to ensure privacy. We never share your data with third parties.

**Q: Can I use this for commercial purposes?**
A: Yes! This project is licensed under MIT, allowing both personal and commercial use.

**Q: Does it work with international job sites?**
A: Currently, we support LinkedIn, Internshala, Indeed, and Naukri. We welcome contributions to add more platforms!

---

## 🗺️ Roadmap

### Planned Features

1. **Enhanced AI Analysis**:
   - Better job matching algorithms
   - Improved email drafting with more templates

2. **Additional Job Platforms**:
   - Glassdoor
   - AngelList
   - Company-specific career pages

3. **Advanced Tracking**:
   - Application status updates from recruiters
   - Interview scheduling integration

4. **Mobile Application**:
   - Cross-platform mobile app (React Native/Flutter)

5. **Team Collaboration**:
   - Shared job boards for teams
   - Team application tracking

### Known Issues

- **Chrome Extension**: Some job sites may block scraping attempts (workaround: use custom URLs)
- **AI Analysis**: Occasionally may miss key details in job descriptions (improving with more training data)
- **Email Delivery**: Some email providers may flag automated messages (use proper SMTP settings)

### Future Improvements

- **Performance Optimization**: Reduce loading times for large job lists
- **User Feedback**: Implement a system for users to provide feedback on AI suggestions
- **Localization**: Add support for multiple languages
- **Advanced Analytics**: Provide insights on application success rates

---

## 🚀 Getting Started Today

Ready to automate your job search? Follow these simple steps:

1. **Install the Chrome Extension**
2. **Set up your environment** with the provided instructions
3. **Start scraping job listings**
4. **Upload to the web application**
5. **Send automated applications**

Join our growing community of job seekers who are saving hours every day with Job Automation Suite!

👉 [Star this repository](https://github.com/yourusername/job-automation/stargazers) to show your support!
```
