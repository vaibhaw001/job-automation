# 🚀 RoleMatch AI (Job Automation Suite)

**Automate your job search with AI-powered job extraction, intelligent email drafting, and seamless application tracking**

![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)
![Flask](https://img.shields.io/badge/Flask-Backend-green.svg)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-Frontend-yellow.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ **What is RoleMatch AI?**

RoleMatch AI is a **powerful automation tool** that combines:
- A **Chrome Extension** to scrape job listings from multiple platforms
- A **Modern Web App** with AI-powered email drafting
- **Automated Application Tracking & Auth** securely stored in the cloud via Supabase

Perfect for job seekers who want to **save hours of manual work** while applying to multiple positions.

---

## 🎯 **Key Features**

### **🔍 Chrome Extension (Job Scanner)**
- **Multi-platform support**: Scrape jobs from LinkedIn, Internshala, Indeed, Naukri, or custom URLs
- **Auto-scrolling & background processing**: Loads more listings automatically
- **Customizable scan duration**: 30 seconds to 5 minutes
- **Auto-export**: Downloads scraped data as `.txt` files

### **🤖 Web App (RoleMatch AI)**
- **Supabase Authentication**: Secure user login/sign-up and session management natively using Supabase.
- **Supabase Cloud Database**: Stores your strictly managed sent-email telemetry using Row Level Security (RLS) keeping everyone’s application history private.
- **AI-powered job analysis**: Uses **OpenRouter** (and Google Gemini fallback) to extract key details and match roles.
- **Smart filtering**: Automatically detects valid emails and jobs.
- **Professional email drafting**: Generates polished application emails.
- **Resume attachment**: Send your resume with applications. Auto-converts images & documents to PDF.
- **One-click emailing**: Uses backend SMTP to dispatch emails directly to recruiters without opening an email client.

---

## 🛠️ **Tech Stack**

| Category       | Technologies Used                          |
|----------------|-------------------------------------------|
| **Backend**   | Python (Flask)                               |
| **Frontend** | HTML, CSS, Vanilla JavaScript                    |
| **Database & Auth** | Supabase (PostgreSQL)            |
| **AI Integration** | OpenRouter API / Google Gemini            |
| **Chrome Extension** | Manifest V3, JavaScript, HTML/CSS       |

**System Requirements:**
- Python 3.8+
- Node.js (for `npx supabase-cli` usage optionally)
- Chrome browser (for extension)

---

## 📦 **Installation**

### **Quick Start**

1. **Clone the repository**
   ```bash
   git clone https://github.com/vaibhaw001/job-automation.git
   cd job-automation
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: `venv\Scripts\activate`
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   Create a `.env` file containing your keys (API & Supabase configurations):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   GOOGLE_SERVICE_ACCOUNT_JSON=rolematch-ai-...json
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_jwt_key
   ```

4. **Install Chrome Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select `chrome-extension-v2`

---

## 🎯 **Usage**

### **1. Scrape Job Listings**
- Open the Chrome extension and select a platform
- Enter your search keyword and target scan duration
- Click **Start Scan** to begin scraping

### **2. Launch Local Servers**
Start the backend Python Flask server:
```bash
python server.py
```

### **3. Process Jobs in the Dashboard**
- Navigate to `localhost:5000` or open `ui/login.html` locally
- **Sign up / Sign in** using Supabase securely
- Upload the scraped `.txt` file, plug in your Gmail credentials, and upload your resume 
- Review jobs and hit **Send Email**

---

## 📁 **Project Structure**
```
job-automation/
├── ui/                         # Modern HTML/JS/CSS Web App 
│   ├── login.html              # Supabase Auth Login Component 
│   ├── jobs.html               # Main Dashboard Component
│   ├── login.js
│   ├── jobs.js
│   └── supabase_init.js        # Supabase connectivity
├── server.py                   # Flask API Backend
├── .env                        # Private configurations
├── requirements.txt            # Python dependencies
├── chrome-extension-v2/        # Chrome Extension Folder
└── README.md                   
```

---

## 🤝 **Contributing**

We welcome contributions! 

1. **Fork the repository** and create your branch:
   ```bash
   git checkout -b feature/your-feature
   ```
2. **Submit a pull request** with a clear description of changes.

---

## 📝 **License**
This project is licensed under the **MIT License** - see the `LICENSE` file for details.

---

## 👥 **Authors & Contributors**
👤 **Vaibhaw Upadhyay** - [LinkedIn](https://www.linkedin.com/in/vaibhaw-upadhyay-8aa4b31aa/)
