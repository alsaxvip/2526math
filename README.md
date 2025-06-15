# Kelas Guru v4

Aplikasi web untuk manajemen kelas dengan fitur lengkap untuk guru dan siswa.

## 🔐 Session Management 

**Session akan tetap aktif sampai logout manual**

- Session disimpan di localStorage dan memory browser
- Saat halaman di-refresh, user tetap login
- Session hanya hilang saat:
  - User klik logout manual
  - User clear browser data
  - Session expired (invalid credentials)

## 🚀 Fitur

### Untuk Guru:
- ✅ Dashboard dengan overview statistik
- ✅ Manajemen kelas (CRUD) - **Functional**
- ✅ Manajemen siswa (CRUD) - **Functional**
- ✅ Tugas dan penilaian
- ✅ Presensi siswa
- ✅ Jurnal pembelajaran
- ✅ Kegiatan/event
- ✅ Bank soal
- ✅ Sistem gamifikasi

### Untuk Siswa:
- ✅ Dashboard personal dengan tampilan RPG
- ✅ Melihat tugas dan nilai
- ✅ Tracking progress belajar
- ✅ Sistem gamifikasi (poin, level, badge)

## 🔧 Setup

1. **Clone dan Install**
   ```bash
   cd kelasguru-v4
   npm install
   npm run dev
   ```

2. **Google Apps Script Backend**
   - Copy kode dari `code.gs` ke Google Apps Script baru
   - Deploy sebagai web app dengan akses "Anyone with the link"
   - Update `API_URL` di `src/lib/api.ts` dengan URL deploy Anda

3. **Google Spreadsheet Database**
   - Buat Google Spreadsheet baru
   - Update `SPREADSHEET_ID` di `code.gs`
   - Jalankan function `setupSpreadsheets()` untuk membuat struktur database

## 👤 Login Demo

Untuk testing, gunakan akun demo:

**Guru:**
- Username: `guru1`
- Password: `pass123`

**Siswa:**
- Username: `belva`
- Password: `pass123`

## 📁 Struktur Database

Database menggunakan Google Spreadsheet dengan 10 sheet:

1. **Users** - Data user umum
2. **Classes** - Data kelas
3. **Students** - Data siswa per kelas
4. **Assignments** - Data tugas
5. **Grades** - Data nilai
6. **Attendance** - Data presensi
7. **Journals** - Jurnal pembelajaran
8. **Events** - Kegiatan/event
9. **QuestionBank** - Bank soal
10. **Gamification** - Data gamifikasi

## 🔒 Security & CORS

- Menggunakan URLSearchParams untuk menghindari CORS issues
- Tidak menggunakan custom headers
- Session management persistent dengan localStorage
- Auto-logout hanya pada invalid credentials

## 🎨 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **UI:** shadcn/ui + TailwindCSS
- **Backend:** Google Apps Script
- **Database:** Google Spreadsheet
- **Routing:** React Router v6

## 📝 API Endpoints

Backend Google Apps Script mendukung endpoint berikut:

### Authentication
- `login` - Login user
- `verifyStudents` - Verifikasi data siswa (admin)

### Classes (Guru)
- `getClasses` - Get daftar kelas
- `addClass` - Tambah kelas baru
- `updateClass` - Update kelas
- `deleteClass` - Hapus kelas

### Students (Guru)
- `getStudents` - Get siswa per kelas
- `addStudent` - Tambah siswa ke kelas
- `createStudent` - Buat siswa baru
- `updateStudent` - Update data siswa
- `deleteStudent` - Hapus siswa

### Dan lainnya untuk Assignments, Grades, Attendance, Journals, Events, Questions, Gamification

## 🚀 Development

```bash
# Development server
npm run dev

# Build untuk production
npm run build

# Preview build
npm run preview
```

## 📱 Responsive Design

- Desktop-first design untuk guru (dashboard profesional)
- Mobile-responsive dengan hamburger menu
- Student dashboard dengan tampilan modern/RPG

## 🎮 Gamifikasi

Sistem gamifikasi terintegrasi:
- Poin dan level untuk siswa
- Badge dan achievement system
- Leaderboard per kelas
- Progress tracking

## 📋 Halaman yang Tersedia

### Guru Dashboard:
- ✅ `/guru` - Dashboard utama
- ✅ `/guru/kelas` - **Manajemen Kelas (CRUD Lengkap)**
- ✅ `/guru/siswa` - **Manajemen Siswa (CRUD Lengkap)**
- 🔄 `/guru/tugas` - Coming Soon
- 🔄 `/guru/nilai` - Coming Soon
- 🔄 `/guru/presensi` - Coming Soon
- 🔄 `/guru/jurnal` - Coming Soon
- 🔄 `/guru/kegiatan` - Coming Soon
- 🔄 `/guru/bank-soal` - Coming Soon
- 🔄 `/guru/gamifikasi` - Coming Soon

### Student Dashboard:
- 🔄 `/siswa` - Dashboard RPG (Coming Soon)

---

*Kelas Guru v4 - Built with ❤️ for education* 