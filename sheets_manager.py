# ==========================================
# sheets_manager.py – Google Sheets per-user tracker
# Creates / finds a unique Google Sheet for each user
# and logs all sent email activity.
# ==========================================

import os
import gspread
from datetime import datetime
from google.oauth2.service_account import Credentials

# ── Scopes ──
SCOPES = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

# ── Headers for the tracker sheet ──
TRACKER_HEADERS = [
    "Post ID",
    "Job Title",
    "Company",
    "Contact Email",
    "Email Subject",
    "Status",
    "Relevance",
    "Notes",
    "Date Processed",
]


def _get_client():
    """Authenticate with Google using the service account JSON key."""
    creds_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "service_account.json")
    if not os.path.exists(creds_path):
        raise FileNotFoundError(
            f"Service account JSON not found at '{creds_path}'. "
            "Download it from Google Cloud Console and set GOOGLE_SERVICE_ACCOUNT_JSON in .env"
        )
    creds = Credentials.from_service_account_file(creds_path, scopes=SCOPES)
    return gspread.authorize(creds)


def _sheet_name_for_user(user_email: str) -> str:
    """Generate a consistent spreadsheet name for a user."""
    return f"RoleMatch AI - {user_email}"


def get_or_create_sheet(user_email: str):
    """
    Find or create a Google Sheet for the given user.
    Returns (spreadsheet_object, sheet_url, is_new).
    """
    client = _get_client()
    sheet_name = _sheet_name_for_user(user_email)

    # Try to find existing spreadsheet
    try:
        existing = client.open(sheet_name)
        return existing, existing.url, False
    except gspread.SpreadsheetNotFound:
        pass

    # Create new spreadsheet
    spreadsheet = client.create(sheet_name)

    # Set up the first worksheet with headers
    ws = spreadsheet.sheet1
    ws.update_title("Email Tracker")
    ws.append_row(TRACKER_HEADERS)

    # Format header row
    ws.format("A1:I1", {
        "backgroundColor": {"red": 0.15, "green": 0.15, "blue": 0.25},
        "textFormat": {
            "bold": True,
            "foregroundColor": {"red": 0.85, "green": 0.85, "blue": 1.0},
        },
    })

    # Add a summary sheet
    summary_ws = spreadsheet.add_worksheet(title="Summary", rows=20, cols=5)
    summary_ws.update("A1", [
        ["RoleMatch AI - Activity Summary"],
    ])
    summary_ws.update("A3", [
        ["User Email", user_email],
        ["Sheet Created", datetime.now().strftime("%Y-%m-%d %H:%M")],
        ["Total Emails Sent", "=COUNTA('Email Tracker'!D2:D)"],
        ["Unique Companies", "=COUNTA(UNIQUE('Email Tracker'!C2:C))"],
    ])
    summary_ws.format("A1", {
        "textFormat": {"bold": True, "fontSize": 14},
    })

    # Share with the user (editor access)
    try:
        spreadsheet.share(user_email, perm_type="user", role="writer")
    except Exception as e:
        print(f"Could not share sheet with {user_email}: {e}")

    return spreadsheet, spreadsheet.url, True


def log_sent_email(user_email: str, row_data: dict):
    """
    Append a sent email record to the user's Google Sheet.
    row_data should contain keys matching TRACKER_HEADERS.
    """
    spreadsheet, url, _ = get_or_create_sheet(user_email)
    ws = spreadsheet.worksheet("Email Tracker")

    row = [
        str(row_data.get("Post ID", "")),
        row_data.get("Job Title", ""),
        row_data.get("Company", ""),
        row_data.get("Contact Email", ""),
        row_data.get("Email Subject", ""),
        row_data.get("Status", "SENT"),
        row_data.get("Relevance", "YES"),
        row_data.get("Notes", ""),
        row_data.get("Date Processed", datetime.now().strftime("%Y-%m-%d %H:%M")),
    ]
    ws.append_row(row, value_input_option="USER_ENTERED")
    return url


def get_sheet_url(user_email: str) -> str | None:
    """Get the URL of the user's Google Sheet, or None if it doesn't exist yet."""
    try:
        client = _get_client()
        sheet_name = _sheet_name_for_user(user_email)
        spreadsheet = client.open(sheet_name)
        return spreadsheet.url
    except Exception:
        return None


def get_sheet_data(user_email: str) -> list[dict]:
    """Get all rows from the user's tracker sheet as a list of dicts."""
    try:
        client = _get_client()
        sheet_name = _sheet_name_for_user(user_email)
        spreadsheet = client.open(sheet_name)
        ws = spreadsheet.worksheet("Email Tracker")
        records = ws.get_all_records()
        return records
    except Exception:
        return []


def list_all_user_sheets() -> list[dict]:
    """
    List ALL RoleMatch AI spreadsheets created by the service account.
    Returns a list of dicts with user_email, sheet_url, title, etc.
    Useful for admin dashboard to see all users' sheets.
    """
    client = _get_client()
    all_sheets = client.openall()

    results = []
    for sheet in all_sheets:
        title = sheet.title
        if title.startswith("RoleMatch AI"):
            # Extract user email from sheet name
            user_email = title.replace("RoleMatch AI - ", "").strip()
            try:
                ws = sheet.worksheet("Email Tracker")
                all_values = ws.get_all_values()
                actual_rows = max(0, len(all_values) - 1)
            except Exception:
                actual_rows = 0

            results.append({
                "user_email": user_email,
                "sheet_title": title,
                "sheet_url": sheet.url,
                "sheet_id": sheet.id,
                "emails_sent": actual_rows,
            })

    return results
