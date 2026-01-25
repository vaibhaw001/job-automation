// Job Scanner - Compact Popup Script
let selectedTime = 60;
let isScanning = false;

document.addEventListener('DOMContentLoaded', function () {
    const platform = document.getElementById('platform');
    const customUrlGroup = document.getElementById('customUrlGroup');
    const customUrl = document.getElementById('customUrl');
    const keyword = document.getElementById('keyword');
    const autoUpload = document.getElementById('autoUpload');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const timer = document.getElementById('timer');
    const progress = document.getElementById('progress');
    const progressFill = document.getElementById('progressFill');
    const status = document.getElementById('status');

    // Load saved settings
    chrome.storage.local.get(['platform', 'keyword', 'time', 'autoUpload', 'customUrl'], (r) => {
        if (r.platform) platform.value = r.platform;
        if (r.keyword) keyword.value = r.keyword;
        if (r.time) selectTime(r.time);
        if (r.autoUpload !== undefined) autoUpload.checked = r.autoUpload;
        if (r.customUrl) customUrl.value = r.customUrl;
        toggleCustomUrl();
    });

    // Check if already scanning
    chrome.runtime.sendMessage({ action: 'getStatus' }, (res) => {
        if (res && res.isScanning) {
            isScanning = true;
            showScanning();
            runTimer(res.timeRemaining, res.totalTime);
        }
    });

    // Platform change
    platform.addEventListener('change', toggleCustomUrl);

    function toggleCustomUrl() {
        customUrlGroup.classList.toggle('active', platform.value === 'other');
    }

    // Time buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => selectTime(parseInt(btn.dataset.time)));
    });

    function selectTime(time) {
        selectedTime = time;
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.time-btn[data-time="${time}"]`)?.classList.add('active');
    }

    // Start scan
    startBtn.addEventListener('click', () => {
        if (!keyword.value.trim()) {
            status.textContent = '❌ Enter a keyword';
            return;
        }
        if (platform.value === 'other' && !customUrl.value.trim()) {
            status.textContent = '❌ Enter custom URL';
            return;
        }

        chrome.storage.local.set({
            platform: platform.value,
            keyword: keyword.value,
            time: selectedTime,
            autoUpload: autoUpload.checked,
            customUrl: customUrl.value
        });

        chrome.runtime.sendMessage({
            action: 'startScan',
            site: platform.value,
            keyword: keyword.value.trim(),
            scanTime: selectedTime,
            customUrl: customUrl.value.trim(),
            autoUpload: autoUpload.checked
        });

        isScanning = true;
        showScanning();
        runTimer(selectedTime, selectedTime);
    });

    // Stop scan
    stopBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'stopScan' });
        isScanning = false;
        hideScanning();
        status.textContent = 'Scan stopped';
    });

    // Listen for updates
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'status') status.textContent = msg.text;
        if (msg.type === 'timerUpdate') updateTimer(msg.remaining);
        if (msg.type === 'complete') {
            isScanning = false;
            hideScanning();
            status.textContent = '✅ Done! ' + msg.filename;
        }
    });

    function showScanning() {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        timer.classList.add('active');
        progress.classList.add('active');
    }

    function hideScanning() {
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        timer.classList.remove('active');
        progress.classList.remove('active');
        progressFill.style.width = '0%';
    }

    function runTimer(remaining, total) {
        updateTimer(remaining);
        const interval = setInterval(() => {
            if (!isScanning) { clearInterval(interval); return; }
            remaining--;
            updateTimer(remaining);
            progressFill.style.width = `${((total - remaining) / total) * 100}%`;
            if (remaining <= 0) clearInterval(interval);
        }, 1000);
    }

    function updateTimer(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        timer.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
});
