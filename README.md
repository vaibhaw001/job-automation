# 🚀 Job Automation Suite

**Automate your job search with AI-powered LinkedIn scraping, intelligent email drafting, and seamless application tracking**

![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-1.25%2B-blue.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-v3-green.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Stars](https://img.shields.io/github/stars/vaibhaw001/job-automation?style=flat)
![Forks](https://img.shields.io/github/forks/vaibhaw001/job-automation?style=flat)

---

## ✨ **What is Job Automation Suite?**

Job Automation Suite is a **powerful Python-based tool** that combines:
- A **Chrome extension** to scrape job listings from multiple platforms
- A **Streamlit web app** with AI-powered email drafting
- **Automated application tracking** with local CSV storage

Perfect for job seekers who want to **save hours of manual work** while applying to multiple positions.

---

## 🎯 **Key Features**

### **🔍 Chrome Extension (Job Scanner)**
- **Multi-platform support**: Scrape jobs from LinkedIn, Internshala, Indeed, Naukri, or custom URLs
- **Auto-scrolling & background processing**: Loads more listings automatically
- **Customizable scan duration**: 30 seconds to 5 minutes
- **Auto-export**: Downloads scraped data as `.txt` files
- **Seamless integration**: Auto-opens the Streamlit app after scanning

### **🤖 Streamlit App (RoleMatch AI)**
- **AI-powered job analysis**: Uses Google Gemini to extract key details
- **Smart filtering**: Automatically detects valid emails and India-based jobs
- **Professional email drafting**: Generates polished application emails
- **Resume attachment**: Send your resume with applications
- **Application tracking**: Logs all sent emails in a CSV file
- **Duplicate prevention**: Blocks repeated applications

---

## 🛠️ **Tech Stack**

| Category       | Technologies Used                          |
|----------------|-------------------------------------------|
| **Language**   | Python 3.8+                                |
| **Web Framework** | Streamlit 1.25+                          |
| **AI Integration** | Google Generative AI (Gemini)            |
| **Chrome Extension** | Manifest V3, JavaScript, HTML/CSS       |
| **Dependencies** | Pandas, Python-dotenv, PyPDF2           |

**System Requirements:**
- Python 3.8+
- Chrome browser (for extension)
- Google Gemini API key (free tier available)

---

## 📦 **Installation**

### **Prerequisites**
- Python 3.8+
- Chrome browser
- Google account (for Gemini API)

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
   Create a `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

4. **Install Chrome Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select `chrome-extension-v2`

---

## 🎯 **Usage**

### **1. Scrape Job Listings**
- Open the Chrome extension and select a platform (LinkedIn, Internshala, etc.)
- Enter your search keyword and scan duration
- Click **Start Scan** to begin scraping

### **2. Process Jobs in Streamlit App**
```bash
streamlit run jobauto.py
```
- Upload the `.txt` file from the Chrome extension
- Enter your Gmail credentials (for sending emails)
- Upload your resume (PDF)
- Click **Analyze TXT with Gemini** to extract jobs
- Review and send application emails

---

## 📁 **Project Structure**
```
job-automation/
├── .gitignore                  # Ignored files
├── README.md                   # This file
├── requirements.txt            # Python dependencies
├── jobauto.py                  # Main Streamlit app
├── job_tracker.csv             # Application tracking
├── .env                        # Environment variables
├── .streamlit/                 # Streamlit config
└── chrome-extension-v2/        # Chrome extension files
    ├── manifest.json           # Extension manifest
    ├── popup.html              # Extension UI
    ├── popup.js                # Extension logic
    ├── background.js           # Background service
    └── icons/                  # Extension icons
```

---

## 🔧 **Configuration**

### **Environment Variables**
| Variable          | Description                                  |
|-------------------|----------------------------------------------|
| `GEMINI_API_KEY`  | Your Google Gemini API key                   |

### **Customization Options**
- Adjust scan duration in Chrome extension
- Modify email templates in `jobauto.py`
- Change job filtering criteria (e.g., location)

---

## 🤝 **Contributing**

We welcome contributions! Here's how you can help:

1. **Fork the repository** and create your branch:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Install development dependencies** (if any):
   ```bash
   pip install -r dev-requirements.txt  # Add this if needed
   ```

3. **Submit a pull request** with a clear description of changes.

### **Code Style Guidelines**
- Follow **PEP 8** for Python code
- Use **consistent indentation** (4 spaces)
- Write **clear, concise comments**

---

## 📝 **License**
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 **Authors & Contributors**
👤 **Vaibhaw Upadhyay** - [LinkedIn](https://www.linkedin.com/in/vaibhaw-upadhyay-8aa4b31aa/)

---

## 🐛 **Issues & Support**
- **Report bugs** or request features via [GitHub Issues](https://github.com/vaibhaw001/job-automation/issues)
- **Need help?** Join our [Discussions](https://github.com/vaibhaw001/job-automation/discussions)

---

## 🗺️ **Roadmap**
### **Upcoming Features**
- [ ] Add support for more job platforms (e.g., AngelList)
- [ ] Implement email sending queue with retry logic
- [ ] Add resume parsing for better job matching
- [ ] Mobile app version (Flutter)

### **Known Issues**
- [ ] Chrome extension may require permissions on first run
- [ ] Gemini API rate limits may affect performance

---

## 💡 **Why This Project?**
Job Automation Suite **saves you hours** by:
✅ Automating job scraping from multiple platforms
✅ Drafting professional emails with AI
✅ Tracking applications in one place
✅ Preventing duplicate applications

**Join us in making job hunting easier!** 🚀

---
