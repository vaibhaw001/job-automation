// ==========================================
// upload.js – RoleMatch AI Upload Page Logic
// Integrated with Flask backend API
// ==========================================
const API_BASE = (window.location.origin === 'file://' || window.location.origin === 'null') ? 'http://localhost:5000' : window.location.origin;
document.addEventListener('DOMContentLoaded', () => {

    // ── DOM Elements ──
    const resumeDropZone = document.getElementById('resumeDropZone');
    const resumeInput = document.getElementById('resumeInput');
    const resumePreview = document.getElementById('resumePreview');
    const resumeFileName = document.getElementById('resumeFileName');
    const resumeFileSize = document.getElementById('resumeFileSize');
    const resumeRemoveBtn = document.getElementById('resumeRemoveBtn');
    const resumeStatus = document.getElementById('resumeStatus');
    const resumeChip = document.getElementById('resumeChip');

    const txtDropZone = document.getElementById('txtDropZone');
    const txtInput = document.getElementById('txtInput');
    const txtPreview = document.getElementById('txtPreview');
    const txtFileName = document.getElementById('txtFileName');
    const txtFileSize = document.getElementById('txtFileSize');
    const txtRemoveBtn = document.getElementById('txtRemoveBtn');
    const txtStatus = document.getElementById('txtStatus');
    const txtChip = document.getElementById('txtChip');
    const txtContentPreview = document.getElementById('txtContentPreview');
    const txtContentText = document.getElementById('txtContentText');

    const continueBtn = document.getElementById('continueBtn');

    // ── State ──
    let resumeFile = null;
    let txtFile = null;

    // ── Particles ──
    createParticles();

    // ── Check session on load ──
    checkSession();

    // ── Logout ──
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // Call backend logout
                await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
            } catch (err) { }
            // Clear local credentials/state
            localStorage.removeItem('rolematch_user');
            // Sign out of Supabase
            if (window.sbClient) {
                await window.sbClient.auth.signOut();
            }
            window.location.href = 'login.html';
        });
    }

    // ────────────────────────────────
    // RESUME DROP ZONE
    // ────────────────────────────────
    setupDropZone(resumeDropZone, resumeInput, handleResumeFile);

    resumeRemoveBtn.addEventListener('click', () => {
        resumeFile = null;
        resumeInput.value = '';
        resumePreview.classList.remove('visible');
        resumeDropZone.style.display = '';
        hideStatus(resumeStatus);
        updateChip(resumeChip, false, 'Resume');
        updateContinueBtn();
    });

    async function handleResumeFile(file) {
        // Validate file type
        const validExts = ['pdf', 'docx', 'doc', 'txt', 'xlsx', 'xls', 'pptx', 'ppt', 'png', 'jpg', 'jpeg', 'gif', 'bmp'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (!validExts.includes(ext)) {
            showStatus(resumeStatus, 'error', `Unsupported format: .${ext}`);
            return;
        }

        // Validate size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            showStatus(resumeStatus, 'error', 'File too large. Maximum size is 10MB.');
            return;
        }

        // Show uploading state
        showStatus(resumeStatus, 'info', 'Uploading resume to server...');

        try {
            // Upload to Flask backend
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_BASE}/api/upload/resume`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!data.success) {
                showStatus(resumeStatus, 'error', data.error || 'Upload failed');
                return;
            }

            resumeFile = file;
            resumeFileName.textContent = data.filename;
            resumeFileSize.textContent = formatSize(data.size) + '  ·  ' + ext.toUpperCase();
            resumePreview.classList.add('visible');
            resumeDropZone.style.display = 'none';

            showStatus(resumeStatus, 'success', 'Resume uploaded successfully!');
            
            // Local Storage Saving of Files
            localStorage.setItem('resume_text', data.resume_text || '');
            localStorage.setItem('resume_path', data.resume_path || '');
            localStorage.setItem('resume_name', data.resume_name || '');
            localStorage.setItem('resume_original_name', file.name || '');

            updateChip(resumeChip, true, 'Resume');
            updateContinueBtn();

        } catch (err) {
            showStatus(resumeStatus, 'error', 'Cannot connect to server. Is the backend running?');
        }
    }

    // ────────────────────────────────
    // TXT DROP ZONE
    // ────────────────────────────────
    setupDropZone(txtDropZone, txtInput, handleTxtFile);

    txtRemoveBtn.addEventListener('click', () => {
        txtFile = null;
        txtInput.value = '';
        txtPreview.classList.remove('visible');
        txtDropZone.style.display = '';
        txtContentPreview.style.display = 'none';
        hideStatus(txtStatus);
        updateChip(txtChip, false, 'Job Scrape');
        updateContinueBtn();
    });

    async function handleTxtFile(file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.txt')) {
            showStatus(txtStatus, 'error', 'Only .txt files are accepted.');
            return;
        }

        // Validate size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showStatus(txtStatus, 'error', 'File too large. Maximum size is 5MB.');
            return;
        }

        showStatus(txtStatus, 'info', 'Uploading scrape file to server...');

        try {
            // Upload to Flask backend
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_BASE}/api/upload/txt`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!data.success) {
                showStatus(txtStatus, 'error', data.error || 'Upload failed');
                return;
            }

            txtFile = file;
            txtFileName.textContent = data.filename;
            txtFileSize.textContent = formatSize(file.size) + '  ·  TXT  ·  ' + data.char_count.toLocaleString() + ' chars';
            txtPreview.classList.add('visible');
            txtDropZone.style.display = 'none';
            showStatus(txtStatus, 'success', `Job scrape uploaded! ${data.char_count.toLocaleString()} characters.`);
            
            // Local Storage Saving of Files
            localStorage.setItem('txt_content', await file.text());
            localStorage.setItem('txt_filename', file.name);
            localStorage.setItem('txt_char_count', data.char_count);

            updateChip(txtChip, true, 'Job Scrape');
            updateContinueBtn();

            // Show preview
            if (data.preview) {
                txtContentText.textContent = data.preview + (data.char_count > 1000 ? '\n\n... (truncated)' : '');
                txtContentPreview.style.display = 'block';
            }

        } catch (err) {
            showStatus(txtStatus, 'error', 'Cannot connect to server. Is the backend running?');
        }
    }

    // ────────────────────────────────
    // CONTINUE BUTTON
    // ────────────────────────────────
    continueBtn.addEventListener('click', async () => {
        if (!resumeFile && !txtFile) return;

        continueBtn.classList.add('loading');
        continueBtn.disabled = true;

        await delay(500);

        // Navigate to jobs page
        window.location.href = 'jobs.html';
    });

    // ────────────────────────────────
    // CHECK EXISTING SESSION
    // ────────────────────────────────
    async function checkSession() {
        try {
            const res = await fetch(`${API_BASE}/api/session`);
            const data = await res.json();

            // If resume already uploaded in this session, show it
            if (localStorage.getItem('resume_text') && localStorage.getItem('resume_original_name')) {
                const rName = localStorage.getItem('resume_original_name');
                resumeFileName.textContent = rName;
                resumeFileSize.textContent = 'Previously uploaded';
                resumePreview.classList.add('visible');
                resumeDropZone.style.display = 'none';
                resumeFile = { name: rName }; // placeholder
                updateChip(resumeChip, true, 'Resume');
                showStatus(resumeStatus, 'success', `Resume loaded locally: ${rName}`);
            }

            // If txt already uploaded
            if (localStorage.getItem('txt_content') && localStorage.getItem('txt_filename')) {
                const tName = localStorage.getItem('txt_filename');
                const tCount = localStorage.getItem('txt_char_count') || localStorage.getItem('txt_content').length;
                txtFileName.textContent = tName;
                txtFileSize.textContent = parseInt(tCount).toLocaleString() + ' chars';
                txtPreview.classList.add('visible');
                txtDropZone.style.display = 'none';
                txtFile = { name: tName }; // placeholder
                updateChip(txtChip, true, 'Job Scrape');
                showStatus(txtStatus, 'success', `Scrape file loaded locally: ${tName}`);
                
                txtContentText.textContent = localStorage.getItem('txt_content').substring(0, 1000) + '...';
                txtContentPreview.style.display = 'block';
            }

            updateContinueBtn();
        } catch (e) {
            console.warn('⚠️ Backend not reachable:', e);
        }
    }

    // ────────────────────────────────
    // SHARED UTILITIES
    // ────────────────────────────────

    function setupDropZone(zone, input, handler) {
        zone.addEventListener('click', () => {
            input.value = '';
            input.click();
        });

        input.addEventListener('change', () => {
            if (input.files.length > 0) handler(input.files[0]);
        });

        ['dragenter', 'dragover'].forEach(evt => {
            zone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.add('dragover');
            });
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) handler(files[0]);
        });
    }

    function showStatus(el, type, message) {
        const icon = el.querySelector('span:first-child');
        const text = el.querySelector('span:last-child');

        const icons = { success: '✓', error: '⚠️', info: '⏳' };
        const colors = {
            success: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', text: '#34d399' },
            error: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', text: '#f87171' },
            info: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', text: '#818cf8' },
        };

        icon.textContent = icons[type] || '•';
        text.textContent = message;

        const c = colors[type] || colors.info;
        el.style.background = c.bg;
        el.style.borderColor = c.border;
        el.style.color = c.text;
        el.className = 'status-msg visible';
    }

    function hideStatus(el) {
        el.classList.remove('visible');
    }

    function updateChip(chip, isReady, label) {
        if (isReady) {
            chip.className = 'summary-chip ready';
            chip.innerHTML = `<span>✓</span> ${label} — Ready`;
        } else {
            chip.className = 'summary-chip pending';
            const icon = label === 'Resume' ? '📎' : '📄';
            chip.innerHTML = `<span>${icon}</span> ${label} — Pending`;
        }
    }

    function updateContinueBtn() {
        continueBtn.disabled = !(resumeFile && txtFile);
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.top = (40 + Math.random() * 60) + '%';
            p.style.animationDelay = (Math.random() * 6) + 's';
            p.style.animationDuration = (4 + Math.random() * 4) + 's';
            p.style.width = (2 + Math.random() * 2) + 'px';
            p.style.height = p.style.width;
            container.appendChild(p);
        }
    }
});
