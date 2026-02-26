// ========================================
// login.js – RoleMatch AI Login Page Logic
// ========================================

const API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {

    // ── DOM Elements ──
    const loginForm = document.getElementById('loginForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const togglePwdBtn = document.getElementById('togglePassword');
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    const forgotLink = document.getElementById('forgotPassword');
    const signUpLink = document.getElementById('signUpLink');

    let isSignUpMode = false;
    const formTitle = document.querySelector('.brand h1');
    const formSubtitle = document.querySelector('.brand p');
    const footerText = document.querySelector('.card-footer p');

    // ── Generate floating particles ──
    createParticles();

    // ── Check API health on load ──
    checkHealth();

    // ── Toggle password visibility ──
    togglePwdBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePwdBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    // ── Form submission ──
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Basic validation
        if (isSignUpMode && !fullName) {
            showError('Please enter your full name.');
            fullNameInput.focus();
            return;
        }

        if (!email) {
            showError('Please enter your email address.');
            emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address.');
            emailInput.focus();
            return;
        }

        if (!password) {
            showError('Please enter your password.');
            passwordInput.focus();
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters.');
            passwordInput.focus();
            return;
        }

        // Show loading state
        setLoading(true);

        // Wait for Supabase config to load
        if (window.initSupabasePromise) await window.initSupabasePromise;

        if (!window.sbClient) {
            showError('Supabase configuration failed to load.');
            setLoading(false);
            return;
        }

        try {
            let authData;

            if (isSignUpMode) {
                // 1. Supabase Sign Up
                const { data: signUpData, error: signUpError } = await window.sbClient.auth.signUp({
                    email: email,
                    password: password,
                    options: { data: { full_name: fullName } }
                });

                if (signUpError) {
                    showError(signUpError.message || 'Sign up failed.');
                    setLoading(false);
                    return;
                }

                authData = signUpData;

                // If email confirmation is required but not done
                if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
                    showError('Account may already exist or verification is required.');
                    setLoading(false);
                    return;
                }
            } else {
                // 1. Supabase Sign In (Strictly)
                const { data: signInData, error: signInError } = await window.sbClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (signInError) {
                    showError(signInError.message || 'Login failed. Invalid credentials.');
                    setLoading(false);
                    return;
                }

                authData = signInData;

                // Update full name dynamically if entered during login
                if (fullName && window.sbClient) {
                    window.sbClient.auth.updateUser({ data: { full_name: fullName } });
                }
            }

            // 2. Call backend login API to sync old session state
            const res = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: fullName })
            });

            const data = await res.json();

            if (!data.success) {
                showError(data.error || 'Server session failed. Please try again.');
                setLoading(false);
                return;
            }

            // Store login state + credentials for Gmail sending
            localStorage.setItem('rolematch_user', JSON.stringify({
                name: fullName,
                email: email,
                password: password,
                loggedIn: true,
                timestamp: Date.now()
            }));

            // Also save credentials to server session for email sending
            await fetch(`${API_BASE}/api/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, app_password: password, full_name: fullName })
            }).catch(() => { });

            // Show success briefly then redirect
            loginBtn.classList.remove('loading');
            loginBtn.querySelector('.btn-text').textContent = '✓ Success!';
            loginBtn.querySelector('.btn-text').style.display = 'inline';
            loginBtn.querySelector('.spinner').style.display = 'none';
            loginBtn.style.background = 'linear-gradient(135deg, #059669, #34d399)';

            await delay(800);

            // Redirect to upload page
            window.location.href = 'upload.html';

        } catch (err) {
            showError('Cannot connect to server. Make sure the backend is running.');
            setLoading(false);
        }
    });



    // ── Forgot password link ──
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (email && isValidEmail(email)) {
            showInfo(`Password reset link would be sent to ${email}`);
        } else {
            showError('Enter your email address first, then click "Forgot password?"');
            emailInput.focus();
        }
    });

    // ── Sign up link ──
    footerText.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'signUpLink') {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;

            if (isSignUpMode) {
                loginBtn.querySelector('.btn-text').textContent = 'Sign Up';
                footerText.innerHTML = 'Already have an account? <a href="#" id="signUpLink">Sign In</a>';
                formTitle.textContent = "Create Account";
                formSubtitle.textContent = "Join RoleMatch AI";
                forgotLink.style.display = 'none';
                document.getElementById('fullNameGroup').style.display = 'block';
            } else {
                loginBtn.querySelector('.btn-text').textContent = 'Sign In';
                footerText.innerHTML = 'Don\'t have an account? <a href="#" id="signUpLink">Create one</a>';
                formTitle.textContent = "RoleMatch AI";
                formSubtitle.textContent = "LinkedIn Job Role Automation";
                forgotLink.style.display = 'block';
                document.getElementById('fullNameGroup').style.display = 'none';
            }
            hideError();
        }
    });

    // ── Input focus effects ──
    [fullNameInput, emailInput, passwordInput].forEach(input => {
        if (!input) return;
        input.addEventListener('focus', () => {
            input.closest('.form-group').style.transform = 'scale(1.01)';
            input.closest('.form-group').style.transition = 'transform 0.2s ease';
        });
        input.addEventListener('blur', () => {
            input.closest('.form-group').style.transform = 'scale(1)';
        });
        input.addEventListener('input', () => hideError());
    });


    // ═══════════════════════════════════
    // Helper functions
    // ═══════════════════════════════════

    async function checkHealth() {
        try {
            const res = await fetch(`${API_BASE}/api/health`);
            const data = await res.json();
            if (data.status === 'ok') {
                console.log('✅ Backend connected. Gemini key:', data.gemini_key_loaded ? 'loaded' : 'missing');
            }
        } catch (e) {
            console.warn('⚠️ Backend not reachable at', API_BASE);
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(message) {
        errorText.textContent = message;
        errorMsg.classList.add('visible');
        errorMsg.style.background = 'rgba(248, 113, 113, 0.1)';
        errorMsg.style.borderColor = 'rgba(248, 113, 113, 0.25)';
        errorMsg.style.color = '#f87171';
        errorMsg.querySelector('span:first-child').textContent = '⚠️';
    }

    function showInfo(message) {
        errorText.textContent = message;
        errorMsg.classList.add('visible');
        errorMsg.style.background = 'rgba(99, 102, 241, 0.1)';
        errorMsg.style.borderColor = 'rgba(99, 102, 241, 0.25)';
        errorMsg.style.color = '#818cf8';
        errorMsg.querySelector('span:first-child').textContent = 'ℹ️';
    }

    function hideError() {
        errorMsg.classList.remove('visible');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            loginBtn.querySelector('.btn-text').textContent = 'Sign In';
            loginBtn.style.background = '';
        }
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
