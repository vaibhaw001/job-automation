// ==========================================
// jobs.js – RoleMatch AI Job Dashboard Logic
// Integrated with Flask backend API
// ==========================================

const API_BASE = (window.location.origin === 'file://' || window.location.origin === 'null') ? 'http://localhost:5000' : window.location.origin;

document.addEventListener('DOMContentLoaded', () => {

    // ── DOM ──
    const jobsBody = document.getElementById('jobsBody');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const filterChips = document.querySelectorAll('.filter-chip');
    const statTotal = document.getElementById('statTotal');
    const statEligible = document.getElementById('statEligible');
    const statSent = document.getElementById('statSent');


    // Settings panel
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsPanel = document.getElementById('settingsPanel');
    const senderEmailInput = document.getElementById('senderEmail');
    const senderPassInput = document.getElementById('senderAppPassword');
    const saveCredsBtn = document.getElementById('saveCredsBtn');

    const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
    const saveApiBtn = document.getElementById('saveApiBtn');

    const sampleEmailInput = document.getElementById('sampleEmailTemplate');
    const saveSampleBtn = document.getElementById('saveSampleBtn');

    // Analyze
    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzeStatus = document.getElementById('analyzeStatus');

    // Modal
    const emailModal = document.getElementById('emailModal');
    const modalClose = document.getElementById('modalClose');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalSendBtn = document.getElementById('modalSendBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalTo = document.getElementById('modalTo');
    const modalSubject = document.getElementById('modalSubject');
    const modalBody = document.getElementById('modalBody');

    // ── State ──
    let allJobs = [];
    let sentEmails = new Set();
    let sentJobKeys = new Set();
    let activeFilter = 'all';
    let searchQuery = '';
    let sortCol = 'job_id';
    let sortAsc = true;
    let currentMailJobIndex = null;
    let senderEmail = '';
    let senderPassword = '';

    // ── Particles ──
    createParticles();

    // ── Initialize ──
    init();

    // ── Logout ──
    const logoutBtn = document.getElementById('logoutBtn');
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

    // ──────────────────────────────
    // INITIALIZATION
    // ──────────────────────────────

    async function init() {
        // Wait for Supabase config to load
        if (window.initSupabasePromise) await window.initSupabasePromise;

        // Load session info
        const sessionData = await fetchJSON('/api/session');

        // Populate sent emails from supabase
        const { data: trackerData } = await window.sbClient.from('job_tracker').select('contact_email, company, job_title');
        if (trackerData) {
            sentEmails = new Set(trackerData.map(r => r.contact_email));
            sentJobKeys = new Set(trackerData.map(r => (r.company || '') + '|' + (r.job_title || '')));
        }

        // Pre-fill credentials from dedicated storage natively
        const savedGmail = localStorage.getItem('rolematch_gmail_email') || '';
        const savedAppPass = localStorage.getItem('rolematch_gmail_pass') || '';
        if (savedGmail) {
            senderEmail = savedGmail;
            if (senderEmailInput) senderEmailInput.value = senderEmail;
        }
        if (savedAppPass) {
            senderPassword = savedAppPass;
            if (senderPassInput) senderPassInput.value = senderPassword;
        }

        if (geminiApiKeyInput) {
            geminiApiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
        }

        // Try to load existing jobs from local storage
        const savedJobs = localStorage.getItem('analyzed_jobs');
        if (savedJobs) {
            try {
                allJobs = JSON.parse(savedJobs);
            } catch(e){}
        }

        renderAll();
    }

    // ──────────────────────────────
    // API HELPERS
    // ──────────────────────────────

    async function fetchJSON(url) {
        try {
            const res = await fetch(`${API_BASE}${url}`);
            return await res.json();
        } catch (e) {
            console.warn(`API error (${url}):`, e);
            return null;
        }
    }

    // ──────────────────────────────
    // SETTINGS PANEL
    // ──────────────────────────────

    if (settingsToggle) {
        settingsToggle.addEventListener('click', () => {
            settingsPanel.classList.toggle('open');
            settingsToggle.textContent = settingsPanel.classList.contains('open') ? '✕ Close' : '⚙️ Settings';
        });
    }

    // Accordion toggles
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('open');
        });
    });

    // Load tracker data into Applied section directly from Supabase
    async function loadTracker() {
        if (window.initSupabasePromise) await window.initSupabasePromise;

        const { data, error } = await window.sbClient.from('job_tracker').select('*').order('created_at', { ascending: false });
        const trackerTable = document.getElementById('trackerTable');
        const trackerBody = document.getElementById('trackerBody');
        const trackerEmpty = document.getElementById('trackerEmpty');

        if (error || !data || data.length === 0) {
            if (trackerEmpty) trackerEmpty.style.display = 'block';
            if (trackerTable) trackerTable.style.display = 'none';
            return;
        }

        if (trackerEmpty) trackerEmpty.style.display = 'none';
        if (trackerTable) trackerTable.style.display = 'table';
        if (trackerBody) {
            trackerBody.innerHTML = data.map(r => `
                <tr>
                    <td>${escHtml(r.company || '—')}</td>
                    <td>${escHtml(r.job_title || '—')}</td>
                    <td>${escHtml(r.contact_email || '—')}</td>
                    <td>${escHtml(r.date_processed || '—')}</td>
                    <td>${escHtml(r.status || '—')}</td>
                </tr>`).join('');
        }
    }
    loadTracker();

    if (saveCredsBtn) {
        saveCredsBtn.addEventListener('click', async () => {
            senderEmail = senderEmailInput.value.trim();
            senderPassword = senderPassInput.value.trim();

            if (!senderEmail || !senderPassword) {
                saveCredsBtn.textContent = '⚠️ Fill both fields';
                setTimeout(() => { saveCredsBtn.textContent = '💾 Save Credentials'; }, 2000);
                return;
            }

            // Save Gmail Credentials securely locally
            localStorage.setItem('rolematch_gmail_email', senderEmail);
            localStorage.setItem('rolematch_gmail_pass', senderPassword);

            const savedUser = JSON.parse(localStorage.getItem('rolematch_user') || '{}');
            const userFullName = savedUser.name || '';

            try {
                const res = await fetch(`${API_BASE}/api/credentials`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: senderEmail, app_password: senderPassword, full_name: userFullName })
                });
                const data = await res.json();
                if (data.success) {
                    saveCredsBtn.textContent = '✓ Saved!';
                    saveCredsBtn.style.background = 'linear-gradient(135deg, #059669, #34d399)';
                    setTimeout(() => {
                        saveCredsBtn.textContent = '💾 Save Credentials';
                        saveCredsBtn.style.background = '';
                    }, 2000);
                }
            } catch (e) {
                saveCredsBtn.textContent = '❌ Server error';
                setTimeout(() => { saveCredsBtn.textContent = '💾 Save Credentials'; }, 2000);
            }
        });
    }

    if (saveApiBtn) {
        saveApiBtn.addEventListener('click', () => {
            const val = geminiApiKeyInput.value.trim();
            localStorage.setItem('gemini_api_key', val);
            saveApiBtn.textContent = '✓ Saved!';
            saveApiBtn.style.background = 'linear-gradient(135deg, #059669, #34d399)';
            setTimeout(() => {
                saveApiBtn.textContent = '💾 Save API Key';
                saveApiBtn.style.background = '';
            }, 2000);
        });
    }

    if (saveSampleBtn) {
        saveSampleBtn.addEventListener('click', async () => {
            const template = sampleEmailInput.value.trim();
            if (!template) {
                saveSampleBtn.textContent = '⚠️ Enter a template';
                setTimeout(() => { saveSampleBtn.textContent = '💾 Save Template'; }, 2000);
                return;
            }

            try {
                await fetch(`${API_BASE}/api/sample-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ template })
                });
                saveSampleBtn.textContent = '✓ Saved!';
                saveSampleBtn.style.background = 'linear-gradient(135deg, #059669, #34d399)';
                setTimeout(() => {
                    saveSampleBtn.textContent = '💾 Save Template';
                    saveSampleBtn.style.background = '';
                }, 2000);
            } catch (e) {
                saveSampleBtn.textContent = '❌ Server error';
                setTimeout(() => { saveSampleBtn.textContent = '💾 Save Template'; }, 2000);
            }
        });
    }

    // ──────────────────────────────
    // ANALYZE WITH AI
    // ──────────────────────────────

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '⏳ Analyzing with AI...';
            if (analyzeStatus) {
                analyzeStatus.textContent = 'Sending job text to AI for analysis and email drafting...';
                analyzeStatus.style.color = '#818cf8';
            }

            try {
                const res = await fetch(`${API_BASE}/api/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sample_email: sampleEmailInput ? sampleEmailInput.value : '',
                        txt_content: localStorage.getItem('txt_content') || '',
                        resume_text: localStorage.getItem('resume_text') || '',
                        user_name: JSON.parse(localStorage.getItem('rolematch_user') || '{}').name || '',
                        gemini_api_key: localStorage.getItem('gemini_api_key') || ''
                    })
                });

                const data = await res.json();

                if (!data.success) {
                    if (analyzeStatus) {
                        analyzeStatus.textContent = '❌ ' + (data.error || 'Analysis failed');
                        analyzeStatus.style.color = '#f87171';
                    }
                    analyzeBtn.textContent = '🤖 Analyze with AI';
                    analyzeBtn.disabled = false;
                    return;
                }

                allJobs = data.jobs;
                localStorage.setItem('analyzed_jobs', JSON.stringify(allJobs));
                renderAll();

                if (analyzeStatus) {
                    analyzeStatus.textContent = `✅ Found ${data.job_count} eligible jobs! Emails drafted & scored.`;
                    analyzeStatus.style.color = '#34d399';
                }

                analyzeBtn.textContent = '🤖 Re-analyze';
                analyzeBtn.disabled = false;

            } catch (e) {
                if (analyzeStatus) {
                    analyzeStatus.textContent = '❌ Cannot connect to server.';
                    analyzeStatus.style.color = '#f87171';
                }
                analyzeBtn.textContent = '🤖 Analyze with AI';
                analyzeBtn.disabled = false;
            }
        });
    }

    // ──────────────────────────────
    // RENDERING
    // ──────────────────────────────

    function renderAll() {
        const filtered = getFilteredJobs();
        renderTable(filtered);
        updateStats(filtered);
    }

    function getFilteredJobs() {
        let jobs = [...allJobs];

        if (activeFilter !== 'all') {
            jobs = jobs.filter(j => j.job_type === activeFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            jobs = jobs.filter(j =>
                (j.job_title || '').toLowerCase().includes(q) ||
                (j.company || '').toLowerCase().includes(q) ||
                (j.skills || '').toLowerCase().includes(q) ||
                (j.location || '').toLowerCase().includes(q) ||
                (j.apply_email || '').toLowerCase().includes(q)
            );
        }

        jobs.sort((a, b) => {
            let valA = a[sortCol] ?? '';
            let valB = b[sortCol] ?? '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });

        return jobs;
    }

    function renderTable(jobs) {
        if (!jobs.length) {
            jobsBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        jobsBody.innerHTML = jobs.map((job, i) => {
            const jobKey = (job.company || '') + '|' + (job.job_title || '');
            const isSent = sentEmails.has(job.apply_email) || sentJobKeys.has(jobKey);
            const badgeClass = getBadgeClass(job.job_type);
            const skills = (job.skills || '').split(',').map(s => s.trim()).filter(Boolean);

            return `
                <tr data-idx="${i}">
                    <td style="color:var(--text-muted); font-weight:700; font-size:.78rem;">${job.job_id}</td>
                    <td>
                        <div class="job-title-cell">
                            <span class="title" title="${escHtml(job.job_title)}">${escHtml(job.job_title)}</span>
                            <span class="company">${escHtml(job.company)}</span>
                        </div>
                    </td>
                    <td><span class="badge ${badgeClass}">${escHtml(job.job_type)}</span></td>
                    <td style="white-space:nowrap;">${escHtml(job.location)}</td>
                    <td>
                        <div class="skills-cell">
                            <span class="skills-preview">🛠 ${skills.length || 0}</span>
                            ${skills.length ? `<div class="skills-popup">${skills.map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join('')}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="details-cell">
                            <div class="details-trigger">📄 View</div>
                            <div class="details-popup">
                                <div class="details-popup-title">${escHtml(job.job_title)} — ${escHtml(job.company)}</div>
                                <div class="details-popup-text">${escHtml(job.description || job.jd_summary || 'No details available.')}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="mail-cell">
                            ${isSent
                    ? `<button class="mail-btn sent" disabled style="margin-bottom:6px; cursor:default;"><span class="btn-label">✓ Sent</span></button>
                       <button class="mail-btn send" data-action="send" data-email="${escHtml(job.apply_email)}" style="margin-bottom:6px; background:linear-gradient(135deg, #f59e0b, #d97706);"><span class="btn-label">↻ Resend</span><div class="spinner-sm"></div></button>
                       <button class="mail-btn preview" data-action="preview" style="border: 1px solid rgba(255,255,255,0.2);"><span class="btn-label">👁 Preview</span></button>`
                    : `<button class="mail-btn send" data-action="send" data-email="${escHtml(job.apply_email)}"><span class="btn-label">📨 Send</span><div class="spinner-sm"></div></button>
                                   <button class="mail-btn preview" data-action="preview"><span class="btn-label">👁 Preview</span></button>`
                }
                        </div>
                    </td>
                </tr>`;
        }).join('');

        // Attach mail button events
        jobsBody.querySelectorAll('.mail-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('tr');
                const idx = parseInt(row.dataset.idx);
                const job = getFilteredJobs()[idx];
                const action = btn.dataset.action;
                if (action === 'preview') openModal(job, idx);
                if (action === 'send') sendEmail(job, btn);
            });
        });
    }

    function updateStats(filteredJobs) {
        const total = allJobs.length;
        const eligible = allJobs.filter(j => {
            const jKey = (j.company || '') + '|' + (j.job_title || '');
            return j.apply_email && j.apply_email.includes('@') && !sentEmails.has(j.apply_email) && !sentJobKeys.has(jKey);
        }).length;
        const sent = sentJobKeys.size || sentEmails.size; // Prefer count of distinct jobs

        animateNumber(statTotal, total);
        animateNumber(statEligible, eligible);
        animateNumber(statSent, sent);
    }

    // ──────────────────────────────
    // FILTERS & SEARCH
    // ──────────────────────────────

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.dataset.filter;
            renderAll();
        });
    });

    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();
        renderAll();
    });

    // ── Sorting ──
    document.querySelectorAll('.jobs-table thead th[data-col]').forEach(th => {
        if (th.dataset.col === 'mail' || th.dataset.col === 'description' || th.dataset.col === 'skills') return;
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (sortCol === col) { sortAsc = !sortAsc; }
            else { sortCol = col; sortAsc = true; }
            document.querySelectorAll('.jobs-table thead th').forEach(h => h.classList.remove('sorted'));
            th.classList.add('sorted');
            const arrow = th.querySelector('.sort-arrow');
            if (arrow) arrow.textContent = sortAsc ? '▲' : '▼';
            renderAll();
        });
    });

    // ──────────────────────────────
    // EMAIL – REAL SENDING VIA API
    // ──────────────────────────────

    function openModal(job, idx) {
        currentMailJobIndex = idx;
        modalTitle.textContent = `✉️ Email — ${job.job_title}`;
        modalTo.value = job.apply_email || '';
        const savedUser = JSON.parse(localStorage.getItem('rolematch_user') || '{}');
        const userName = savedUser.name || 'Job Applicant';

        modalSubject.value = (job.email_subject || '').replace(/\[(?:Your|Sender)\s*Name\]/gi, userName);
        modalBody.value = (job.email_body_draft || '').replace(/\[(?:Your|Sender)\s*Name\]/gi, userName);
        emailModal.classList.add('open');
    }

    function closeModal() {
        emailModal.classList.remove('open');
        currentMailJobIndex = null;
    }

    modalClose.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    emailModal.addEventListener('click', (e) => { if (e.target === emailModal) closeModal(); });

    // Send from modal
    modalSendBtn.addEventListener('click', async () => {
        if (currentMailJobIndex === null) return;
        const job = getFilteredJobs()[currentMailJobIndex];

        modalSendBtn.textContent = '⏳ Sending...';
        modalSendBtn.disabled = true;

        const result = await callSendAPI({
            to: modalTo.value,
            subject: modalSubject.value,
            body: modalBody.value,
            job_id: job.job_id,
            job_title: job.job_title,
            company: job.company
        });

        if (result.success) {
            sentEmails.add(modalTo.value);
            const jobKey = (job.company || '') + '|' + (job.job_title || '');
            sentJobKeys.add(jobKey);
            modalSendBtn.textContent = '✓ Sent!';
            modalSendBtn.style.background = 'linear-gradient(135deg, #059669, #34d399)';
            await delay(800);
            closeModal();
            renderAll();
        } else {
            modalSendBtn.textContent = '❌ ' + (result.error || 'Failed');
            await delay(2000);
        }

        modalSendBtn.textContent = '📨 Send Email';
        modalSendBtn.style.background = '';
        modalSendBtn.disabled = false;
    });

    // Direct send from table button
    async function sendEmail(job, btn) {
        btn.classList.add('loading');
        btn.disabled = true;

        const savedUser = JSON.parse(localStorage.getItem('rolematch_user') || '{}');
        const userName = savedUser.name || 'Job Applicant';

        const formattedSubject = (job.email_subject || '').replace(/\[(?:Your|Sender)\s*Name\]/gi, userName);
        const formattedBody = (job.email_body_draft || '').replace(/\[(?:Your|Sender)\s*Name\]/gi, userName);

        const result = await callSendAPI({
            to: job.apply_email,
            subject: formattedSubject,
            body: formattedBody,
            job_id: job.job_id,
            job_title: job.job_title,
            company: job.company
        });

        btn.classList.remove('loading');

        if (result.success) {
            sentEmails.add(job.apply_email);
            const jobKey = (job.company || '') + '|' + (job.job_title || '');
            sentJobKeys.add(jobKey);
            renderAll();
        } else {
            btn.querySelector('.btn-label').textContent = '❌ Failed';
            btn.disabled = false;
            await delay(2000);
            btn.querySelector('.btn-label').textContent = '📨 Send';
        }
    }

    async function callSendAPI(payload) {
        try {
            const res = await fetch(`${API_BASE}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    sender_email: senderEmail || (senderEmailInput ? senderEmailInput.value : ''),
                    sender_password: senderPassword || (senderPassInput ? senderPassInput.value : ''),
                    resume_path: localStorage.getItem('resume_path') || '',
                    resume_original_name: localStorage.getItem('resume_original_name') || '',
                    resume_base64: localStorage.getItem('resume_base64') || ''
                })
            });
            const result = await res.json();

            if (result.success) {
                // Log to Supabase directly from frontend
                const { data: { user } } = await window.sbClient.auth.getUser();
                if (user) {
                    await window.sbClient.from('job_tracker').insert({
                        user_id: user.id,
                        post_id: String(payload.job_id),
                        job_title: payload.job_title,
                        company: payload.company,
                        contact_email: payload.to,
                        status: 'SENT',
                        relevance: 'YES',
                        email_subject: payload.subject,
                        date_processed: new Date().toLocaleString()
                    });

                    // Ensure sent emails set is updated so buttons re-render correctly
                    sentEmails.add(payload.to);

                    // Reload tracker Table
                    loadTracker();
                }
            }
            return result;
        } catch (e) {
            return { success: false, error: 'Cannot connect to server' };
        }
    }

    // ──────────────────────────────
    // HELPERS
    // ──────────────────────────────

    function getBadgeClass(type) {
        const map = {
            'Internship': 'badge-internship',
            'Full-time': 'badge-fulltime',
            'Contract': 'badge-contract',
            'Part-time': 'badge-parttime'
        };
        return map[type] || 'badge-unknown';
    }



    function escHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function animateNumber(el, target) {
        const start = parseInt(el.textContent) || 0;
        if (start === target) { el.textContent = target; return; }
        const duration = 400;
        const step = (target - start) / (duration / 16);
        let current = start;
        const timer = setInterval(() => {
            current += step;
            if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = Math.round(current);
            }
        }, 16);
    }

    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    function createParticles() {
        const c = document.getElementById('particles');
        if (!c) return;
        for (let i = 0; i < 18; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.top = (40 + Math.random() * 60) + '%';
            p.style.animationDelay = (Math.random() * 6) + 's';
            p.style.animationDuration = (4 + Math.random() * 4) + 's';
            p.style.width = (2 + Math.random() * 2) + 'px';
            p.style.height = p.style.width;
            c.appendChild(p);
        }
    }
});
