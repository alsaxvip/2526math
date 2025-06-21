/**
 * Kelas Guru - Google Apps Script Backend
 * Template untuk implementasi backend yang mendukung autentikasi guru dan siswa
 */

// ID Spreadsheet - ganti dengan ID spreadsheet Anda
const SPREADSHEET_ID = 'MASUKKAN_ID_SPREADSHEET_ANDA_DISINI';

// Nama-nama sheet
const STUDENTS_SHEET = 'students';
const ASSIGNMENTS_SHEET = 'assignments';
const GRADES_SHEET = 'grades';
const ATTENDANCE_SHEET = 'attendance';
const JOURNALS_SHEET = 'journals';
const QUESTIONS_SHEET = 'questions';

/**
 * doGet - Handler untuk HTTP GET requests
 * @param {Object} e - Parameter event
 * @return {Object} - Respons JSON
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * doPost - Handler untuk HTTP POST requests
 * @param {Object} e - Parameter event
 * @return {Object} - Respons JSON
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * handleRequest - Fungsi utama untuk semua request
 * @param {Object} e - Parameter event
 * @return {Object} - Respons JSON
 */
function handleRequest(e) {
  // Setup CORS untuk cross-origin request
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  // Tambahkan header CORS
  response.addHeader('Access-Control-Allow-Origin', '*');
  response.addHeader('Access-Control-Allow-Methods', 'GET, POST');
  response.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    // Parse parameter
    var params = e.parameter;
    var action = params.action;
    
    // Jalankan aksi yang sesuai
    var result = {};
    
    switch(action) {
      case 'login':
        result = handleLogin(params.username, params.password);
        break;
      case 'test':
        result = { success: true, message: 'API berhasil terhubung!' };
        break;
      // Tambahkan aksi lain di sini
      default:
        result = { success: false, error: 'Aksi tidak dikenal: ' + action };
    }
    
    response.setContent(JSON.stringify(result));
    return response;
  } catch(error) {
    // Tangkap semua error dan berikan respons yang sesuai
    response.setContent(JSON.stringify({
      success: false,
      error: error.toString()
    }));
    return response;
  }
}

/**
 * handleLogin - Menangani autentikasi user (guru atau siswa)
 * @param {string} username - Username
 * @param {string} password - Password
 * @return {Object} - Informasi user jika berhasil
 */
function handleLogin(username, password) {
  if (!username || !password) {
    return { success: false, error: 'Username dan password diperlukan' };
  }
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const studentsSheet = ss.getSheetByName(STUDENTS_SHEET);
    
    if (!studentsSheet) {
      return { success: false, error: 'Sheet students tidak ditemukan' };
    }
    
    const data = studentsSheet.getDataRange().getValues();
    // Baris pertama adalah header
    const headers = data[0];
    
    // Temukan indeks kolom yang diperlukan
    const usernameIdx = headers.indexOf('username');
    const passwordIdx = headers.indexOf('password');
    const fullNameIdx = headers.indexOf('fullName');
    const roleIdx = headers.indexOf('role');
    const classIdx = headers.indexOf('class');
    const idIdx = headers.indexOf('id');
    
    if (usernameIdx === -1 || passwordIdx === -1 || fullNameIdx === -1 || roleIdx === -1) {
      return { success: false, error: 'Format sheet students tidak valid' };
    }
    
    // Cari user berdasarkan username dan password
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[usernameIdx] === username && row[passwordIdx] === password) {
        // User ditemukan, buat objek user yang akan dikirim ke client
        const user = {
          id: row[idIdx]?.toString() || i.toString(),
          username: row[usernameIdx],
          fullName: row[fullNameIdx],
          role: row[roleIdx],
          class: row[classIdx] || ''
        };
        
        return {
          success: true,
          user: user,
          message: 'Login berhasil'
        };
      }
    }
    
    // User tidak ditemukan atau password salah
    return { success: false, error: 'Username atau password salah' };
  } catch (error) {
    Logger.log('Login error: ' + error);
    return { success: false, error: 'Terjadi kesalahan saat login: ' + error };
  }
}

/**
 * Fungsi bantuan untuk mendapatkan semua data dari sheet dengan header
 * @param {string} sheetName - Nama sheet
 * @return {Array} - Array objek yang mewakili baris data
 */
function getAllDataFromSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error('Sheet ' + sheetName + ' tidak ditemukan');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    
    headers.forEach((header, idx) => {
      obj[header] = row[idx];
    });
    
    result.push(obj);
  }
  
  return result;
} 