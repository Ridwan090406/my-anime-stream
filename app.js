const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

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
    // Karena JSON root-nya langsung berisi array di dalam 'data'
    // dan fetchAPI kita sudah mengembalikan response.data.data
    const schedule = await fetchAPI('/anime/schedule');
    
    // Kirim ke view
    res.render('schedule', { schedule: schedule || [] });
});
// 3. PENCARIAN (FIX SPASI)
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

// 5. LIBRARY (DAFTAR ISI A-Z)
app.get('/library', async (req, res) => {
    // Menggunakan endpoint /anime/list untuk mendapatkan daftar A-Z
    const data = await fetchAPI('/anime/unlimited');
    // Biasanya datanya ada di properti 'list' atau langsung array
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
    const data = await fetchAPI(`/anime/episode/${slug}`);
    res.render('watch', { video: data });
});
// 8. AMBIL URL VIDEO PER SERVER (Untuk Ganti Kualitas)
app.get('/get-stream/:serverId', async (req, res) => {
    const serverId = req.params.serverId;
    console.log(`⏳ Request Link Server: ${serverId}`);
    
    // Panggil endpoint /anime/server/:serverId
    const data = await fetchAPI(`/anime/server/${serverId}`);
    
    // Kirim hasil (berupa URL) balik ke browser
    res.json(data); 
});
// 9. HALAMAN RIWAYAT NONTON (HISTORY)
app.get('/history', (req, res) => {
    // Kita render halaman history.ejs
    // Datanya nanti diambil oleh browser (Client-side) dari LocalStorage
    res.render('history');
});
// 10. HALAMAN BOOKMARK (FAVORIT)
app.get('/bookmark', (req, res) => {
    res.render('bookmark');
});
// 11. HALAMAN DOWNLOAD BATCH
app.get('/batch/:slug', async (req, res) => {
    const slug = req.params.slug;
    
    // Kita coba tebak slug batch-nya. 
    // Biasanya slug anime: "judul-anime-sub-indo"
    // Slug batch seringkali: "judul-anime-batch-sub-indo"
    // Jadi kita coba request ke API dengan slug itu.
    
    console.log(`⏳ Mencari Batch: ${slug}`);
    
    // Coba pola 1: Langsung slug (siapa tau dikirim slug batch)
    let data = await fetchAPI(`/anime/batch/${slug}`);
    
    // Jika null, coba pola 2: Tambahkan kata "-batch" sebelum "-sub-indo"
    if (!data && slug.includes('-sub-indo')) {
        const batchSlug = slug.replace('-sub-indo', '-batch-sub-indo');
        console.log(`⏳ Mencari Batch Pola 2: ${batchSlug}`);
        data = await fetchAPI(`/anime/batch/${batchSlug}`);
    }

    res.render('batch', { batch: data, slug: slug });
});
// 404 HANDLER (JIKA ROUTE TIDAK DITEMUKAN)
app.use((req, res) => {
    res.status(404).render('404');
});

// SERVER LISTEN (Ini yang tadi mungkin hilang)
app.listen(PORT, () => {
    console.log(`🚀 Server Full Feature berjalan di http://localhost:${PORT}`);
});
module.exports = app;
