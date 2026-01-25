# =========================
# app.py – RoleMatch AI Job Automation
# =========================

import os
import json
import glob
import pandas as pd
import streamlit as st
from datetime import datetime
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import streamlit.components.v1 as components

# Load environment variables from .env file
load_dotenv()

# -------------------------
# LOCAL CSV STORAGE (No Google Sheets)
# -------------------------
# Removed gspread and google credentials - using local CSV instead

# -------------------------
# GEMINI
# -------------------------
import google.generativeai as genai

# =========================
# STREAMLIT SETUP & HEADER
# =========================
st.set_page_config(
    page_title="RoleMatch AI",
    layout="wide",
    page_icon="🤖"
)

st.title("💼 RoleMatch AI – LinkedIn Job Automation")
st.markdown("""
**Description:**  
RoleMatch AI automatically extracts job postings from LinkedIn text, drafts professional job application emails using AI, and tracks all sent applications in Google Sheets.

**How to Use:**  
1. Upload your **LinkedIn scraped `.txt` file** containing job postings.  
2. Enter your **Gmail address and App Password** (used only for sending emails). 
**Gmail App Password Setup:**  
To send emails, Gmail requires an **App Password** (2-Step Verification must be enabled).  
Create one here:  
👉 https://myaccount.google.com/apppasswords 
3. Upload your **resume (PDF)** and click **Send Email**. 
4. Click **Analyze TXT with Gemini** to extract valid jobs and generate email drafts.  
5. Review and edit the generated email if needed.  
6. Track sent applications live in your **Google Sheet**.


**Limitations & Notes:**  
- Only jobs **located in India** are processed.  
- Jobs must contain a **valid apply email** to be considered.  
- Gmail allows roughly **100 emails/day**; recommended limit is **≤ 50/day**.  
- Emails are sent **one at a time** to avoid spam detection.  
- Sender credentials are **not stored** and remain session-based only.  
- Duplicate emails are automatically **blocked** using the Google Sheet.

**Author:** Vivek Upadhyay  
**LinkedIn:** https://www.linkedin.com/in/vivek-upadhyay-6689b4184/
""")
st.markdown("---")

# =========================
# AUTO-LOAD FROM EXTENSION (JavaScript Bridge)
# =========================
# This component checks localStorage for data from Job Scanner extension
auto_load_js = """
<script>
(function() {
    // Check if extension has sent data
    const content = localStorage.getItem('jobScannerContent');
    const filename = localStorage.getItem('jobScannerFilename');
    const timestamp = localStorage.getItem('jobScannerTimestamp');
    
    if (content && timestamp) {
        const scanTime = parseInt(timestamp);
        const now = Date.now();
        const age = (now - scanTime) / 1000; // seconds
        
        // If data is less than 60 seconds old, it's fresh from extension
        if (age < 60) {
            console.log('Job Scanner: Fresh data detected, saving to file');
            
            // Send data to parent window for Streamlit to handle
            window.parent.postMessage({
                type: 'jobScannerData',
                content: content,
                filename: filename
            }, '*');
            
            // Clear after processing
            localStorage.removeItem('jobScannerContent');
            localStorage.removeItem('jobScannerFilename');
            localStorage.removeItem('jobScannerTimestamp');
        }
    }
})();
</script>
"""
components.html(auto_load_js, height=0)

# =========================
# CONFIG
# =========================
CSV_FILE = "job_tracker.csv"

def get_or_create_csv():
    """Create CSV file if it doesn't exist, return the file path"""
    if not os.path.exists(CSV_FILE):
        df = pd.DataFrame(columns=[
            "Post ID",
            "Job Title",
            "Company",
            "Contact Email",
            "Status",
            "Relevance",
            "Notes",
            "Date Processed"
        ])
        df.to_csv(CSV_FILE, index=False)
    return CSV_FILE

def load_tracker_data():
    """Load data from CSV file"""
    csv_path = get_or_create_csv()
    return pd.read_csv(csv_path)

def append_to_csv(row_data):
    """Append a new row to the CSV file"""
    csv_path = get_or_create_csv()
    df = pd.read_csv(csv_path)
    new_row = pd.DataFrame([row_data])
    df = pd.concat([df, new_row], ignore_index=True)
    df.to_csv(csv_path, index=False)


# =========================
# UPLOAD RESUME
# =========================
st.subheader("📎 Upload Your Resume")
uploaded_resume = st.file_uploader(
    "Upload your resume (PDF only)", type=["pdf"]
)
if uploaded_resume:
    st.success(f"✅ Resume uploaded: {uploaded_resume.name}")

# =========================
# DYNAMIC SENDER EMAIL INPUT
# =========================
st.subheader("👤 Sender Email Settings")
sender_email = st.text_input("Your Gmail address", placeholder="you@gmail.com",key="sender_email")
sender_app_password = st.text_input(
    "Your Gmail App Password (16 chars)",
    type="password",
    placeholder="Enter your Gmail App Password",  key="sender_app_password"
)
if sender_email and sender_app_password:
    st.success("✅ Sender credentials received")
else:
    st.info("Enter Gmail & App Password to continue")

# =========================
# USER SAMPLE EMAIL TEMPLATE
# =========================
st.subheader("✉️ Sample Email Template (Style Reference)")

user_sample_email = st.text_area(
    "Paste a sample email you like. AI will follow this style for all jobs.",
    height=160,
    placeholder="Paste your preferred email format here..."
)

if not user_sample_email.strip():
    st.info("Please provide a sample email template to continue.")

# =========================
# LOCAL CSV TRACKER
# =========================
data = load_tracker_data()

st.subheader("📊 Job Tracker (Local CSV)")
if st.button("🔄 Refresh Data"):
    data = load_tracker_data()
    st.success("✅ Data refreshed")
if data.empty:
    st.info("No applications tracked yet.")
else:
    st.dataframe(data, use_container_width=True)

# =========================
# UPLOAD LINKEDIN TXT / AUTO-LOAD FROM EXTENSION
# =========================
st.subheader("📄 Analyze Jobs - Upload or Auto-Load")

# Check for scanned files in scanned_jobs folder AND Downloads folder
SCANNED_JOBS_FOLDER = "scanned_jobs"

def get_downloads_folder():
    """Get the user's Downloads folder path"""
    if os.name == 'nt':  # Windows
        return os.path.join(os.environ.get('USERPROFILE', ''), 'Downloads')
    else:  # macOS/Linux
        return os.path.join(os.path.expanduser('~'), 'Downloads')

def get_latest_scanned_file():
    """Get the most recent scanned job file from scanned_jobs folder or Downloads"""
    all_files = []
    
    # Check scanned_jobs folder
    if not os.path.exists(SCANNED_JOBS_FOLDER):
        os.makedirs(SCANNED_JOBS_FOLDER)
    
    for f in os.listdir(SCANNED_JOBS_FOLDER):
        if f.endswith('.txt') and ('_jobs_' in f or 'linkedin' in f.lower() or 'internshala' in f.lower() or 'indeed' in f.lower() or 'naukri' in f.lower()):
            full_path = os.path.join(SCANNED_JOBS_FOLDER, f)
            all_files.append((f, full_path, os.path.getmtime(full_path)))
    
    # Also check Downloads folder for recent scans
    downloads_folder = get_downloads_folder()
    if os.path.exists(downloads_folder):
        # Look for files matching job scanner pattern in Downloads/scanned_jobs subfolder
        scanned_in_downloads = os.path.join(downloads_folder, 'scanned_jobs')
        if os.path.exists(scanned_in_downloads):
            for f in os.listdir(scanned_in_downloads):
                if f.endswith('.txt'):
                    full_path = os.path.join(scanned_in_downloads, f)
                    all_files.append((f, full_path, os.path.getmtime(full_path)))
        
        # Also check direct Downloads for job scanner files
        for f in os.listdir(downloads_folder):
            if f.endswith('.txt') and ('_jobs_' in f or 'linkedin' in f.lower() or 'internshala' in f.lower() or 'indeed' in f.lower() or 'naukri' in f.lower()):
                full_path = os.path.join(downloads_folder, f)
                all_files.append((f, full_path, os.path.getmtime(full_path)))
    
    if not all_files:
        return None, None
    
    # Sort by modification time (most recent first)
    all_files.sort(key=lambda x: x[2], reverse=True)
    
    latest_file = all_files[0][0]
    latest_path = all_files[0][1]
    
    return latest_file, latest_path

def get_all_scanned_files():
    """Get all scanned job files from both folders"""
    all_files = []
    
    # Check scanned_jobs folder
    if os.path.exists(SCANNED_JOBS_FOLDER):
        for f in os.listdir(SCANNED_JOBS_FOLDER):
            if f.endswith('.txt'):
                full_path = os.path.join(SCANNED_JOBS_FOLDER, f)
                all_files.append((f, full_path, os.path.getmtime(full_path)))
    
    # Check Downloads/scanned_jobs
    downloads_folder = get_downloads_folder()
    scanned_in_downloads = os.path.join(downloads_folder, 'scanned_jobs')
    if os.path.exists(scanned_in_downloads):
        for f in os.listdir(scanned_in_downloads):
            if f.endswith('.txt'):
                full_path = os.path.join(scanned_in_downloads, f)
                all_files.append((f, full_path, os.path.getmtime(full_path)))
    
    # Sort by time
    all_files.sort(key=lambda x: x[2], reverse=True)
    return all_files

# Initialize session state for loaded content
if "loaded_scan_content" not in st.session_state:
    st.session_state["loaded_scan_content"] = ""
if "loaded_scan_filename" not in st.session_state:
    st.session_state["loaded_scan_filename"] = ""
if "last_check_time" not in st.session_state:
    st.session_state["last_check_time"] = None

# Check URL parameters for auto-load from extension
query_params = st.query_params
auto_load_triggered = query_params.get("auto_load", "false") == "true"
url_filename = query_params.get("filename", "")

# Auto-load section
col1, col2 = st.columns([2, 1])

with col1:
    latest_file, latest_path = get_latest_scanned_file()
    
    # Auto-load if triggered by extension URL parameter
    if auto_load_triggered and latest_file and not st.session_state.get("auto_loaded"):
        file_time = datetime.fromtimestamp(os.path.getmtime(latest_path))
        time_diff = (datetime.now() - file_time).total_seconds()
        
        # Only auto-load if file is recent (less than 2 minutes old)
        if time_diff < 120:
            with open(latest_path, 'r', encoding='utf-8', errors='ignore') as f:
                st.session_state["loaded_scan_content"] = f.read()
                st.session_state["loaded_scan_filename"] = latest_file
                st.session_state["auto_loaded"] = True
            st.success(f"🚀 **Auto-loaded from Job Scanner!** `{latest_file}`")
            # Clear URL parameters
            st.query_params.clear()
            st.rerun()
    
    if latest_file:
        file_time = datetime.fromtimestamp(os.path.getmtime(latest_path))
        time_diff = (datetime.now() - file_time).total_seconds()
        
        if time_diff < 300:  # Less than 5 minutes old
            st.success(f"🆕 **New scan detected!** `{latest_file}` ({int(time_diff)}s ago)")
        else:
            st.info(f"📁 Latest scan: `{latest_file}` ({file_time.strftime('%Y-%m-%d %H:%M')})")
        
        if st.button("📥 Load Latest Scan", type="primary"):
            with open(latest_path, 'r', encoding='utf-8', errors='ignore') as f:
                st.session_state["loaded_scan_content"] = f.read()
                st.session_state["loaded_scan_filename"] = latest_file
            st.success(f"✅ Loaded: {latest_file}")
            st.rerun()
    else:
        st.info("No scanned files found. Use the Job Scanner extension to scan job platforms.")

with col2:
    # Show all available scanned files from both folders
    all_scanned = get_all_scanned_files()
    if all_scanned and len(all_scanned) > 1:
        file_options = [""] + [f[0] for f in all_scanned]
        selected_file = st.selectbox("📂 Or select a file:", file_options)
        if selected_file:
            # Find the full path for selected file
            file_path = next((f[1] for f in all_scanned if f[0] == selected_file), None)
            if file_path and st.button("Load Selected"):
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    st.session_state["loaded_scan_content"] = f.read()
                    st.session_state["loaded_scan_filename"] = selected_file
                st.rerun()

st.markdown("---")
st.caption("**Or upload manually:**")

uploaded_file = st.file_uploader(
    "Upload a job scan .txt file",
    type=["txt"]
)

gemini_input_text = ""
post_id = ""

# Priority: 1. Uploaded file, 2. Loaded from scanned_jobs
if uploaded_file is not None:
    gemini_input_text = uploaded_file.read().decode("utf-8", errors="ignore")
    post_id = uploaded_file.name.replace(".txt", "")
    st.success(f"📎 File uploaded: {uploaded_file.name}")
    st.caption(f"Text length: {len(gemini_input_text)} characters")
elif st.session_state["loaded_scan_content"]:
    gemini_input_text = st.session_state["loaded_scan_content"]
    post_id = st.session_state["loaded_scan_filename"].replace(".txt", "")
    st.success(f"✅ Using loaded scan: {st.session_state['loaded_scan_filename']}")
    st.caption(f"Text length: {len(gemini_input_text)} characters")
    
    # Preview button
    with st.expander("📄 Preview loaded content"):
        st.text_area("Content preview:", gemini_input_text[:2000] + ("..." if len(gemini_input_text) > 2000 else ""), height=200, disabled=True)
else:
    st.info("📤 Upload a TXT file or load from Job Scanner extension.")

# =========================
# GEMINI SETUP
# =========================
st.subheader("🔑 Gemini API Key")

# Try to load from .env file first
env_api_key = os.getenv("GEMINI_API_KEY", "")

gemini_api_key = st.text_input(
    "Enter your Gemini API Key",
    type="password",
    value=env_api_key,
    placeholder="Get it from https://aistudio.google.com/apikey",
    key="gemini_key"
)
if not gemini_api_key:
    st.info("Enter your Gemini API key to continue. Get one free at: https://aistudio.google.com/apikey")
    st.info("💡 Tip: Add GEMINI_API_KEY to your .env file to auto-fill this field.")

# =========================
# PROMPT TEMPLATE
# =========================
user_sample_email_safe = user_sample_email if user_sample_email.strip() else "Professional email"

PROMPT = f"""
You are a highly skilled AI assistant specialized in analyzing job postings and drafting professional job application emails.

Your input text may contain multiple, unstructured job postings scraped from LinkedIn or other sources.

Your tasks:

1. Identify ALL distinct job postings in the input text.
2. FILTER OUT any job that:
   - Does NOT provide a valid apply email
   - Is located OUTSIDE India
3. For each remaining job:
   - Extract ONLY factual information explicitly present in the text
   - Generate a professional, polite, concise email draft by FOLLOWING the STYLE and STRUCTURE of the template below
   - Ensure emails are human-like, coherent, and well-formatted

Strict JSON output schema:

{{
  "jobs": [
    {{
      "job_title": string,
      "company": string,
      "apply_email": string,
      "job_type": "Internship" | "Full-time" | "Contract" | "Part-time" | "Unknown",
      "location": string,
      "skills": string or null,
      "jd_summary": string,         # 1-2 sentences summarizing role, tech stack, and expectations
      "email_subject": string,      # Clear, professional subject, e.g., "Application for <Job Title> role"
      "email_body_draft": string    # Polished email, max 2 short paragraphs + closing
    }}
  ]
}}

Rules for `email_body_draft`:
- Style reference template (DO NOT COPY TEXT):

\"\"\"
{user_sample_email_safe}
\"\"\"
- Preserve tone and structure
- Lightly customize for each job using job title, skills, and JD summary
- Keep paragraphs short and readable
- Do NOT exaggerate, invent skills, or fabricate experience
- Ensure proper grammar and professional formatting

Additional instructions:
- Output JSON ONLY
- Do NOT include explanations, comments, or non-job content
- Ensure all extracted jobs are unique
- Validate that `apply_email` looks legitimate (contains "@" and domain)
- Include only jobs in India

TEXT TO ANALYZE:
"""

# =========================
# RUN GEMINI ANALYSIS
# =========================
st.subheader("🤖 Analyze Jobs")

# Check if ready to analyze
can_analyze = gemini_api_key and gemini_input_text and user_sample_email.strip()

if not can_analyze:
    missing = []
    if not gemini_api_key:
        missing.append("Gemini API Key")
    if not gemini_input_text:
        missing.append("LinkedIn TXT file")
    if not user_sample_email.strip():
        missing.append("Sample email template")
    st.warning(f"⚠️ Fill in: {', '.join(missing)}")

if st.button("Analyze TXT with Gemini", disabled=not can_analyze):
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    with st.spinner("Analyzing jobs..."):
        response = model.generate_content(
            PROMPT +  "\n\n" + gemini_input_text,
            generation_config=genai.GenerationConfig(
                temperature=0,
            ),
        )
        
        # Extract JSON from response (handle markdown code blocks if present)
        response_text = response.text.strip()
        if response_text.startswith("```"):
            # Remove markdown code block markers
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        gemini_output = json.loads(response_text)
        jobs = gemini_output.get("jobs", [])

        rows = []
        for idx, job in enumerate(jobs, start=1):
            rows.append(
                {
                    "job_id": idx,
                    "job_title": job.get("job_title"),
                    "company": job.get("company"),
                    "apply_email": job.get("apply_email"),
                    "job_type": job.get("job_type"),
                    "location": job.get("location"),
                    "skills": job.get("skills"),
                    "jd_summary": job.get("jd_summary"),
                    "email_subject": job.get("email_subject"),
                    "email_body_draft": job.get("email_body_draft")
                }
            )

        st.session_state["job_df"] = pd.DataFrame(rows)

# =========================
# FILTER SENT EMAILS
# =========================
if "job_df" in st.session_state:
    job_df = st.session_state["job_df"]

    if "Status" in data.columns:
        sent_emails = data.loc[
            data["Status"] == "SENT", "Contact Email"
        ].tolist()
    else:
        sent_emails = []
    if "apply_email" not in job_df.columns:
        job_df["apply_email"] = ""

    job_df_filtered = job_df[(job_df["apply_email"].str.contains("@", na=False)) &
        (~job_df["apply_email"].isin(sent_emails))
    ].reset_index(drop=True)

    st.subheader("✅ Eligible Jobs")
    st.dataframe(job_df_filtered, use_container_width=True)

    if job_df_filtered.empty:
        st.warning("No new jobs available to send emails.")
    else:
        # =========================
        # SELECT JOB
        # =========================
        selected_id = st.selectbox(
            "Select Job ID",
            job_df_filtered["job_id"].tolist(),
        )

        job = job_df_filtered[
            job_df_filtered["job_id"] == selected_id
        ].iloc[0]

        # =========================
        # EMAIL EDITOR
        # =========================
        st.subheader("✉️ Email Editor")

        email_to = st.text_input("To", value=job["apply_email"])
        subject = st.text_input("Subject", value=job["email_subject"])
        body = st.text_area(
            "Email Body",
            value=job["email_body_draft"],
            height=220,
        )

        # =========================
        # SEND EMAIL USING SMTP
        # =========================
        # Check if ready to send
        can_send = sender_email and sender_app_password and uploaded_resume and email_to
        
        if not can_send:
            send_missing = []
            if not sender_email or not sender_app_password:
                send_missing.append("Email credentials")
            if not uploaded_resume:
                send_missing.append("Resume")
            if not email_to:
                send_missing.append("Recipient email")
            st.warning(f"⚠️ Fill in: {', '.join(send_missing)}")
        
        if st.button("🚀 Send Email", disabled=not can_send):
            if email_to in sent_emails:
                st.error("This email was already sent earlier.")
            else:
                msg = EmailMessage()
                msg["From"] = sender_email
                msg["To"] = email_to
                msg["Subject"] = subject
                msg.set_content(body)

                uploaded_resume.seek(0)
                msg.add_attachment(
                    uploaded_resume.read(),
                    maintype="application",
                    subtype="pdf",
                    filename=uploaded_resume.name,
                )

                try:
                    with smtplib.SMTP("smtp.gmail.com", 587) as server:
                        server.starttls()
                        server.login(sender_email, sender_app_password)
                        server.send_message(msg)

                    # Append to CSV
                    new_row = {
                        "Post ID": str(job["job_id"]),
                        "Job Title": job["job_title"],
                        "Company": job["company"],
                        "Contact Email": email_to,
                        "Status": "SENT",
                        "Relevance": "YES",
                        "Notes": f"Mail sent | Subject: {subject}",
                        "Date Processed": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    }
                    append_to_csv(new_row)

                    st.success("✅ Email sent & CSV updated")
                    st.rerun()

                except Exception as e:
                    st.error(f"Failed to send email: {e}")