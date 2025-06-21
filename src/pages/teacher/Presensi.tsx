import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, Calendar, ChevronLeft, ChevronRight, 
  Download, RefreshCw, Users, CheckCircle, 
  XCircle, AlertTriangle, Heart, BarChart3, Save
} from 'lucide-react';
import { classApi, studentsApi as studentApi, attendanceApi } from '../../lib/api';
import * as XLSX from 'xlsx';

// Enhanced interfaces
interface Class {
  id: string;
  name: string;
  description: string;
  studentCount?: number;
}

interface Student {
  id: string;
  username: string;
  fullName: string;
  classId: string;
}

interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  studentUsername: string;
  status: string;
  notes: string;
}

type AttendanceStatus = 'present' | 'sick' | 'permission' | 'absent';

interface AttendanceStatusMap {
  [studentUsername: string]: AttendanceStatus;
}

// Status configuration
const statusConfig = {
  present: { label: 'Hadir', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100' },
  sick: { label: 'Sakit', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
  permission: { label: 'Izin', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  absent: { label: 'Alfa', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-100' }
};

// Enhanced Loading Skeleton
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-3 sm:space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 sm:h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-2 sm:h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="flex space-x-1 sm:space-x-2">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="w-12 sm:w-16 h-6 sm:h-8 bg-gray-300 rounded-lg"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Enhanced Notification Component
const NotificationToast = ({ notification, onClose }: {
  notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; visible: boolean };
  onClose: () => void;
}) => {
  if (!notification.visible) return null;

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 max-w-md"
      >
        <div className={`p-3 sm:p-4 rounded-xl border shadow-lg ${styles[notification.type]}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium flex-1 pr-2">{notification.message}</span>
            <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700 text-lg">
              ×
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const PresensiPage = () => {
  // Enhanced state management
  const [activeTab, setActiveTab] = useState<'daily' | 'records'>('daily');
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceStatusMap>({});
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  // Pagination and lazy loading for records tab
  const [displayedRecords, setDisplayedRecords] = useState<AttendanceRecord[]>([]);
  const [recordsPage, setRecordsPage] = useState(1);
  const [isLoadingMoreRecords, setIsLoadingMoreRecords] = useState(false);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const recordsPerPage = 20; // Load 20 records at a time
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    visible: boolean;
  }>({ type: 'info', message: '', visible: false });

  // Statistics
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalSick: 0,
    totalPermission: 0,
    totalAbsent: 0
  });

  // Additional statistics info
  const [statsInfo, setStatsInfo] = useState({
    totalRecords: 0,
    uniqueDatesCount: 0,
    uniqueStudentsCount: 0,
    dateRange: ''
  });

  // Notification helper
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 5000);
  };

  // Date formatting
  const formatDateForAPI = (date: Date) => date.toISOString().split('T')[0];
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  // Real-time statistics calculation from all records
  const calculateRealTimeStats = (records: AttendanceRecord[]) => {
    console.log('📊 Calculating real-time stats from', records.length, 'total records');
    
    const stats = {
      totalPresent: 0,
      totalSick: 0,
      totalPermission: 0,
      totalAbsent: 0,
      totalRecords: records.length,
      uniqueDates: new Set<string>(),
      uniqueStudents: new Set<string>()
    };

    records.forEach(record => {
      // Count by status
      switch (record.status) {
        case 'present':
          stats.totalPresent++;
          break;
        case 'sick':
          stats.totalSick++;
          break;
        case 'permission':
          stats.totalPermission++;
          break;
        case 'absent':
          stats.totalAbsent++;
          break;
      }
      
      // Track unique dates and students
      stats.uniqueDates.add(record.date);
      stats.uniqueStudents.add(record.studentUsername);
    });

    // Calculate date range
    let dateRange = '';
    if (stats.uniqueDates.size > 0) {
      const sortedDates = Array.from(stats.uniqueDates).sort();
      const firstDate = new Date(sortedDates[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const lastDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      
      if (sortedDates.length === 1) {
        dateRange = firstDate;
      } else {
        dateRange = `${firstDate} - ${lastDate}`;
      }
    }

    const finalStats = {
      totalPresent: stats.totalPresent,
      totalSick: stats.totalSick,
      totalPermission: stats.totalPermission,
      totalAbsent: stats.totalAbsent,
      totalRecords: stats.totalRecords,
      uniqueDatesCount: stats.uniqueDates.size,
      uniqueStudentsCount: stats.uniqueStudents.size,
      dateRange
    };

    console.log('📊 Calculated stats:', finalStats);
    return finalStats;
  };

  // Enhanced data fetching
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchClasses(), fetchAllRecords()]);
      showNotification('success', 'Data berhasil dimuat');
      
      // Force refresh statistics after initial load
      console.log('🔄 Force refreshing statistics after initial data load');
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showNotification('error', 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classApi.getAll();
      if (response.success) {
        setClasses(response.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async (classId: string) => {
    if (!classId) return;
    
    try {
      setIsLoadingStudents(true);
      const response = await studentApi.getAll();
      if (response.success) {
        const classStudents = response.students.filter((s: Student) => s.classId === classId);
        setStudents(classStudents);
        await fetchAttendanceForDate(classId, formatDateForAPI(selectedDate));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showNotification('error', 'Gagal memuat data siswa');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchAttendanceForDate = async (classId: string, date: string) => {
    try {
      const response = await attendanceApi.getByClass(classId, date);
      if (response.success) {
        const statusMap: AttendanceStatusMap = {};
        response.attendance.forEach((record: AttendanceRecord) => {
          statusMap[record.studentUsername] = record.status as AttendanceStatus;
        });
        setAttendanceData(statusMap);
        
        // Note: We don't update global statistics here anymore
        // Global stats are managed by fetchAllRecords and useEffect
        console.log('📅 Loaded attendance for', date, ':', response.attendance.length, 'records');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchAllRecords = async () => {
    try {
      console.log('📚 Fetching all attendance records...');
      const response = await attendanceApi.getAll();
      if (response.success) {
        const allRecords = response.attendance || [];
        setAttendanceRecords(allRecords);
        
        // Immediately calculate and update global statistics
        if (allRecords.length > 0) {
          const calculatedStats = calculateRealTimeStats(allRecords);
          setStats({
            totalPresent: calculatedStats.totalPresent,
            totalSick: calculatedStats.totalSick,
            totalPermission: calculatedStats.totalPermission,
            totalAbsent: calculatedStats.totalAbsent
          });
          
          setStatsInfo({
            totalRecords: calculatedStats.totalRecords,
            uniqueDatesCount: calculatedStats.uniqueDatesCount,
            uniqueStudentsCount: calculatedStats.uniqueStudentsCount,
            dateRange: calculatedStats.dateRange
          });
          
          console.log('📊 Global stats updated after fetch:', {
            totalRecords: calculatedStats.totalRecords,
            uniqueDates: calculatedStats.uniqueDatesCount,
            uniqueStudents: calculatedStats.uniqueStudentsCount,
            dateRange: calculatedStats.dateRange,
            stats: {
              present: calculatedStats.totalPresent,
              sick: calculatedStats.totalSick,
              permission: calculatedStats.totalPermission,
              absent: calculatedStats.totalAbsent
            }
          });
        } else {
          console.log('📚 No records found, resetting stats');
          setStats({
            totalPresent: 0,
            totalSick: 0,
            totalPermission: 0,
            totalAbsent: 0
          });
          setStatsInfo({
            totalRecords: 0,
            uniqueDatesCount: 0,
            uniqueStudentsCount: 0,
            dateRange: ''
          });
        }
      } else {
        console.error('❌ Failed to fetch all records:', response.error);
        showNotification('error', 'Gagal memuat riwayat presensi: ' + response.error);
      }
    } catch (error) {
      console.error('❌ Error fetching all records:', error);
      showNotification('error', 'Error saat memuat riwayat presensi');
    }
  };

  // Navigation
  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
    if (selectedClass) {
      fetchAttendanceForDate(selectedClass, formatDateForAPI(previousDay));
    }
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
    if (selectedClass) {
      fetchAttendanceForDate(selectedClass, formatDateForAPI(nextDay));
    }
  };

  const setToday = () => {
    const today = new Date();
    setSelectedDate(today);
    if (selectedClass) {
      fetchAttendanceForDate(selectedClass, formatDateForAPI(today));
    }
  };

  // Attendance management
  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setAttendanceData({});
    fetchStudents(classId);
  };

  const handleMarkAllPresent = () => {
    const newData: AttendanceStatusMap = {};
    students.forEach(student => {
      newData[student.username] = 'present';
    });
    setAttendanceData(newData);
    showNotification('success', 'Semua siswa ditandai hadir');
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) {
      showNotification('error', 'Pilih kelas terlebih dahulu');
      return;
    }

    if (Object.keys(attendanceData).length === 0) {
      showNotification('error', 'Tidak ada data presensi untuk disimpan');
      return;
    }

    try {
      setIsSaving(true);
      console.log('💾 Bulk saving attendance data:', attendanceData);
      
      const response = await attendanceApi.update(
        selectedClass,
        formatDateForAPI(selectedDate),
        attendanceData
      );
      
      if (response.success) {
        showNotification('success', 'Presensi berhasil disimpan');
        
        // First refresh all records to update global statistics
        await fetchAllRecords();
        
        // Then refresh current date data for UI display (without overriding stats)
        await fetchAttendanceForDate(selectedClass, formatDateForAPI(selectedDate));
        
        console.log('✅ Attendance saved and statistics updated');
      } else {
        console.error('❌ Failed bulk save:', response.error);
        showNotification('error', 'Gagal menyimpan presensi: ' + response.error);
      }
    } catch (error) {
      console.error('❌ Error saving attendance:', error);
      showNotification('error', 'Error menyimpan presensi');
    } finally {
      setIsSaving(false);
    }
  };

  // Export functionality
  const handleExport = () => {
    const exportData = attendanceRecords.map(record => ({
      Tanggal: record.date,
      Kelas: classes.find(c => c.id === record.classId)?.name || 'Unknown',
      Siswa: record.studentUsername,
      Status: statusConfig[record.status as AttendanceStatus]?.label || record.status,
      Catatan: record.notes
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Presensi');
    XLSX.writeFile(wb, `presensi_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    setShowExportModal(false);
    showNotification('success', 'Data berhasil diekspor');
  };

  // Lazy loading functions for records tab
  const loadInitialRecords = () => {
    if (attendanceRecords.length === 0) {
      setDisplayedRecords([]);
      setHasMoreRecords(false);
      return;
    }
    
    const initialRecords = attendanceRecords.slice(0, recordsPerPage);
    setDisplayedRecords(initialRecords);
    setRecordsPage(1);
    setHasMoreRecords(attendanceRecords.length > recordsPerPage);
    
    console.log('📊 Initial records loaded:', initialRecords.length, 'of', attendanceRecords.length);
  };

  const loadMoreRecords = () => {
    if (isLoadingMoreRecords || !hasMoreRecords) return;
    
    setIsLoadingMoreRecords(true);
    
    // Simulate network delay for better UX
    setTimeout(() => {
      const nextPage = recordsPage + 1;
      const startIndex = recordsPage * recordsPerPage;
      const endIndex = nextPage * recordsPerPage;
      const newRecords = attendanceRecords.slice(startIndex, endIndex);
      
      if (newRecords.length > 0) {
        setDisplayedRecords(prev => [...prev, ...newRecords]);
        setRecordsPage(nextPage);
        setHasMoreRecords(endIndex < attendanceRecords.length);
        
        console.log('📊 More records loaded:', newRecords.length, 'total displayed:', displayedRecords.length + newRecords.length);
      } else {
        setHasMoreRecords(false);
      }
      
      setIsLoadingMoreRecords(false);
    }, 300);
  };

  const resetRecordsPagination = () => {
    setDisplayedRecords([]);
    setRecordsPage(1);
    setHasMoreRecords(true);
    setIsLoadingMoreRecords(false);
  };

  // Infinite scroll handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Check if user has scrolled near the bottom (within 100px)
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (hasMoreRecords && !isLoadingMoreRecords) {
        loadMoreRecords();
      }
    }
  };

  // Load initial records when attendance records change
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      loadInitialRecords();
    } else {
      resetRecordsPagination();
    }
  }, [attendanceRecords]);

  // Auto-refresh statistics whenever attendance records change
  useEffect(() => {
    console.log('📊 Attendance records changed, auto-refreshing stats...');
    console.log('📊 Current attendanceRecords length:', attendanceRecords.length);
    
    if (attendanceRecords.length > 0) {
      const calculatedStats = calculateRealTimeStats(attendanceRecords);
      
      console.log('📊 Setting new global stats:', {
        totalPresent: calculatedStats.totalPresent,
        totalSick: calculatedStats.totalSick,
        totalPermission: calculatedStats.totalPermission,
        totalAbsent: calculatedStats.totalAbsent
      });
      
      setStats({
        totalPresent: calculatedStats.totalPresent,
        totalSick: calculatedStats.totalSick,
        totalPermission: calculatedStats.totalPermission,
        totalAbsent: calculatedStats.totalAbsent
      });
      
      setStatsInfo({
        totalRecords: calculatedStats.totalRecords,
        uniqueDatesCount: calculatedStats.uniqueDatesCount,
        uniqueStudentsCount: calculatedStats.uniqueStudentsCount,
        dateRange: calculatedStats.dateRange
      });
      
      console.log('✅ Global statistics updated successfully');
    } else {
      console.log('📊 No records found, resetting stats to zero');
      setStats({
        totalPresent: 0,
        totalSick: 0,
        totalPermission: 0,
        totalAbsent: 0
      });
      
      setStatsInfo({
        totalRecords: 0,
        uniqueDatesCount: 0,
        uniqueStudentsCount: 0,
        dateRange: ''
      });
    }
  }, [attendanceRecords]);

  // Update statistics when class selection changes (not for initial load)
  useEffect(() => {
    if (attendanceRecords.length > 0 && selectedClass) {
      console.log('📊 Class selection changed, updating stats for class:', selectedClass);
      // Statistics will be calculated in the component render
    }
  }, [selectedClass]);

  // Auto-refresh records when switching to records tab
  useEffect(() => {
    if (activeTab === 'records') {
      console.log('📋 Switched to records tab, ensuring data is fresh...');
      // Only fetch if we don't have recent data
      if (attendanceRecords.length === 0) {
        fetchAllRecords();
      }
    }
  }, [activeTab]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl max-w-sm mx-4"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Memuat Data Presensi</h3>
              <p className="text-xs sm:text-sm text-gray-500">Mohon tunggu sebentar...</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NotificationToast 
        notification={notification} 
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))} 
      />

      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent truncate">
                  Presensi Siswa
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Kelola kehadiran siswa dengan mudah</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={fetchInitialData}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Enhanced Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          {/* Statistics Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Statistik Presensi Real-Time
              </h2>
              <button
                onClick={fetchAllRecords}
                className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors w-full sm:w-auto justify-center"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                Refresh Data
              </button>
            </div>
            
            {/* Statistics Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-200/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600">Total Records:</span>
                  <span className="font-semibold text-gray-900">{statsInfo.totalRecords}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600">Tanggal Recorded:</span>
                  <span className="font-semibold text-gray-900">{statsInfo.uniqueDatesCount} hari</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600">Siswa Tercatat:</span>
                  <span className="font-semibold text-gray-900">{statsInfo.uniqueStudentsCount} siswa</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600">Periode:</span>
                  <span className="font-semibold text-gray-900 truncate">
                    {statsInfo.dateRange || 'Belum ada data'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-green-100 text-xs sm:text-sm font-medium">Total Hadir</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.totalPresent}</p>
                <p className="text-green-200 text-xs mt-1">Semua data</p>
              </div>
              <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white/80 flex-shrink-0 ml-2" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Sakit</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.totalSick}</p>
                <p className="text-blue-200 text-xs mt-1">Semua data</p>
              </div>
              <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-white/80 flex-shrink-0 ml-2" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-yellow-100 text-xs sm:text-sm font-medium">Izin</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.totalPermission}</p>
                <p className="text-yellow-200 text-xs mt-1">Semua data</p>
              </div>
              <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-white/80 flex-shrink-0 ml-2" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-red-100 text-xs sm:text-sm font-medium">Alfa</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.totalAbsent}</p>
                <p className="text-red-200 text-xs mt-1">Semua data</p>
              </div>
              <XCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white/80 flex-shrink-0 ml-2" />
            </div>
          </motion.div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-xl">
          <div className="flex border-b border-gray-200/50 overflow-x-auto">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-center font-medium rounded-tl-2xl transition-all whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Presensi Harian</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('records')}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-center font-medium rounded-tr-2xl transition-all whitespace-nowrap ${
                activeTab === 'records'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Riwayat Presensi</span>
              </div>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'daily' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                      Pilih Kelas
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => handleClassSelect(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    >
                      <option value="">Pilih Kelas...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                      Tanggal
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={goToPreviousDay}
                        className="p-2 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      
                      <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-xl">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 font-medium text-xs sm:text-sm lg:text-base truncate">
                            {formatDate(selectedDate)}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={goToNextDay}
                        className="p-2 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-xl transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                      Aksi Cepat
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={setToday}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all text-xs sm:text-sm font-medium"
                      >
                        Hari Ini
                      </button>
                      
                      <button
                        onClick={handleMarkAllPresent}
                        disabled={!selectedClass || students.length === 0}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all text-xs sm:text-sm font-medium disabled:opacity-50"
                      >
                        Semua Hadir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Students List */}
                {selectedClass && (
                  <div className="bg-white rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Daftar Siswa</h3>
                        <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                          {students.length} siswa
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {isLoadingStudents ? (
                        <div className="p-4 sm:p-6">
                          <LoadingSkeleton />
                        </div>
                      ) : students.length === 0 ? (
                        <div className="p-8 sm:p-12 text-center">
                          <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-base sm:text-lg font-medium text-gray-900">Tidak ada siswa</p>
                          <p className="text-xs sm:text-sm text-gray-500">Silakan pilih kelas yang memiliki siswa</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  No
                                </th>
                                <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Nama Siswa
                                </th>
                                <th className="px-4 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status Kehadiran
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {students.map((student, index) => (
                                <motion.tr 
                                  key={student.id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm mr-3 sm:mr-4 flex-shrink-0">
                                        {student.fullName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{student.fullName}</div>
                                        <div className="text-xs text-gray-500 truncate">{student.username}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
                                      {(['present', 'sick', 'permission', 'absent'] as AttendanceStatus[]).map((status) => (
                                        <button
                                          key={status}
                                          onClick={() => setAttendanceData(prev => ({ ...prev, [student.username]: status }))}
                                          className={`px-2 sm:px-3 py-1 sm:py-2 text-xs font-medium rounded-lg transition-all ${
                                            attendanceData[student.username] === status
                                              ? `${statusConfig[status].color} text-white shadow-md`
                                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                          }`}
                                        >
                                          {statusConfig[status].label}
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {selectedClass && students.length > 0 && (
                      <div className="bg-gray-50/50 px-4 sm:px-6 py-3 sm:py-4 border-t">
                        <div className="flex justify-end">
                          <button
                            onClick={handleSaveAttendance}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 text-xs sm:text-sm"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Simpan Presensi</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'records' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Riwayat Presensi
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {attendanceRecords.length > 0 ? (
                        displayedRecords.length < attendanceRecords.length ? (
                          <>Menampilkan {displayedRecords.length} dari {attendanceRecords.length} records • Scroll ke bawah untuk muat lebih banyak</>
                        ) : (
                          <>Total {attendanceRecords.length} records • Semua data sudah dimuat</>
                        )
                      ) : (
                        'Belum ada data presensi'
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={fetchAllRecords}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Refresh data"
                    >
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <Button
                      onClick={() => setShowExportModal(true)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Export Data</span>
                      <span className="sm:hidden">Export</span>
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border shadow-lg overflow-hidden">
                  <div 
                    className="overflow-x-auto max-h-80 sm:max-h-96 overflow-y-auto"
                    onScroll={handleScroll}
                  >
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tanggal
                          </th>
                          <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kelas
                          </th>
                          <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Siswa
                          </th>
                          <th className="px-4 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Catatan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {displayedRecords.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                              <div className="flex flex-col items-center">
                                <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mb-3" />
                                <p className="text-base sm:text-lg font-medium text-gray-900">Belum ada data presensi</p>
                                <p className="text-xs sm:text-sm text-gray-500">Data akan muncul setelah presensi dilakukan</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          displayedRecords.map((record, index) => (
                            <motion.tr 
                              key={record.id} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                {new Date(record.date).toLocaleDateString('id-ID')}
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                {classes.find(c => c.id === record.classId)?.name || 'Unknown'}
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                {record.studentUsername}
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                <Badge 
                                  variant="outline"
                                  className={`text-xs ${
                                    statusConfig[record.status as AttendanceStatus]?.bgColor || 'bg-gray-100'
                                  } ${
                                    statusConfig[record.status as AttendanceStatus]?.textColor || 'text-gray-700'
                                  } border-transparent`}
                                >
                                  {statusConfig[record.status as AttendanceStatus]?.label || record.status}
                                </Badge>
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {record.notes || '-'}
                              </td>
                            </motion.tr>
                          ))
                        )}
                        
                        {/* Loading more indicator */}
                        {isLoadingMoreRecords && (
                          <tr>
                            <td colSpan={5} className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                <span className="text-xs sm:text-sm text-gray-600">Memuat data...</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Records Summary Footer */}
                  <div className="border-t bg-gray-50/30 px-4 sm:px-6 py-2 sm:py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-gray-600 gap-2">
                      <span>
                        Menampilkan {displayedRecords.length} dari {attendanceRecords.length} records
                      </span>
                      {!hasMoreRecords && attendanceRecords.length > recordsPerPage && (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Semua data telah dimuat
                        </span>
                      )}
                      {hasMoreRecords && !isLoadingMoreRecords && (
                        <Button
                          onClick={loadMoreRecords}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs px-3 py-1"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Load More
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Export Data Presensi</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              Data akan diekspor dalam format Excel (.xlsx)
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium order-2 sm:order-1"
              >
                Batal
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-xs sm:text-sm font-medium order-1 sm:order-2"
              >
                Export
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PresensiPage; 