// ==============================================
// credentials.js – RoleMatch AI Credentials Logic
// ==============================================
const API_BASE = (window.location.origin === 'file://' || window.location.origin === 'null') ? 'http://localhost:5000' : window.location.origin;

document.addEventListener('DOMContentLoaded', () => {

    // ── DOM Elements ──
    const senderEmailInput = document.getElementById('senderEmail');
    const senderPassInput = document.getElementById('senderAppPassword');
    const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
    const sampleEmailInput = document.getElementById('sampleEmailTemplate');
    const saveContinueBtn = document.getElementById('saveContinueBtn');
    const skipBtn = document.getElementById('skipBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // ── Particles ──
    createParticles();

    // ── Load saved values ──
    loadSavedCredentials();

    // ── Logout ──
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // Call backend logout
                await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
            } catch (err) { }
            // Clear local application state (txt and jobs ONLY, keep resume)
            localStorage.removeItem('txt_content');
            localStorage.removeItem('txt_name');
            localStorage.removeItem('txt_chars');
            localStorage.removeItem('analyzed_jobs');
            
            // Clear auth but KEEP AI Key, Gmail Creds, and Resume
            localStorage.removeItem('rolematch_user');
            
            // Sign out of Supabase
            if (window.sbClient) {
                await window.sbClient.auth.signOut();
            }
            window.location.href = 'login.html';
        });
    }

    // ── Save & Continue ──
    saveContinueBtn.addEventListener('click', async () => {
        const senderEmail = senderEmailInput.value.trim();
        const senderPassword = senderPassInput.value.trim();
        const geminiKey = geminiApiKeyInput.value.trim();
        const template = sampleEmailInput.value.trim();

        // Basic validation
        if (!senderEmail || !senderPassword || !geminiKey) {
            alert('Please provide your Gmail credentials and Gemini API Key to continue.');
            return;
        }

        saveContinueBtn.querySelector('.btn-text').textContent = '⏳ Saving...';
        saveContinueBtn.disabled = true;

        // Save to localStorage
        localStorage.setItem('rolematch_gmail_email', senderEmail);
        localStorage.setItem('rolematch_gmail_pass', senderPassword);
        localStorage.setItem('gemini_api_key', geminiKey);
        localStorage.setItem('rolematch_sample_email', template);

        const savedUser = JSON.parse(localStorage.getItem('rolematch_user') || '{}');
        const userFullName = savedUser.name || '';

        try {
            // Save credentials via API
            const credsRes = await fetch(`${API_BASE}/api/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: senderEmail, app_password: senderPassword, full_name: userFullName })
            });

            // Save template via API if provided
            if (template) {
                await fetch(`${API_BASE}/api/sample-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ template })
                });
            }

            // Move to upload page
            saveContinueBtn.querySelector('.btn-text').textContent = '✓ Saved!';
            saveContinueBtn.style.background = 'linear-gradient(135deg, #059669, #34d399)';
            
            await delay(800);
            window.location.href = 'upload.html';

        } catch (e) {
            saveContinueBtn.querySelector('.btn-text').textContent = '❌ Server Error';
            await delay(2000);
            saveContinueBtn.querySelector('.btn-text').textContent = '💾 Save & Continue';
            saveContinueBtn.disabled = false;
        }
    });

    // ── Skip ──
    skipBtn.addEventListener('click', () => {
        window.location.href = 'upload.html';
    });

    // ──────────────────────────────
    // HELPERS
    // ──────────────────────────────

    function loadSavedCredentials() {
        const savedGmail = localStorage.getItem('rolematch_gmail_email') || '';
        const savedAppPass = localStorage.getItem('rolematch_gmail_pass') || '';
        const savedKey = localStorage.getItem('gemini_api_key') || '';
        const savedTemplate = localStorage.getItem('rolematch_sample_email') || '';

        if (savedGmail) senderEmailInput.value = savedGmail;
        if (savedAppPass) senderPassInput.value = savedAppPass;
        if (savedKey) geminiApiKeyInput.value = savedKey;
        if (savedTemplate) sampleEmailInput.value = savedTemplate;

        // Try to fetch sample email from server, but ignore if fails
        fetch(`${API_BASE}/api/session`)
            .then(res => res.json())
            .then(data => {
                if (data.session && data.session.sample_email) {
                    sampleEmailInput.value = data.session.sample_email;
                }
            })
            .catch(() => {});
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = (40 + Math.random() * 60) + '%';
            particle.style.animationDelay = (Math.random() * 6) + 's';
            particle.style.animationDuration = (4 + Math.random() * 4) + 's';
            particle.style.width = (2 + Math.random() * 2) + 'px';
            particle.style.height = particle.style.width;
            container.appendChild(particle);
        }
    }
});
