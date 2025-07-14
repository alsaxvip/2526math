/**
 * API Service untuk koneksi ke backend Google Apps Script
 * Mengikuti aturan CORS untuk mencegah masalah cross-origin
 */

// URL Google Apps Script yang di-deploy
// PENTING: Ganti URL ini dengan URL deploy yang BARU setelah memperbaiki backend
// Current URLs sudah expired, perlu deploy ulang setelah fix backend
// Lihat README.md untuk panduan cara men-deploy Google Apps Script
// ⚠️  UPDATE URL INI SETELAH DEPLOY ULANG SCRIPT YANG SUDAH DIPERBAIKI ⚠️
const API_URL = 'https://script.google.com/macros/s/AKfycbySZL2MOwlhXi1I4gr1sT1KVMc6pD1WoTYynVp9bzTSBvOFZlBfPV8ZzqS-_qT1zZ5J4g';

// Session credentials - persistent across page refresh
let sessionCredentials = {
  username: '',
  password: ''
};

// Flag to prevent multiple initializations
let sessionInitialized = false;

/**
 * Initialize session from localStorage on app load
 * This ensures session persists across page refresh
 */
export function initializeSession() {
  if (sessionInitialized) {
    console.log('🔒 Session already initialized, skipping...');
    return;
  }

  try {
    const userData = localStorage.getItem('user');
    console.log('🔍 Initializing session, userData from localStorage:', userData ? 'found' : 'not found');
    
    if (userData) {
      const user = JSON.parse(userData);
      console.log('👤 Parsed user data:', { 
        username: user.username, 
        role: user.role, 
        hasPassword: !!user.password 
      });
      
      // Restore credentials from stored user data
      sessionCredentials.username = user.username || '';
      sessionCredentials.password = user.password || '';
      
      console.log('🔐 Session credentials restored:', {
        username: sessionCredentials.username,
        hasPassword: !!sessionCredentials.password
      });
    }
    
    sessionInitialized = true;
  } catch (e) {
    console.error('❌ Error initializing session:', e);
    // If error parsing localStorage, clear it
    localStorage.removeItem('user');
    sessionInitialized = true;
  }
}

// Initialize session when module loads
initializeSession();

/**
 * Set current session credentials and save to localStorage
 */
export function setSessionCredentials(username: string, password: string, userData?: any) {
  console.log('🔐 Setting session credentials for:', username);
  
  sessionCredentials.username = username;
  sessionCredentials.password = password;
  
  // Save to localStorage for persistence
  if (userData) {
    // Include password in stored data for API calls
    const userWithCredentials = {
      ...userData,
      password: password
    };
    
    console.log('💾 Saving user data to localStorage with credentials');
    localStorage.setItem('user', JSON.stringify(userWithCredentials));
  }
  
  console.log('✅ Session credentials set successfully');
}

/**
 * Check if session has credentials
 */
export function hasSessionCredentials() {
  const hasCredentials = sessionCredentials.username !== '' && sessionCredentials.password !== '';
  console.log('🔍 Checking session credentials:', {
    username: sessionCredentials.username,
    hasPassword: !!sessionCredentials.password,
    result: hasCredentials
  });
  return hasCredentials;
}

/**
 * Get current user data from localStorage
 */
export function getCurrentUser() {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
  }
  return null;
}

/**
 * Clear session credentials and localStorage (manual logout only)
 */
export function clearSessionCredentials() {
  console.log('🧹 Clearing session credentials');
  
  sessionCredentials.username = '';
  sessionCredentials.password = '';
  sessionInitialized = false;
  
  // Clear localStorage
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    localStorage.removeItem('credentials');
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Force refresh session credentials from localStorage
 */
export function refreshSessionCredentials() {
  console.log('🔄 Refreshing session credentials from localStorage');
  sessionInitialized = false;
  initializeSession();
}

/**
 * Melakukan request ke Google Apps Script
 * Menggunakan POST dengan URLSearchParams sebagai body (application/x-www-form-urlencoded)
 * Untuk menghindari CORS issue
 */
export async function apiRequest(
  action: string,
  params: Record<string, string | number | boolean> = {}
): Promise<any> {
  try {
    // Buat form data dan tetapkan action
    const formData = new URLSearchParams();
    formData.append('action', action);
    
    // Tambahkan credentials dari session (tidak dari localStorage)
    if (action !== 'login') {
      // Check and refresh session if needed
      if (!hasSessionCredentials()) {
        console.log('⚠️ No session credentials, attempting to refresh from localStorage...');
        refreshSessionCredentials();
        
        // Check again after refresh
        if (!hasSessionCredentials()) {
          return { 
            success: false, 
            error: 'Tidak ada kredensial tersimpan. Silakan login terlebih dahulu.'
          };
        }
      }
      
      formData.append('username', sessionCredentials.username);
      formData.append('password', sessionCredentials.password);
    }
    
    // Tambahkan parameter lainnya
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    
    // Log request untuk debugging (hide password)
    const debugParams = { ...Object.fromEntries(formData.entries()) };
    if (debugParams.password) debugParams.password = '********';
    if (debugParams.studentPassword) debugParams.studentPassword = '********';
    console.log(`API Request: ${action}`, debugParams);
    
    // Extra debugging for delete operations
    if (action.includes('delete') || action.includes('Delete')) {
      console.log('🗑️ DELETE OPERATION DEBUG:');
      console.log('- Action:', action);
      console.log('- Original params:', params);
      console.log('- Form data entries:', Object.fromEntries(formData.entries()));
      
      // Check for any undefined values in form data
      for (const [key, value] of formData.entries()) {
        if (value === 'undefined' || value === 'null' || value === '') {
          console.warn(`⚠️ Potential issue: ${key} = "${value}"`);
        }
      }
    }

    // Extra debugging for add student operations
    if (action === 'addStudent') {
      console.log('➕ ADD STUDENT OPERATION DEBUG:');
      console.log('- Action:', action);
      console.log('- Original params:', params);
      console.log('- Form data entries (exact order):', Object.fromEntries(formData.entries()));
      
      // Show the exact form data that will be sent
      const formDataArray = [];
      for (const [key, value] of formData.entries()) {
        formDataArray.push(`${key}=${value}`);
      }
      console.log('- Form data string:', formDataArray.join('&'));
    }

    // Kirim request tanpa custom headers
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    // If credentials are invalid, clear session
    if (!data.success && data.error === 'Invalid credentials') {
      console.log('❌ Invalid credentials received, clearing session');
      clearSessionCredentials();
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw new Error('Terjadi kesalahan saat menghubungi server');
  }
}

/**
 * Auth API
 */
export const authApi = {
  login: (username: string, password: string) => {
    // Login and store credentials
    return apiRequest('login', { username, password }).then(response => {
      if (response.success) {
        // Store in session memory and localStorage
        setSessionCredentials(username, password, response.user);
      }
      return response;
    });
  },
    
  logout: () => {
    clearSessionCredentials();
    return { success: true };
  },
  
  checkLogin: () => {
    return hasSessionCredentials();
  },
  
  // Verify students data in sheets (for troubleshooting)
  verifyStudents: async () => {
    return apiRequest('verifyStudents');
  },
  
  // Add sample students to classes (for testing)
  addSampleStudents: async () => {
    return apiRequest('addSampleStudents');
  },
  
  // Debug and fix existing data
  debugAndFixData: async () => {
    return apiRequest('debugAndFixData');
  },
  
  // Get demo users for login page (for demo purposes only)
  getDemoUsers: async () => {
    return apiRequest('getDemoUsers');
  }
};

/**
 * Kelas API
 * 
 * Backend functions expect:
 * addClass(teacherUsername, className, description)
 * updateClass(classId, className, description)
 * deleteClass(classId)
 */
export const classApi = {
  getAll: () => {
    // Use session credentials for username
    if (!hasSessionCredentials()) {
      return Promise.resolve({ success: false, error: 'Tidak ada kredensial tersimpan. Silakan login terlebih dahulu.' });
    }
    
    return apiRequest('getClasses', {
      username: sessionCredentials.username
    });
  },
  
  create: (name: string, subject: string, description: string) => {
    // Send subject and description separately - backend will handle the parsing
    const combinedDesc = subject ? `${description} (${subject})` : description;
    
    // Backend uses session username, so we don't need to send teacherUsername
    return apiRequest('addClass', {
      className: name,
      description: combinedDesc
    });
  },
  
  update: (id: string, name: string, subject: string, description: string) => {
    // Send subject and description separately - backend will handle the parsing
    const combinedDesc = subject ? `${description} (${subject})` : description;
    
    return apiRequest('updateClass', {
      classId: id,
      className: name,
      description: combinedDesc
    });
  },
  
  delete: (id: string) => apiRequest('deleteClass', { classId: id }),
  
  // Get class statistics (students, assignments, grades)
  getStats: async (classId: string) => {
    try {
      // Get students count for this class
      const studentsResponse = await apiRequest('getStudents');
      const students = studentsResponse.success ? 
        (studentsResponse.students || []).filter((student: any) => student.classId === classId) : 
        [];
      
      // Get assignments count for this class
      const assignmentsResponse = await apiRequest('getAssignments');
      const assignments = assignmentsResponse.success ? 
        (assignmentsResponse.assignments || []).filter((assignment: any) => assignment.classId === classId) : 
        [];
      
      // Get grades for this class to calculate average
      const gradesResponse = await apiRequest('getGrades');
      const grades = gradesResponse.success ? 
        (gradesResponse.grades || []).filter((grade: any) => grade.classId === classId) : 
        [];
      
      // Calculate average grade
      let averageGrade = null;
      if (grades.length > 0) {
        const validGrades = grades.filter((grade: any) => grade.score && !isNaN(parseFloat(grade.score)));
        if (validGrades.length > 0) {
          const sum = validGrades.reduce((total: number, grade: any) => total + parseFloat(grade.score), 0);
          averageGrade = Math.round((sum / validGrades.length) * 10) / 10; // Round to 1 decimal
        }
      }
      
      return {
        success: true,
        stats: {
          studentsCount: students.length,
          assignmentsCount: assignments.length,
          averageGrade: averageGrade
        }
      };
    } catch (error) {
      console.error('Error getting class stats:', error);
      return {
        success: false,
        error: 'Gagal mengambil statistik kelas'
      };
    }
  }
};

/**
 * Siswa API
 * 
 * Backend functions expect:
 * getStudents(classId)
 * addStudent(classId, studentUsername)
 * removeStudent(classId, studentUsername)
 */
export const studentApi = {
  // Get all students in a class
  getByClass: (classId: string) => apiRequest('getStudents', { classId }),
  
  // Add a student to a class
  addToClass: (classId: string, studentUsername: string) => 
    apiRequest('addStudent', { classId, studentUsername }),
  
  // Remove a student from a class
  removeFromClass: (classId: string, studentUsername: string) => 
    apiRequest('removeStudent', { classId, studentUsername }),
    
  // Get all students (across all classes)
  getAll: () => apiRequest('getStudents'),
  
  // Get a specific student by ID
  getById: (id: string) => apiRequest('getStudent', { id }),
  
  // Create a new student
  create: (classId: string, username: string, fullName: string, password: string = 'pass123') => {
    // Validate required parameters
    if (!username || !fullName) {
      return Promise.resolve({
        success: false,
        error: 'Username dan nama lengkap harus diisi'
      });
    }
    
    // Based on the insertion pattern, try different parameter combinations
    // The backend might expect very specific parameter names
    const params = {
      classId: classId,
      studentUsername: username,
      studentPassword: password,  
      fullName: fullName,
      role: 'student',
      // Try different names for password that might work
      pass: password,
      pwd: password,
      student_password: password
    };
    
    console.log('➕ Creating student with multiple password parameters:', params);
    return apiRequest('addStudent', params);
  },
  
  // Update student details
  update: (studentId: string, fullName: string, password?: string) => {
    // Validate student ID
    if (!studentId || studentId === 'undefined' || studentId === '') {
      return Promise.resolve({
        success: false,
        error: 'ID siswa tidak valid'
      });
    }
    
    if (!fullName) {
      return Promise.resolve({
        success: false,
        error: 'Nama lengkap harus diisi'
      });
    }
    
    // Send multiple parameter names for compatibility with backend
    const params: any = { 
      id: studentId,
      studentId: studentId,
      studentUsername: studentId,
      fullName: fullName
    };
    if (password) params.password = password;
    return apiRequest('updateStudent', params);
  },
  
  // Delete a student
  delete: (studentId: string) => {
    // Validate student ID
    if (!studentId || studentId === 'undefined' || studentId === '' || studentId === 'null') {
      console.error('❌ Invalid student ID for deletion:', studentId);
      return Promise.resolve({
        success: false,
        error: 'ID siswa tidak valid atau kosong'
      });
    }
    
    console.log('🗑️ Attempting to delete student with ID:', studentId);
    console.log('🗑️ Student ID type:', typeof studentId);
    console.log('🗑️ Student ID length:', studentId.length);
    console.log('🗑️ Student ID JSON:', JSON.stringify(studentId));
    
    // The backend expects the composite ID format (e.g., "classId-username")
    // Let's try different parameter names that the backend might expect
    const params = { 
      id: studentId,                    // Try 'id'
      studentId: studentId,             // Try 'studentId'
      studentUsername: studentId        // Try 'studentUsername' 
    };
    console.log('🗑️ Delete parameters:', params);
    
    return apiRequest('deleteStudent', params);
  }
};

/**
 * Tugas API
 */
export const assignmentApi = {
  getAll: () => apiRequest('getAssignments'),
  getByClass: (classId: string) => apiRequest('getAssignments', { classId }),
  getById: (id: string) => apiRequest('getAssignment', { id }),
  create: (classId: string, title: string, description: string, dueDate: string, maxPoints: number = 100) => 
    apiRequest('addAssignment', { classId, title, description, dueDate, maxPoints }),
  update: (id: string, title: string, description: string, dueDate: string, maxPoints: number = 100) => 
    apiRequest('updateAssignment', { id, title, description, dueDate, maxPoints }),
  delete: (id: string) => apiRequest('deleteAssignment', { id })
};

/**
 * Nilai API
 */
export const gradeApi = {
  getAll: () => apiRequest('getGrades'),
  getByClass: (classId: string) => apiRequest('getGrades', { classId }),
  getByAssignment: (assignmentId: string) => apiRequest('getGrades', { assignmentId }),
  getByStudent: (studentId: string) => apiRequest('getGradesByStudent', { studentId }),
  create: (assignmentId: string, studentUsername: string, points: number, feedback: string = '') => 
    apiRequest('addGrade', { assignmentId, studentUsername, points, feedback }),
  update: (id: string, points: number, feedback: string = '') => 
    apiRequest('updateGrade', { id, points, feedback }),
  updateByStudentAssignment: (studentUsername: string, assignmentId: string, points: number, feedback: string = '') => 
    apiRequest('updateGradeByStudentAssignment', { studentUsername, assignmentId, points, feedback }),
  delete: (id: string) => apiRequest('deleteGrade', { id })
};

/**
 * Presensi API
 */
export const attendanceApi = {
  getAll: () => apiRequest('getAttendance'),
  getByClass: (classId: string, date?: string) => {
    const params: Record<string, string> = { classId };
    if (date) params.date = date;
    return apiRequest('getAttendance', params);
  },
  getByStudent: (studentId: string) => apiRequest('getStudentAttendance', { studentId }),
  update: (classId: string, date: string, attendanceData: Record<string, string>) => 
    apiRequest('updateAttendance', { classId, date, attendanceData: JSON.stringify(attendanceData) }),
  // Add single attendance record
  add: (classId: string, date: string, studentUsername: string, status: string, notes?: string) => {
    const params: Record<string, string> = { classId, date, studentUsername, status };
    if (notes) params.notes = notes;
    return apiRequest('addAttendance', params);
  },
  // Delete attendance record
  delete: (id: string) => apiRequest('deleteAttendance', { id }),
  // Get attendance records for a specific date across all classes
  getByDate: (date: string) => apiRequest('getAttendance', { date }),
  // Get attendance summary/statistics
  getSummary: (classId?: string) => {
    const params: Record<string, string> = {};
    if (classId) params.classId = classId;
    return apiRequest('getAttendance', params);
  }
};

/**
 * Jurnal API
 */
export const journalApi = {
  getAll: () => apiRequest('getJournals'),
  getByClass: (classId: string) => apiRequest('getJournals', { classId }),
  create: (classId: string, date: string, topic: string, activities: string, notes: string) => 
    apiRequest('addJournal', { classId, date, topic, activities, notes }),
  update: (id: string, topic: string, activities: string, notes: string) => 
    apiRequest('updateJournal', { journalId: id, topic, activities, notes }),
  delete: (id: string) => apiRequest('deleteJournal', { journalId: id })
};

/**
 * Kegiatan API
 */
export const eventApi = {
  getAll: () => apiRequest('getEvents'),
  getByClass: (classId: string) => apiRequest('getEvents', { classId }),
  create: (classId: string, title: string, description: string, eventDate: string, eventType: string) => 
    apiRequest('addEvent', { classId, title, description, eventDate, eventType }),
  update: (eventId: string, title: string, description: string, eventDate: string, eventType: string) => 
    apiRequest('updateEvent', { eventId, title, description, eventDate, eventType }),
  delete: (eventId: string) => apiRequest('deleteEvent', { eventId })
};

/**
 * Bank Soal API
 */
export const questionBankApi = {
  getAll: () => apiRequest('getQuestions'),
  getByClass: (classId: string) => apiRequest('getQuestions', { classId }),
  getByCategory: (category: string) => apiRequest('getQuestions', { category }),
  create: (classId: string, category: string, questionText: string, options: string[], correctAnswer: string, difficulty: string) => 
    apiRequest('addQuestion', { 
      classId, 
      category, 
      questionText, 
      options: JSON.stringify(options), 
      correctAnswer, 
      difficulty 
    }),
  update: (questionId: string, category: string, questionText: string, options: string[], correctAnswer: string, difficulty: string) => 
    apiRequest('updateQuestion', { 
      questionId, 
      category, 
      questionText, 
      options: JSON.stringify(options), 
      correctAnswer, 
      difficulty 
    }),
  delete: (questionId: string) => apiRequest('deleteQuestion', { questionId })
};

/**
 * Gamifikasi API
 * Works with "Gamification" sheet with columns:
 * classId, studentUsername, points, level, badges, achievements, updatedAt
 */
export const gamificationApi = {
  // Get all gamification data (for leaderboard/overview)
  getAll: () => apiRequest('getGamification'),
  
  // Get gamification data for a specific class
  getByClass: (classId: string) => apiRequest('getGamification', { classId }),
  
  // Get gamification data for a specific student
  getByStudent: (studentUsername: string) => apiRequest('getGamification', { studentUsername }),
  
  // Get student progress/stats
  getStudentProgress: (studentUsername: string) => 
    apiRequest('getGamification', { studentUsername }),
  
  // Award points to a student
  awardPoints: (classId: string, studentUsername: string, points: number, reason: string = '') => 
    apiRequest('awardPoints', { classId, studentUsername, points, reason }),
  
  // Update student level
  updateLevel: (classId: string, studentUsername: string, level: number) => 
    apiRequest('updateGamificationLevel', { classId, studentUsername, level }),
  
  // Award badge to student
  awardBadge: (classId: string, studentUsername: string, badgeId: string, badgeName: string) => 
    apiRequest('awardBadge', { classId, studentUsername, badgeId, badgeName }),
  
  // Add achievement to student
  addAchievement: (classId: string, studentUsername: string, achievementId: string, achievementName: string) => 
    apiRequest('addAchievement', { classId, studentUsername, achievementId, achievementName }),
  
  // Get leaderboard (top students)
  getLeaderboard: (classId?: string) => {
    const params: Record<string, string> = {};
    if (classId) params.classId = classId;
    return apiRequest('getGamificationLeaderboard', params);
  },
  
  // Get achievements for a student
  getAchievements: (studentUsername: string) => 
    apiRequest('getGamification', { studentUsername }),
  
  // Initialize gamification data for a new student
  initializeStudent: (classId: string, studentUsername: string) => 
    apiRequest('initializeGamification', { classId, studentUsername }),
  
  // Update complete gamification record
  update: (classId: string, studentUsername: string, data: {
    points?: number;
    level?: number;
    badges?: string;
    achievements?: string;
  }) => apiRequest('updateGamification', { 
    classId, 
    studentUsername, 
    ...data 
  }),
  
  // Get statistics
  getStats: () => apiRequest('getGamificationStats'),
  
  // Award achievement to student
  awardAchievement: (classId: string, studentUsername: string, achievementId: string) => 
    apiRequest('awardGamificationAchievement', { classId, studentUsername, achievementId })
};

/**
 * Badge API
 * Works with "Badges" sheet with columns:
 * id, name, description, icon, category, pointValue, isActive, awardedCount, createdAt
 */
export const badgeApi = {
  // Get all badges
  getAll: () => apiRequest('getBadges'),
  
  // Create a new badge
  create: (name: string, description: string, icon: string, category: string, pointValue: number) => 
    apiRequest('addBadge', { name, description, icon, category, pointValue }),
  
  // Update an existing badge
  update: (id: number, name: string, description: string, icon: string, category: string, pointValue: number) => 
    apiRequest('updateBadge', { id, name, description, icon, category, pointValue }),
  
  // Delete a badge
  delete: (id: number) => apiRequest('deleteBadge', { id }),
  
  // Toggle badge active status
  toggleStatus: (id: number) => apiRequest('toggleBadgeStatus', { id })
};

/**
 * Level API
 * Works with "Levels" sheet with columns:
 * id, name, pointsRequired, benefits, color, createdAt
 */
export const levelApi = {
  // Get all levels
  getAll: () => apiRequest('getLevels'),
  
  // Create a new level
  create: (name: string, pointsRequired: number, benefits: string, color: string) => 
    apiRequest('addLevel', { name, pointsRequired, benefits, color }),
  
  // Update an existing level
  update: (id: number, name: string, pointsRequired: number, benefits: string, color: string) => 
    apiRequest('updateLevel', { id, name, pointsRequired, benefits, color }),
  
  // Delete a level
  delete: (id: number) => apiRequest('deleteLevel', { id })
};

/**
 * Challenge API
 * Works with "Challenges" sheet with columns:
 * id, title, description, reward, deadline, status, createdAt
 */
export const challengeApi = {
  // Get all challenges
  getAll: () => apiRequest('getChallenges'),
  
  // Create a new challenge
  create: (title: string, description: string, reward: number, deadline: string) => 
    apiRequest('addChallenge', { title, description, reward, deadline }),
  
  // Update an existing challenge
  update: (id: string, title: string, description: string, reward: number, deadline: string) => 
    apiRequest('updateChallenge', { id, title, description, reward, deadline }),
  
  // Delete a challenge
  delete: (id: string) => apiRequest('deleteChallenge', { id }),
  
  // Toggle challenge status
  toggleStatus: (id: string) => apiRequest('toggleChallengeStatus', { id })
};

/**
 * Test API connection for CORS debugging
 */
export const debugApi = {
  // Simple test to check if API is reachable
  testConnection: async () => {
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'login');
      formData.append('username', 'test');
      formData.append('password', 'test');
      
      console.log('Testing API connection...');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        message: 'API connection successful',
        data: data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
      
    } catch (error) {
      console.error('API test failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control')) {
        return {
          success: false,
          error: 'CORS Error: Check deploy settings in Google Apps Script',
          corsIssue: true,
          originalError: errorMessage
        };
      }
      
      return {
        success: false,
        error: errorMessage,
        corsIssue: false
      };
    }
  },
  
  // Get current API URL for debugging
  getApiUrl: () => API_URL
};

/**
 * Students API
 */
export const studentsApi = {
  getAll: () => apiRequest('getStudents'),
  
  getByClass: (classId: string) => {
    return apiRequest('getStudents').then(response => {
      if (response.success) {
        const students = (response.students || []).filter((student: any) => student.classId === classId);
        return { ...response, students };
      }
      return response;
    });
  },
  
  create: (classId: string, username: string, fullName: string, password: string = 'pass123') => {
    // Validate required parameters
    if (!username || !fullName) {
      return Promise.resolve({
        success: false,
        error: 'Username dan nama lengkap harus diisi'
      });
    }
    
    // Based on the insertion pattern, try different parameter combinations
    // The backend might expect very specific parameter names
    const params = {
      classId: classId,
      studentUsername: username,
      studentPassword: password,  
      fullName: fullName,
      role: 'student',
      // Try different names for password that might work
      pass: password,
      pwd: password,
      student_password: password
    };
    
    console.log('➕ Creating student with multiple password parameters:', params);
    return apiRequest('addStudent', params);
  },
  
  update: (studentId: string, fullName: string, password?: string) => {
    // Validate student ID
    if (!studentId || studentId === 'undefined' || studentId === '') {
      return Promise.resolve({
        success: false,
        error: 'ID siswa tidak valid'
      });
    }
    
    if (!fullName) {
      return Promise.resolve({
        success: false,
        error: 'Nama lengkap harus diisi'
      });
    }
    
    // Send multiple parameter names for compatibility with backend
    const params: any = { 
      id: studentId,
      studentId: studentId,
      studentUsername: studentId,
      fullName: fullName
    };
    if (password) params.password = password;
    return apiRequest('updateStudent', params);
  },
  
  delete: (studentId: string) => {
    // Validate student ID
    if (!studentId || studentId === 'undefined' || studentId === '' || studentId === 'null') {
      console.error('❌ Invalid student ID for deletion:', studentId);
      return Promise.resolve({
        success: false,
        error: 'ID siswa tidak valid atau kosong'
      });
    }
    
    console.log('🗑️ Attempting to delete student with ID:', studentId);
    console.log('🗑️ Student ID type:', typeof studentId);
    console.log('🗑️ Student ID length:', studentId.length);
    console.log('🗑️ Student ID JSON:', JSON.stringify(studentId));
    
    // The backend expects the composite ID format (e.g., "classId-username")
    // Let's try different parameter names that the backend might expect
    const params = { 
      id: studentId,                    // Try 'id'
      studentId: studentId,             // Try 'studentId'
      studentUsername: studentId        // Try 'studentUsername' 
    };
    console.log('🗑️ Delete parameters:', params);
    
    return apiRequest('deleteStudent', params);
  }
};

/**
 * Assignments API
 */
export const assignmentsApi = {
  getAll: () => apiRequest('getAssignments'),
  
  getByClass: (classId: string) => {
    return apiRequest('getAssignments').then(response => {
      if (response.success) {
        const assignments = (response.assignments || []).filter((assignment: any) => assignment.classId === classId);
        return { ...response, assignments };
      }
      return response;
    });
  },
  
  create: (classId: string, title: string, description: string, dueDate: string, points: number) =>
    apiRequest('addAssignment', { classId, title, description, dueDate, points }),
  
  update: (assignmentId: string, title: string, description: string, dueDate: string, points: number) =>
    apiRequest('updateAssignment', { assignmentId, title, description, dueDate, points }),
  
  delete: (assignmentId: string) => apiRequest('deleteAssignment', { assignmentId })
};

/**
 * Grades API
 */
export const gradesApi = {
  getAll: () => apiRequest('getGrades'),
  
  getByClass: (classId: string) => {
    return apiRequest('getGrades').then(response => {
      if (response.success) {
        const grades = (response.grades || []).filter((grade: any) => grade.classId === classId);
        return { ...response, grades };
      }
      return response;
    });
  },
  
  getByStudent: (studentUsername: string) => apiRequest('getGradesByStudent', { studentUsername }),
  
  create: (assignmentId: string, studentUsername: string, score: number, feedback?: string) => {
    const params: any = { assignmentId, studentUsername, score };
    if (feedback) params.feedback = feedback;
    return apiRequest('addGrade', params);
  },
  
  update: (gradeId: string, score: number, feedback?: string) => {
    const params: any = { gradeId, score };
    if (feedback) params.feedback = feedback;
    return apiRequest('updateGrade', params);
  },
  
  delete: (gradeId: string) => apiRequest('deleteGrade', { gradeId })
}; 
