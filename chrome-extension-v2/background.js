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

        // Create a new background tab for scanning so the user can keep browsing
        const newTab = await chrome.tabs.create({ url, active: false }); // We'll make it active initially, or false. Wait, user said "background scrolling". Let's make it active: false.
        scanTabId = newTab.id;

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
    const scroll = () => {
        if (!window._scrolling) return;

        // Scroll the main window
        window.scrollBy(0, 500);

        // Handle sites with internal scroll panes
        const panes = [
            document.documentElement,
            document.body,
            document.querySelector('.jobs-search-results-list'), // LinkedIn old
            document.querySelector('.scaffold-layout__list'), // LinkedIn new
            document.querySelector('.jobsearch-LeftPane') // Indeed
        ];

        for (const pane of panes) {
            if (pane) {
                try { pane.scrollTop += 500; } catch (e) { }
            }
        }

        setTimeout(scroll, 500);
    };
    scroll();
}

function stopScroll() {
    window._scrolling = false;
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
            await chrome.tabs.update(scanTabId, { url: 'https://rolematch.vercel.app/login.html', active: true });
        }

    } catch (e) {
        sendStatus('Error: ' + e.message);
    }

    isScanning = false;
    scanTabId = null;
}

// Content extractor (injected)
function extractContent(site) {
    // Collect ALL visible text on the page natively as the user requested
    let content = `Job Scan Results\nPlatform: ${site}\nDate: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;

    // Fall back to just dumping everything in the DOM body to be 100% sure we get ALL the text
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
