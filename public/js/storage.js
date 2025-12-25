// Nama item di localStorage
const HISTORY_KEY = 'myStream_history';
const BOOKMARK_KEY = 'myStream_bookmark';

// --- FUNGSI RIWAYAT NONTON (HISTORY) ---

/**
 * Menyimpan data video ke riwayat nonton.
 * @param {object} videoData - Data video yang akan disimpan.
 *     {
 *         id: string,      // ID unik (episodeId)
 *         title: string,   // Judul episode
 *         poster: string,  // URL poster
 *         link: string     // Link ke halaman nonton
 *     }
 */
function saveToHistory(videoData) {
    if (!videoData || !videoData.id) {
        console.error("Data video tidak valid untuk disimpan ke riwayat.");
        return;
    }

    try {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

        // Hapus entri lama jika ada (berdasarkan ID)
        history = history.filter(item => item.id !== videoData.id);

        // Tambahkan data baru di paling depan
        const newEntry = {
            ...videoData,
            date: new Date().toISOString() // Tambahkan timestamp
        };
        history.unshift(newEntry);

        // Batasi maksimal 50 entri
        if (history.length > 50) {
            history.pop();
        }

        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        console.log("✅ Riwayat disimpan:", videoData.title);
    } catch (e) {
        console.error("Gagal menyimpan riwayat:", e);
    }
}

/**
 * Memuat semua data riwayat nonton dari localStorage.
 * @returns {Array} - Array of history items.
 */
function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
        console.error("Gagal memuat riwayat:", e);
        return [];
    }
}

/**
 * Menghapus semua riwayat nonton.
 */
function clearHistory() {
    if (confirm('Yakin ingin menghapus semua riwayat nonton?')) {
        localStorage.removeItem(HISTORY_KEY);
        console.log("🗑️ Semua riwayat telah dihapus.");
        // Reload halaman untuk melihat perubahan
        location.reload(); 
    }
}


// --- FUNGSI BOOKMARK ---

/**
 * Menyimpan atau menghapus bookmark anime.
 * @param {object} animeData - Data anime yang akan di-bookmark.
 *     {
 *         id: string,      // ID unik (animeId)
 *         title: string,   // Judul anime
 *         poster: string,  // URL poster
 *         link: string     // Link ke halaman detail
 *     }
 */
function toggleBookmark(animeData) {
    if (!animeData || !animeData.id) {
        console.error("Data anime tidak valid untuk bookmark.");
        return;
    }

    try {
        let bookmarks = JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || [];
        const existingIndex = bookmarks.findIndex(item => item.id === animeData.id);

        if (existingIndex > -1) {
            // Jika sudah ada, hapus (unbookmark)
            bookmarks.splice(existingIndex, 1);
            console.log("💔 Bookmark dihapus:", animeData.title);
        } else {
            // Jika belum ada, tambahkan
            const newEntry = {
                ...animeData,
                date: new Date().toISOString()
            };
            bookmarks.unshift(newEntry);
            console.log("❤️ Bookmark disimpan:", animeData.title);
        }

        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
        return existingIndex === -1; // Return true if bookmarked, false if unbookmarked

    } catch (e) {
        console.error("Gagal memanipulasi bookmark:", e);
        return null;
    }
}

/**
 * Memuat semua data bookmark dari localStorage.
 * @returns {Array} - Array of bookmark items.
 */
function getBookmarks() {
    try {
        return JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || [];
    } catch (e) {
        console.error("Gagal memuat bookmark:", e);
        return [];
    }
}

/**
 * Menghapus semua bookmark.
 */
function clearBookmarks() {
    if (confirm('Yakin ingin menghapus semua bookmark?')) {
        localStorage.removeItem(BOOKMARK_KEY);
        console.log("🗑️ Semua bookmark telah dihapus.");
        // Reload halaman untuk melihat perubahan
        location.reload();
    }
}

/**
 * Cek apakah sebuah anime sudah di-bookmark.
 * @param {string} animeId - ID anime yang akan dicek.
 * @returns {boolean} - True jika sudah di-bookmark, false jika belum.
 */
function isBookmarked(animeId) {
    if (!animeId) return false;
    const bookmarks = getBookmarks();
    return bookmarks.some(item => item.id === animeId);
}
