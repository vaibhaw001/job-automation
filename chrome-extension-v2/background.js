// Job Scanner - Background Service Worker (works in background tabs)
let isScanning = false;
let scanTabId = null;
let timeRemaining = 60;
let totalTime = 60;
let timerInterval = null;
let extractedContent = '';
let currentKeyword = '';
let currentSite = 'linkedin';
let autoUpload = true;

const SITES = {
    linkedin: (kw) => `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(kw)}`,
    internshala: (kw) => `https://internshala.com/internships/${kw.replace(/\s+/g, '-')}-internship`,
    indeed: (kw) => `https://in.indeed.com/jobs?q=${encodeURIComponent(kw)}&l=India`,
    naukri: (kw) => `https://www.naukri.com/${kw.replace(/\s+/g, '-')}-jobs`,
    other: (kw, url) => url + encodeURIComponent(kw)
};

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.action === 'startScan') {
        currentSite = msg.site;
        currentKeyword = msg.keyword;
        totalTime = msg.scanTime;
        timeRemaining = totalTime;
        autoUpload = msg.autoUpload;
        startScan(msg.customUrl);
        respond({ ok: true });
    }
    if (msg.action === 'stopScan') {
        stopScan();
        respond({ ok: true });
    }
    if (msg.action === 'getStatus') {
        respond({ isScanning, timeRemaining, totalTime });
    }
    return true;
});

async function startScan(customUrl = '') {
    isScanning = true;
    extractedContent = '';

    try {
        sendStatus('Opening ' + currentSite + '...');
        const url = currentSite === 'other'
            ? SITES.other(currentKeyword, customUrl)
            : SITES[currentSite](currentKeyword);

        // Get the current active tab and update it with the job site URL
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.update(currentTab.id, { url });
        scanTabId = currentTab.id;

        sendStatus('Waiting for page to load...');

        // Wait for tab to fully load
        await waitForLoad(scanTabId);

        // Wait for page content to fully render
        sendStatus('Page loaded, waiting for content...');
        await waitForPageReady(scanTabId);

        sendStatus('Starting scan...');

        // Inject scroll script - only after page is fully ready
        await chrome.scripting.executeScript({
            target: { tabId: scanTabId },
            func: startScroll
        });

        sendStatus('Scanning in background...');

        // Start timer - only after scroll has started
        timerInterval = setInterval(async () => {
            timeRemaining--;
            chrome.runtime.sendMessage({ type: 'timerUpdate', remaining: timeRemaining });

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                await finishScan();
            }
        }, 1000);

    } catch (e) {
        sendStatus('Error: ' + e.message);
        stopScan();
    }
}

function waitForLoad(tabId) {
    return new Promise((resolve, reject) => {
        const check = () => {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) return reject(new Error('Tab closed'));
                if (tab.status === 'complete') resolve();
                else setTimeout(check, 500);
            });
        };
        check();
    });
}

// Wait for page content to be fully ready (DOM loaded + dynamic content)
function waitForPageReady(tabId) {
    return new Promise(async (resolve) => {
        // Inject a script to check if page is truly ready
        const checkReady = async () => {
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId },
                    func: () => {
                        // Check if document is ready and has content
                        const ready = document.readyState === 'complete';
                        const hasContent = document.body && document.body.innerText.length > 500;
                        return ready && hasContent;
                    }
                });

                if (results[0]?.result) {
                    // Additional wait for any lazy-loaded content
                    await sleep(1500);
                    resolve();
                } else {
                    setTimeout(checkReady, 500);
                }
            } catch (e) {
                // If script fails, wait and try again
                setTimeout(checkReady, 500);
            }
        };

        // Initial delay to let page start loading
        await sleep(1000);
        checkReady();
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Injected scroll function
function startScroll() {
    window._scrolling = true;

    // Add visual indicator so the user knows the scanner is actively working
    const indicator = document.createElement('div');
    indicator.id = 'rolematch-scanner-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '20px';
    indicator.style.right = '20px';
    indicator.style.backgroundColor = '#6366f1';
    indicator.style.color = '#ffffff';
    indicator.style.padding = '12px 24px';
    indicator.style.borderRadius = '30px';
    indicator.style.zIndex = '9999999';
    indicator.style.fontFamily = 'sans-serif';
    indicator.style.fontWeight = 'bold';
    indicator.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    indicator.style.pointerEvents = 'none';
    indicator.innerHTML = '🤖 RoleMatch AI: Scanning & Scrolling...';
    document.body.appendChild(indicator);

    const scroll = () => {
        if (!window._scrolling) {
            if (document.getElementById('rolematch-scanner-indicator')) {
                document.getElementById('rolematch-scanner-indicator').remove();
            }
            return;
        }

        // 1. Scroll the main window down a large chunk
        window.scrollBy({ top: 800, behavior: 'smooth' });

        // 2. Automatically find ALL internal scrollable containers and scroll them
        const scrollableElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
        });

        scrollableElements.forEach(el => {
            el.scrollBy({ top: 800, behavior: 'smooth' });
        });

        // 3. Click any "Load More" or "See More" buttons typical of job boards
        document.querySelectorAll('button').forEach(btn => {
            const text = (btn.innerText || '').toLowerCase();
            if (text.includes('load more') || text.includes('see more') || text.includes('show more')) {
                try { btn.click(); } catch (e) { }
            }
        });

        setTimeout(scroll, 800);
    };
    scroll();
}

function stopScroll() {
    window._scrolling = false;
    const indicator = document.getElementById('rolematch-scanner-indicator');
    if (indicator) indicator.remove();
}

async function finishScan() {
    sendStatus('Extracting data...');

    try {
        // Stop scrolling
        await chrome.scripting.executeScript({
            target: { tabId: scanTabId },
            func: stopScroll
        });

        // Extract content based on site
        const results = await chrome.scripting.executeScript({
            target: { tabId: scanTabId },
            func: extractContent,
            args: [currentSite]
        });

        extractedContent = results[0]?.result || '';

        // Generate filename
        const date = new Date().toISOString().slice(0, 10);
        const filename = `${currentSite}_${currentKeyword.replace(/\s+/g, '_')}_${date}.txt`;

        // Download file
        const blob = new Blob([extractedContent], { type: 'text/plain' });
        const dataUrl = await blobToDataUrl(blob);

        await chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: false
        });

        // Auto-upload to RoleMatch AI
        if (autoUpload) {
            await chrome.scripting.executeScript({
                target: { tabId: scanTabId },
                func: uploadToRoleMatch,
                args: [extractedContent, currentKeyword]
            });
        }

        sendStatus('✅ Saved: ' + filename);
        chrome.runtime.sendMessage({ type: 'complete', filename });

        // Navigate same tab to RoleMatch AI and make it active
        if (autoUpload) {
            await chrome.tabs.update(scanTabId, { url: 'https://rolematch.vercel.app/login.html' });
        }

    } catch (e) {
        sendStatus('Error: ' + e.message);
    }

    isScanning = false;
    scanTabId = null;
}

// Content extractor (injected)
function extractContent(site) {
    let content = `Job Scan Results\nPlatform: ${site}\nDate: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;

    // 1. Precise extraction if the CSS tags match (cleanest for AI)
    try {
        if (site === 'linkedin') {
            document.querySelectorAll('.feed-shared-update-v2, .update-components-text, .job-card-container').forEach((el, i) => {
                const text = el.innerText?.trim();
                if (text && text.length > 30) {
                    content += `[${i + 1}]\n${text.slice(0, 2000)}\n\n---\n\n`;
                }
            });
        } else if (site === 'internshala') {
            document.querySelectorAll('.individual_internship, .internship_meta').forEach((el, i) => {
                const title = el.querySelector('.profile, h3')?.innerText || '';
                const company = el.querySelector('.company_name, .company')?.innerText || '';
                const location = el.querySelector('.location_link, .locations')?.innerText || '';
                const stipend = el.querySelector('.stipend, .salary')?.innerText || '';
                if (title) {
                    content += `[${i + 1}] ${title}\nCompany: ${company}\nLocation: ${location}\nStipend: ${stipend}\n\n---\n\n`;
                }
            });
        } else if (site === 'indeed') {
            document.querySelectorAll('.job_seen_beacon, .jobsearch-ResultsList > li').forEach((el, i) => {
                const title = el.querySelector('.jobTitle, h2')?.innerText || '';
                const company = el.querySelector('.companyName, .company')?.innerText || '';
                const location = el.querySelector('.companyLocation, .location')?.innerText || '';
                const salary = el.querySelector('.salary-snippet, .salary')?.innerText || '';
                if (title) {
                    content += `[${i + 1}] ${title}\nCompany: ${company}\nLocation: ${location}\nSalary: ${salary}\n\n---\n\n`;
                }
            });
        } else if (site === 'naukri') {
            document.querySelectorAll('.jobTuple, article.jobTupleHeader').forEach((el, i) => {
                const title = el.querySelector('.title, .jobTitle')?.innerText || '';
                const company = el.querySelector('.companyInfo, .company')?.innerText || '';
                const exp = el.querySelector('.experience, .exp')?.innerText || '';
                const salary = el.querySelector('.salary, .sal')?.innerText || '';
                const location = el.querySelector('.location, .loc')?.innerText || '';
                if (title) {
                    content += `[${i + 1}] ${title}\nCompany: ${company}\nExp: ${exp}\nSalary: ${salary}\nLocation: ${location}\n\n---\n\n`;
                }
            });
        } else {
            // Generic extraction
            document.querySelectorAll('article, .job, .listing, .result, .card').forEach((el, i) => {
                const text = el.innerText?.trim();
                if (text && text.length > 30) {
                    content += `[${i + 1}]\n${text.slice(0, 1500)}\n\n---\n\n`;
                }
            });
        }
    } catch (e) { }

    // 2. ALWAYS fall back to grabbing ALL the raw visible text of the page, ensuring we absolutely never miss anything
    content += "\n=== FULL PAGE TEXT FALLBACK ===\n";
    content += document.body.innerText || 'No content found';

    return content;
}

// Upload to RoleMatch AI via localStorage
function uploadToRoleMatch(content, keyword) {
    localStorage.setItem('rolematch_scan', JSON.stringify({
        content: content,
        keyword: keyword,
        timestamp: Date.now()
    }));
}

function blobToDataUrl(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

function stopScan() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    isScanning = false;
    if (scanTabId) {
        chrome.scripting.executeScript({
            target: { tabId: scanTabId },
            func: stopScroll
        }).catch(() => { });
    }
}

function sendStatus(text) {
    chrome.runtime.sendMessage({ type: 'status', text });
}
