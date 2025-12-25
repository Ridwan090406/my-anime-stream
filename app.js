const express = require('express');
const axios = require('axios');
const path = require('path'); // 1. WAJIB ADA: Module Path
const app = express();
const PORT = process.env.PORT || 3000; // 2. WAJIB: Biar ikut port Vercel

// 3. WAJIB: Set Path Absolut untuk Views & Public
// (Tanpa ini, Vercel bingung nyari foldernya dimana)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// BASE URL API
const API_BASE = 'https://www.sankavollerei.com';
const AXIOS_OPTIONS = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

// --- HELPER FUNCTION ---
async function fetchAPI(endpoint) {
    try {
        const url = `${API_BASE}${encodeURI(endpoint)}`;
        console.log(`📡 Request ke: ${url}`);
        const response = await axios.get(url, AXIOS_OPTIONS);
        return response.data.data || response.data;
    } catch (error) {
        console.error(`❌ Error fetching ${endpoint}:`, error.message);
        return null;
    }
}

// 1. HOME (ONGOING & COMPLETED)
app.get('/', async (req, res) => {
    try {
        const page = req.query.page || 1;

        const [ongoingRes, completedRes] = await Promise.all([
            axios.get(`${API_BASE}/anime/ongoing-anime?page=${page}`, AXIOS_OPTIONS),
            axios.get(`${API_BASE}/anime/complete-anime?page=${page}`, AXIOS_OPTIONS)
        ]);

        const ongoing = ongoingRes.data.data?.animeList || ongoingRes.data.data || [];
        const completed = completedRes.data.data?.animeList || completedRes.data.data || [];

        res.render('index', { ongoing, completed, page: parseInt(page), error: null });
    } catch (err) {
        res.render('index', { ongoing: [], completed: [], page: 1, error: 'Gagal koneksi API.' });
    }
});

// 2. JADWAL RILIS
app.get('/schedule', async (req, res) => {
    const schedule = await fetchAPI('/anime/schedule');
    res.render('schedule', { schedule: schedule || [] });
});

// 3. PENCARIAN
app.get('/search', async (req, res) => {
    let query = req.query.q;
    if (!query) return res.redirect('/');

    const cleanQuery = query.trim().replace(/ /g, "+");
    const data = await fetchAPI(`/anime/search/${cleanQuery}`);
    const results = data?.animeList || data || [];

    res.render('search', { results, query });
});

// 4. GENRE
app.get('/genre/:slug', async (req, res) => {
    const slug = req.params.slug;
    const page = req.query.page || 1;
    const data = await fetchAPI(`/anime/genre/${slug}?page=${page}`);
    const results = data?.animeList || data || [];

    res.render('genre', { results, genre: slug, page: parseInt(page) });
});

// 5. LIBRARY
app.get('/library', async (req, res) => {
    const data = await fetchAPI('/anime/unlimited');
    const library = data?.list || data || [];
    res.render('library', { library });
});

// 6. DETAIL ANIME
app.get('/detail/:slug', async (req, res) => {
    const slug = req.params.slug;
    const data = await fetchAPI(`/anime/anime/${slug}`);
    res.render('detail', { anime: data });
});

// 7. NONTON VIDEO
app.get('/watch/:slug', async (req, res) => {
    const slug = req.params.slug;
    const poster = req.query.poster; // Ambil poster dari query
    const data = await fetchAPI(`/anime/episode/${slug}`);
    res.render('watch', { video: data, poster: poster }); // Kirim poster ke EJS
});

// 8. AMBIL URL VIDEO PER SERVER
app.get('/get-stream/:serverId', async (req, res) => {
    const serverId = req.params.serverId;
    console.log(`⏳ Request Link Server: ${serverId}`);
    const data = await fetchAPI(`/anime/server/${serverId}`);
    res.json(data);
});

// 9. HISTORY
app.get('/history', (req, res) => {
    res.render('history');
});

// 10. BOOKMARK
app.get('/bookmark', (req, res) => {
    res.render('bookmark');
});

// 11. DOWNLOAD BATCH
app.get('/batch/:slug', async (req, res) => {
    const slug = req.params.slug;
    console.log(`⏳ Mencari Batch: ${slug}`);

    let data = await fetchAPI(`/anime/batch/${slug}`);

    if (!data && slug.includes('-sub-indo')) {
        const batchSlug = slug.replace('-sub-indo', '-batch-sub-indo');
        console.log(`⏳ Mencari Batch Pola 2: ${batchSlug}`);
        data = await fetchAPI(`/anime/batch/${batchSlug}`);
    }

    res.render('batch', { batch: data, slug: slug });
});

// 404 HANDLER
app.use((req, res) => {
    res.status(404).render('404');
});

// SERVER LISTEN (DUAL MODE: LOCAL & VERCEL)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}

// 4. WAJIB: Export app untuk Vercel
module.exports = app;
