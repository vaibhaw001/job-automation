// supabase_init.js
window.supabaseConfigLoaded = false;

window.initSupabase = async function () {
    if (window.sbClient) return;
    try {
        const res = await fetch('http://127.0.0.1:5000/api/config');
        const data = await res.json();
        if (data.supabase_url && data.supabase_key) {
            window.supabaseUrl = data.supabase_url;
            window.supabaseAnonKey = data.supabase_key;
            window.sbClient = supabase.createClient(window.supabaseUrl, window.supabaseAnonKey);
            window.supabaseConfigLoaded = true;
        }
    } catch (e) {
        console.error("Failed to load Supabase config:", e);
    }
};

window.initSupabasePromise = window.initSupabase();
