import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import { 
  GraduationCap,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Plus,
  Eye,
  Star,
  Clock,
  Loader2,
  X,
  RefreshCw,
  Save,
  Pencil,
  BarChart,
  ThumbsUp,
  Activity,
  Target
} from 'lucide-react';
import { gradeApi, assignmentApi, classApi, studentApi } from '@/lib/api';
import * as XLSX from 'xlsx';

interface Grade {
  id: string;
  assignmentId: string;
  studentUsername: string;
  studentName: string;
  points: number;
  feedback: string;
  gradedAt: string;
  assignmentInfo?: {
    id: string;
    title: string;
    classId: string;
  };
  maxPoints?: number;
  percentage?: number;
  status?: 'excellent' | 'good' | 'fair' | 'poor';
}

interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
}

interface Class {
  id: string;
  name: string;
  subject?: string;
  description?: string;
}

interface Student {
  id: string;
  username: string;
  fullName: string;
  classId: string;
}

const NilaiPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('grades');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Enhanced UI states
  const [sortBy, setSortBy] = useState<'student' | 'assignment' | 'points' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Notification State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Data states
  const [grades, setGrades] = useState<Grade[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Filter states
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    assignmentId: '',
    studentUsername: '',
    points: '',
    feedback: ''
  });
  
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  // Loading states for different operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      console.log('=== FETCHING INITIAL DATA ===');
      
      // Fetch all necessary data
      await Promise.all([
        fetchClasses(),
        fetchAssignments(),
        fetchStudents(),
        fetchGrades()
      ]);
      
      console.log('=== INITIAL DATA FETCH COMPLETE ===');
    } catch (err) {
      console.error('Error in fetchInitialData:', err);
      setError('Gagal mengambil data. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      console.log('Fetching classes...');
      const response = await classApi.getAll();
      console.log('Classes API response:', response);
      if (response.success) {
        setClasses(response.classes || []);
        console.log('Classes set to state:', response.classes);
      } else {
        console.error('Failed to fetch classes:', response.error);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      console.log('Fetching assignments...');
      const response = await assignmentApi.getAll();
      console.log('Assignments API response:', response);
      if (response.success) {
        setAssignments(response.assignments || []);
        console.log('Assignments set to state:', response.assignments);
      } else {
        console.error('Failed to fetch assignments:', response.error);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('Fetching students...');
      const response = await studentApi.getAll();
      console.log('Students API response:', response);
      if (response.success) {
        setStudents(response.students || []);
        console.log('Students set to state:', response.students);
      } else {
        console.error('Failed to fetch students:', response.error);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchGrades = async () => {
    try {
      console.log('Fetching all grades...');
      
      const response = await gradeApi.getAll();
      console.log('Grades API response:', response);
      
      if (response.success) {
        const gradesData = response.grades || [];
        
        // Enhance grades data with additional calculated fields
        const enhancedGrades = gradesData.map((grade: any) => {
          const assignment = assignments.find(a => a.id === grade.assignmentId);
          const maxPoints = assignment?.maxPoints || 100;
          const percentage = (grade.points / maxPoints) * 100;
          const status = getGradeStatus(grade.points, maxPoints);
          
          // Get student name from the grade data or from students list
          let studentName = grade.studentName;
          if (!studentName) {
            const student = students.find(s => s.username === grade.studentUsername);
            studentName = student?.fullName || grade.studentUsername;
          }
          
          return {
            ...grade,
            studentName,
            maxPoints,
            percentage: Math.round(percentage),
            status
          };
        });
        
        console.log('Setting enhanced grades to state:', enhancedGrades);
        setGrades(enhancedGrades);
      } else {
        console.error('Failed to fetch grades:', response.error);
        setError(response.error || 'Gagal mengambil data nilai');
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Terjadi kesalahan saat mengambil data nilai');
    }
  };

  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
    setSelectedAssignmentId('all'); // Reset assignment filter when class changes
  };

  const handleAssignmentChange = (value: string) => {
    setSelectedAssignmentId(value);
  };

  const handleExportGrades = async () => {
    setIsExporting(true);
    try {
      // Prepare data for export
      const exportData = filteredGrades.map((grade, index) => {
        const assignment = assignments.find(a => a.id === grade.assignmentId);
        const student = students.find(s => s.username === grade.studentUsername);
        
        return {
          'No': index + 1,
          'Nama Siswa': grade.studentName,
          'Username': grade.studentUsername,
          'Kelas': getStudentClassName(grade.studentUsername, grade.assignmentId),
          'Tugas': getAssignmentName(grade.assignmentId),
          'Nilai': grade.points,
          'Nilai Maksimal': assignment?.maxPoints || 100,
          'Persentase': assignment?.maxPoints ? Math.round((grade.points / assignment.maxPoints) * 100) : Math.round(grade.points),
          'Feedback': grade.feedback || '-',
          'Tanggal Dinilai': formatDate(grade.gradedAt),
          'Tanggal Deadline': assignment?.dueDate ? formatDate(assignment.dueDate) : '-'
        };
      });

      if (exportData.length === 0) {
        alert('Tidak ada data nilai untuk diekspor');
        return;
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 20 },  // Nama Siswa
        { wch: 15 },  // Username
        { wch: 10 },  // Kelas
        { wch: 25 },  // Tugas
        { wch: 8 },   // Nilai
        { wch: 12 },  // Nilai Maksimal
        { wch: 10 },  // Persentase
        { wch: 30 },  // Feedback
        { wch: 15 },  // Tanggal Dinilai
        { wch: 15 }   // Tanggal Deadline
      ];
      worksheet['!cols'] = columnWidths;

      // Add header styling
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }

      // Format percentage column
      for (let row = 1; row <= exportData.length; row++) {
        const percentageCell = XLSX.utils.encode_cell({ r: row, c: 7 }); // Column H (Persentase)
        if (worksheet[percentageCell]) {
          worksheet[percentageCell].z = '0"%"'; // Format as percentage
        }
      }

      // Generate filename
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      let filename = `Laporan_Nilai_${dateStr}`;
      
      if (selectedClassId !== 'all') {
        const className = getClassName(selectedClassId);
        filename += `_${className.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      
      if (selectedAssignmentId !== 'all') {
        const assignmentName = getAssignmentName(selectedAssignmentId);
        filename += `_${assignmentName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Nilai');

      // Add summary sheet
      const summaryData = [
        { 'Informasi': 'Total Nilai', 'Nilai': exportData.length },
        { 'Informasi': 'Rata-rata', 'Nilai': exportData.length > 0 ? Math.round(exportData.reduce((sum, item) => sum + item.Nilai, 0) / exportData.length * 100) / 100 : 0 },
        { 'Informasi': 'Nilai Tertinggi', 'Nilai': exportData.length > 0 ? Math.max(...exportData.map(item => item.Nilai)) : 0 },
        { 'Informasi': 'Nilai Terendah', 'Nilai': exportData.length > 0 ? Math.min(...exportData.map(item => item.Nilai)) : 0 },
        { 'Informasi': 'Tanggal Ekspor', 'Nilai': new Date().toLocaleDateString('id-ID') },
        { 'Informasi': 'Filter Kelas', 'Nilai': selectedClassId === 'all' ? 'Semua Kelas' : getClassName(selectedClassId) },
        { 'Informasi': 'Filter Tugas', 'Nilai': selectedAssignmentId === 'all' ? 'Semua Tugas' : getAssignmentName(selectedAssignmentId) }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
      
      // Style summary sheet headers
      ['A1', 'B1'].forEach(cell => {
        if (summarySheet[cell]) {
          summarySheet[cell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      });

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

      // Write and download file
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      alert(`Data nilai berhasil diekspor! File: ${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting grades:', error);
      alert('Terjadi kesalahan saat mengekspor data nilai');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      id: '',
      assignmentId: selectedAssignmentId !== 'all' ? selectedAssignmentId : '',
      studentUsername: '',
      points: '',
      feedback: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (grade: Grade) => {
    setFormData({
      id: grade.id,
      assignmentId: grade.assignmentId,
      studentUsername: grade.studentUsername,
      points: grade.points.toString(),
      feedback: grade.feedback
    });
    setShowEditModal(true);
  };

  const handleOpenDetailModal = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowDetailModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.assignmentId || !formData.studentUsername || !formData.points) {
      setError('Tugas, siswa, dan nilai wajib diisi');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await gradeApi.create(
        formData.assignmentId,
        formData.studentUsername,
        parseFloat(formData.points),
        formData.feedback
      );
      
      if (response.success) {
        await fetchGrades();
        setShowAddModal(false);
        setFormData({ id: '', assignmentId: '', studentUsername: '', points: '', feedback: '' });
        showNotification('success', 'Nilai berhasil ditambahkan!');
      } else {
        setError(response.error || 'Gagal menambahkan nilai');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menambah nilai');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.points) {
      setError('Nilai wajib diisi');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await gradeApi.update(
        formData.id,
        parseFloat(formData.points),
        formData.feedback
      );
      
      if (response.success) {
        await fetchGrades();
        setShowEditModal(false);
        showNotification('success', 'Nilai berhasil diperbarui!');
      } else {
        setError(response.error || 'Gagal mengubah nilai');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengubah nilai');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrade = async (id: string) => {
    setError('');
    setIsDeleting(true);
    try {
      const response = await gradeApi.delete(id);
      
      if (response.success) {
        await fetchGrades();
        setDeleteConfirmId(null);
        showNotification('success', 'Nilai berhasil dihapus!');
      } else {
        setError(response.error || 'Gagal menghapus nilai');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menghapus nilai');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getAssignmentName = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    return assignment ? assignment.title : 'Tugas tidak ditemukan';
  };

  const getClassFromAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      return getClassName(assignment.classId);
    }
    return 'Kelas tidak ditemukan';
  };

  const getClassName = (classId: string) => {
    console.log('Looking for class with ID:', classId);
    console.log('Available classes:', classes);
    
    if (!classId) {
      console.log('No classId provided');
      return 'ID kelas tidak valid';
    }
    
    if (!classes || classes.length === 0) {
      console.log('No classes available');
      return 'Data kelas tidak tersedia';
    }
    
    const cls = classes.find(c => c.id === classId);
    console.log('Found class:', cls);
    
    if (!cls) {
      console.log(`Class with ID ${classId} not found`);
      console.log('Available class IDs:', classes.map(c => c.id));
      return 'Kelas tidak ditemukan';
    }
    
    return cls.name || 'Nama kelas tidak tersedia';
  };

  const getStudentClassName = (studentUsername: string, assignmentId?: string) => {
    console.log('Getting class name for student:', studentUsername, 'assignmentId:', assignmentId);
    
    if (!studentUsername) {
      return 'Username tidak valid';
    }
    
    // Pertama coba cari dari data siswa
    if (students && students.length > 0) {
      const student = students.find(s => s.username === studentUsername);
      if (student && student.classId) {
        const className = getClassName(student.classId);
        if (className !== 'Kelas tidak ditemukan') {
          return className;
        }
      }
    }
    
    // Jika tidak ditemukan dari data siswa, coba dari assignment
    if (assignmentId) {
      const classFromAssignment = getClassFromAssignment(assignmentId);
      if (classFromAssignment !== 'Kelas tidak ditemukan') {
        return classFromAssignment;
      }
    }
    
    // Coba cari dari grades yang ada
    const grade = grades.find(g => g.studentUsername === studentUsername);
    if (grade && grade.assignmentId) {
      const classFromAssignment = getClassFromAssignment(grade.assignmentId);
      if (classFromAssignment !== 'Kelas tidak ditemukan') {
        return classFromAssignment;
      }
    }
    
    // Fallback: tampilkan informasi yang tersedia
    const student = students.find(s => s.username === studentUsername);
    if (student && student.classId) {
      return `Kelas ID: ${student.classId}`;
    }
    
    return 'Kelas tidak ditemukan';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const filteredGrades = grades.filter(grade => {
    // Filter berdasarkan search query
    const matchesSearch = !searchQuery || 
      grade.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.studentUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getAssignmentName(grade.assignmentId).toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter berdasarkan kelas yang dipilih
    let matchesClass = true;
    if (selectedClassId !== 'all') {
      // Cari assignment untuk mendapatkan classId
      const assignment = assignments.find(a => a.id === grade.assignmentId);
              if (assignment) {
          matchesClass = assignment.classId === selectedClassId;
        } else {
          // Jika assignment tidak ditemukan, coba dari data siswa
          const student = students.find(s => s.username === grade.studentUsername);
          if (student) {
            matchesClass = student.classId === selectedClassId;
          } else {
            matchesClass = false;
          }
        }
    }
    
    // Filter berdasarkan assignment yang dipilih
    const matchesAssignment = selectedAssignmentId === 'all' || grade.assignmentId === selectedAssignmentId;
    
    return matchesSearch && matchesClass && matchesAssignment;
  }).sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'student':
        aValue = a.studentName.toLowerCase();
        bValue = b.studentName.toLowerCase();
        break;
      case 'assignment':
        aValue = getAssignmentName(a.assignmentId).toLowerCase();
        bValue = getAssignmentName(b.assignmentId).toLowerCase();
        break;
      case 'points':
        aValue = a.points;
        bValue = b.points;
        break;
      case 'date':
        aValue = new Date(a.gradedAt).getTime();
        bValue = new Date(b.gradedAt).getTime();
        break;
      default:
        aValue = new Date(a.gradedAt).getTime();
        bValue = new Date(b.gradedAt).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredAssignments = assignments.filter(assignment => {
    if (selectedClassId === 'all') return true;
    return assignment.classId === selectedClassId;
  });

  const filteredStudents = students.filter(student => {
    if (selectedClassId === 'all') return true;
    return student.classId === selectedClassId;
  });

  // Enhanced statistics
  const getEnhancedStats = () => {
    const total = filteredGrades.length;
    const averageScore = total > 0 
      ? filteredGrades.reduce((sum, grade) => sum + grade.points, 0) / total 
      : 0;
    const highestScore = total > 0 
      ? Math.max(...filteredGrades.map(grade => grade.points)) 
      : 0;
    const lowestScore = total > 0 
      ? Math.min(...filteredGrades.map(grade => grade.points)) 
      : 0;
    
    const excellentCount = filteredGrades.filter(g => g.status === 'excellent').length;
    const goodCount = filteredGrades.filter(g => g.status === 'good').length;
    const fairCount = filteredGrades.filter(g => g.status === 'fair').length;
    const poorCount = filteredGrades.filter(g => g.status === 'poor').length;
    
    const averagePercentage = total > 0 
      ? filteredGrades.reduce((sum, grade) => sum + (grade.percentage || 0), 0) / total 
      : 0;

    return {
      total,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      excellentCount,
      goodCount,
      fairCount,
      poorCount,
      averagePercentage: Math.round(averagePercentage),
      passRate: total > 0 ? Math.round(((excellentCount + goodCount + fairCount) / total) * 100) : 0,
      trend: {
        up: excellentCount + goodCount,
        down: poorCount
      }
    };
  };

  // Calculate statistics
  // const averageScore = filteredGrades.length > 0 
  //   ? filteredGrades.reduce((sum, grade) => sum + grade.points, 0) / filteredGrades.length 
  //   : 0;
  
  // const highestScore = filteredGrades.length > 0 
  //   ? Math.max(...filteredGrades.map(grade => grade.points)) 
  //   : 0;
    
  // const lowestScore = filteredGrades.length > 0 
  //   ? Math.min(...filteredGrades.map(grade => grade.points)) 
  //   : 0;

  // Enhanced helper functions
  const getGradeStatus = (points: number, maxPoints: number = 100): 'excellent' | 'good' | 'fair' | 'poor' => {
    const percentage = (points / maxPoints) * 100;
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 60) return 'fair';
    return 'poor';
  };

  const getGradeStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeStatusText = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'Sangat Baik';
      case 'good':
        return 'Baik';
      case 'fair':
        return 'Cukup';
      case 'poor':
        return 'Perlu Perbaikan';
      default:
        return 'N/A';
    }
  };

  const getGradeStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Star className="w-4 h-4" />;
      case 'good':
        return <ThumbsUp className="w-4 h-4" />;
      case 'fair':
        return <Activity className="w-4 h-4" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedGrades.length === filteredGrades.length) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades(filteredGrades.map(g => g.id));
    }
  };

  const handleSelectGrade = (gradeId: string) => {
    setSelectedGrades(prev => 
      prev.includes(gradeId) 
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedGrades.length === 0) return;
    
    setIsBulkDeleting(true);
    try {
      const deletePromises = selectedGrades.map(id => gradeApi.delete(id));
      await Promise.all(deletePromises);
      
      showNotification('success', `${selectedGrades.length} nilai berhasil dihapus!`);
      setSelectedGrades([]);
      await fetchGrades();
    } catch (error) {
      showNotification('error', 'Gagal menghapus beberapa nilai');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkActions(false);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await fetchInitialData();
    showNotification('success', 'Data berhasil diperbarui!');
    setIsRefreshing(false);
  };

  const getPendingGrades = () => {
    const pendingList: Array<{
      studentUsername: string;
      studentName: string;
      studentClassId: string;
      assignmentId: string;
      assignmentTitle: string;
      assignmentClassName: string;
    }> = [];
    
    // Filter assignments based on selected filters
    const relevantAssignments = assignments.filter(assignment => {
      if (selectedClassId !== 'all') {
        return assignment.classId === selectedClassId;
      }
      if (selectedAssignmentId !== 'all') {
        return assignment.id === selectedAssignmentId;
      }
      return true;
    });
    
    // For each assignment, check which students haven't been graded
    relevantAssignments.forEach(assignment => {
      // Get students for this assignment's class
      const classStudents = students.filter(student => student.classId === assignment.classId);
      
      // Get existing grades for this assignment
      const assignmentGrades = grades.filter(grade => grade.assignmentId === assignment.id);
      const gradedStudentUsernames = new Set(assignmentGrades.map(grade => grade.studentUsername));
      
      // Find students who haven't been graded yet
      const ungradedStudents = classStudents.filter(student => 
        !gradedStudentUsernames.has(student.username)
      );
      
      // Add to pending list
      ungradedStudents.forEach(student => {
        pendingList.push({
          studentUsername: student.username,
          studentName: student.fullName,
          studentClassId: student.classId,
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          assignmentClassName: getClassName(assignment.classId)
        });
      });
    });
    
    return pendingList;
  };

  const handleQuickGrade = (pendingGrade: any) => {
    // Pre-fill form with pending grade data
    setFormData({
      id: '',
      assignmentId: pendingGrade.assignmentId,
      studentUsername: pendingGrade.studentUsername,
      points: '',
      feedback: ''
    });
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
                notification.type === 'success' 
                  ? 'bg-green-50 border-green-400 text-green-800' 
                  : 'bg-red-50 border-red-400 text-red-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{notification.message}</span>
                <button
                  onClick={() => setNotification(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <AnimatedContainer variant={fadeInUp}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Manajemen Nilai
              </h1>
              <p className="text-gray-600 mt-2">Kelola penilaian dan lihat progres siswa dengan analitik mendalam</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedGrades.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedGrades.length} dipilih
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkActions(true)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Terpilih
                  </Button>
                </motion.div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Memperbarui...' : 'Refresh'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex gap-1 items-center"
                onClick={handleExportGrades}
                disabled={isExporting || filteredGrades.length === 0}
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
              </Button>
              <Button 
                onClick={handleOpenAddModal} 
                className="flex gap-1 items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4" />
                <span>Input Nilai Baru</span>
              </Button>
            </div>
          </div>
        </AnimatedContainer>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {/* Enhanced Statistics Cards */}
        <AnimatedContainer variant={slideInFromLeft} delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Nilai</p>
                    <p className="text-2xl font-bold text-blue-600">{getEnhancedStats().total}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rata-rata</p>
                    <p className="text-2xl font-bold text-green-600">{getEnhancedStats().averageScore}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nilai Tertinggi</p>
                    <p className="text-2xl font-bold text-purple-600">{getEnhancedStats().highestScore}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sangat Baik</p>
                    <p className="text-2xl font-bold text-green-600">{getEnhancedStats().excellentCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tingkat Lulus</p>
                    <p className="text-2xl font-bold text-indigo-600">{getEnhancedStats().passRate}%</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Perlu Perbaikan</p>
                    <p className="text-2xl font-bold text-red-600">{getEnhancedStats().poorCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedContainer>

        {/* Enhanced Controls and Filters */}
        <AnimatedContainer variant={fadeInUp} delay={0.3}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Class filter */}
                <div>
                  <label htmlFor="class-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                    Filter Kelas
                  </label>
                  <select 
                    id="class-filter"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                  >
                    <option value="all">Semua Kelas</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assignment filter */}
                <div>
                  <label htmlFor="assignment-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                    Filter Tugas
                  </label>
                  <select 
                    id="assignment-filter"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedAssignmentId}
                    onChange={(e) => handleAssignmentChange(e.target.value)}
                  >
                    <option value="all">Semua Tugas</option>
                    {filteredAssignments.map(assignment => (
                      <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                    Cari Nilai
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Cari siswa atau tugas..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sort by */}
                <div>
                  <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 mb-2 block">
                    Urutkan Berdasarkan
                  </label>
                  <select 
                    id="sort-by"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'student' | 'assignment' | 'points' | 'date')}
                  >
                    <option value="date">Tanggal Terbaru</option>
                    <option value="student">Nama Siswa</option>
                    <option value="assignment">Nama Tugas</option>
                    <option value="points">Nilai</option>
                  </select>
                </div>

                {/* Sort order */}
                <div>
                  <label htmlFor="sort-order" className="text-sm font-medium text-gray-700 mb-2 block">
                    Urutan
                  </label>
                  <select 
                    id="sort-order"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  >
                    <option value="desc">Menurun</option>
                    <option value="asc">Menaik</option>
                  </select>
                </div>
              </div>

              {/* Select All and Results Count */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={filteredGrades.length > 0 && selectedGrades.length === filteredGrades.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                      Pilih Semua
                    </label>
                  </div>
                  <div className="text-sm text-gray-600">
                    Menampilkan {filteredGrades.length} dari {grades.length} nilai
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Tabs */}
        <div className="flex border-b bg-white rounded-t-lg px-6">
          <button
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'grades'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('grades')}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Daftar Nilai ({filteredGrades.length})
            </div>
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Belum Dinilai ({getPendingGrades().length})
            </div>
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            <div className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Analitik Mendalam
            </div>
          </button>
        </div>

        {activeTab === 'grades' && (
          <AnimatedContainer variant={fadeInUp} delay={0.4}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={filteredGrades.length > 0 && selectedGrades.length === filteredGrades.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Siswa</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Tugas</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Nilai</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Feedback</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Tanggal</th>
                      <th className="px-6 py-4 text-right font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    <AnimatePresence>
                      {filteredGrades.length > 0 ? (
                        filteredGrades.map((grade, index) => (
                          <motion.tr 
                            key={grade.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`hover:bg-gray-50 transition-colors ${
                              selectedGrades.includes(grade.id) ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedGrades.includes(grade.id)}
                                onChange={() => handleSelectGrade(grade.id)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{grade.studentName}</div>
                                <div className="text-sm text-gray-500">
                                  {grade.studentUsername} • {getStudentClassName(grade.studentUsername, grade.assignmentId)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <div className="font-medium text-gray-900 truncate">
                                  {getAssignmentName(grade.assignmentId)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Max: {grade.maxPoints || 100} poin
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-gray-900">{grade.points}</span>
                                <div className="text-sm text-gray-500">
                                  <div>{grade.percentage}%</div>
                                  <div>/{grade.maxPoints || 100}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                className={`${getGradeStatusColor(grade.status || 'fair')} border`}
                              >
                                <div className="flex items-center gap-1">
                                  {getGradeStatusIcon(grade.status || 'fair')}
                                  <span>{getGradeStatusText(grade.status || 'fair')}</span>
                                </div>
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <p className="text-sm text-gray-600 truncate">
                                  {grade.feedback || '-'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">
                                {formatDate(grade.gradedAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDetailModal(grade)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(grade)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirmId(grade.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">
                                  {searchQuery ? 'Tidak ada nilai yang sesuai dengan pencarian' : 'Belum ada nilai'}
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                  {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Mulai tambahkan nilai untuk siswa'}
                                </p>
                              </div>
                              {!searchQuery && (
                                <Button onClick={handleOpenAddModal} className="mt-2">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Tambah Nilai Pertama
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </Card>
          </AnimatedContainer>
        )}

        {activeTab === 'pending' && (
          <AnimatedContainer variant={fadeInUp} delay={0.4}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Siswa</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Tugas</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Kelas</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-right font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    <AnimatePresence>
                      {getPendingGrades().length > 0 ? (
                        getPendingGrades().map((student, index) => (
                          <motion.tr 
                            key={`${student.studentUsername}-${student.assignmentId}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{student.studentName}</div>
                                <div className="text-sm text-gray-500">
                                  {student.studentUsername}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <div className="font-medium text-gray-900 truncate">
                                  {student.assignmentTitle}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <div className="font-medium text-gray-900 truncate">
                                  {student.assignmentClassName}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className="bg-orange-100 text-orange-800 border border-orange-200">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Belum Dinilai</span>
                                </div>
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleQuickGrade(student)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Nilai Sekarang
                              </Button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                              </div>
                              <div>
                                <p className="text-gray-500 font-medium">
                                  Semua Siswa Sudah Dinilai! 🎉
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                  {selectedAssignmentId !== 'all' 
                                    ? `Semua siswa sudah mendapat nilai untuk tugas "${getAssignmentName(selectedAssignmentId)}"` 
                                    : selectedClassId !== 'all'
                                    ? `Semua siswa di kelas "${getClassName(selectedClassId)}" sudah dinilai`
                                    : 'Semua siswa untuk semua tugas sudah mendapat nilai'
                                  }
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </Card>
          </AnimatedContainer>
        )}

        {activeTab === 'analytics' && (
          <AnimatedContainer variant={fadeInUp} delay={0.4}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Distribusi Nilai
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Analisis performa akademik siswa berdasarkan kategori nilai
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">{getEnhancedStats().excellentCount}</div>
                      <div className="text-xs sm:text-sm text-green-700 font-medium">Sangat Baik</div>
                      <div className="text-xs text-green-600">85% - 100%</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">{getEnhancedStats().goodCount}</div>
                      <div className="text-xs sm:text-sm text-blue-700 font-medium">Baik</div>
                      <div className="text-xs text-blue-600">70% - 84%</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-xl sm:text-2xl font-bold text-yellow-600">{getEnhancedStats().fairCount}</div>
                      <div className="text-xs sm:text-sm text-yellow-700 font-medium">Cukup</div>
                      <div className="text-xs text-yellow-600">60% - 69%</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-xl sm:text-2xl font-bold text-red-600">{getEnhancedStats().poorCount}</div>
                      <div className="text-xs sm:text-sm text-red-700 font-medium">Perlu Perbaikan</div>
                      <div className="text-xs text-red-600">{'< 60%'}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span>Tingkat Kelulusan</span>
                        <span className="font-medium">{getEnhancedStats().passRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 sm:h-3 rounded-full transition-all duration-1000" 
                          style={{ width: `${getEnhancedStats().passRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span>Rata-rata Persentase</span>
                        <span className="font-medium">{getEnhancedStats().averagePercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 sm:h-3 rounded-full transition-all duration-1000" 
                          style={{ width: `${getEnhancedStats().averagePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 sm:space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      Statistik Kunci
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Total Nilai</span>
                      <span className="font-bold text-base sm:text-lg">{getEnhancedStats().total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Rata-rata</span>
                      <span className="font-bold text-base sm:text-lg text-blue-600">{getEnhancedStats().averageScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Tertinggi</span>
                      <span className="font-bold text-base sm:text-lg text-green-600">{getEnhancedStats().highestScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Terendah</span>
                      <span className="font-bold text-base sm:text-lg text-red-600">{getEnhancedStats().lowestScore}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      Tren Performa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                          <span className="text-xs sm:text-sm text-gray-600">Performa Baik</span>
                        </div>
                        <span className="font-medium text-green-600 text-sm sm:text-base">{getEnhancedStats().trend.up}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                          <span className="text-xs sm:text-sm text-gray-600">Perlu Perhatian</span>
                        </div>
                        <span className="font-medium text-red-600 text-sm sm:text-base">{getEnhancedStats().trend.down}</span>
                      </div>
                    </div>
                    
                    {getEnhancedStats().trend.down > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs sm:text-sm">
                            <p className="font-medium text-yellow-800">Rekomendasi</p>
                            <p className="text-yellow-700">Ada {getEnhancedStats().trend.down} siswa yang perlu perhatian khusus</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </AnimatedContainer>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4 sm:p-6 mx-4">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Tambah Nilai Baru</h2>
              
              <form onSubmit={handleAddGrade}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="assignmentId" className="text-xs sm:text-sm font-medium">
                      Tugas *
                    </label>
                    <select
                      id="assignmentId"
                      className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.assignmentId}
                      onChange={(e) => handleSelectChange('assignmentId', e.target.value)}
                      required
                    >
                      <option value="">Pilih Tugas</option>
                      {filteredAssignments.map(assignment => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.title} - {getClassName(assignment.classId)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="studentUsername" className="text-xs sm:text-sm font-medium">
                      Siswa *
                    </label>
                    <select
                      id="studentUsername"
                      className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.studentUsername}
                      onChange={(e) => handleSelectChange('studentUsername', e.target.value)}
                      required
                    >
                      <option value="">Pilih Siswa</option>
                      {filteredStudents.map(student => (
                        <option key={student.username} value={student.username}>
                          {student.fullName} ({getStudentClassName(student.username, formData.assignmentId)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="points" className="text-xs sm:text-sm font-medium">
                      Nilai *
                    </label>
                    <Input
                      id="points"
                      name="points"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.points}
                      onChange={handleInputChange}
                      placeholder="Masukkan nilai (0-100)"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="feedback" className="text-xs sm:text-sm font-medium">
                      Feedback
                    </label>
                    <textarea
                      id="feedback"
                      name="feedback"
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      value={formData.feedback}
                      onChange={handleInputChange}
                      placeholder="Masukkan feedback untuk siswa"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddModal(false)}
                      className="order-2 sm:order-1 h-9 text-sm"
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      className="order-1 sm:order-2 h-9 text-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        'Simpan'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Edit Nilai</h2>
              
              <form onSubmit={handleEditGrade}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tugas</label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {getAssignmentName(formData.assignmentId)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Siswa</label>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {students.find(s => s.username === formData.studentUsername)?.fullName} 
                      ({getStudentClassName(formData.studentUsername, formData.assignmentId)})
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="points-edit" className="text-sm font-medium">
                      Nilai *
                    </label>
                    <Input
                      id="points-edit"
                      name="points"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.points}
                      onChange={handleInputChange}
                      placeholder="Masukkan nilai (0-100)"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="feedback-edit" className="text-sm font-medium">
                      Feedback
                    </label>
                    <textarea
                      id="feedback-edit"
                      name="feedback"
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.feedback}
                      onChange={handleInputChange}
                      placeholder="Masukkan feedback untuk siswa"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowEditModal(false)}
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        'Simpan Perubahan'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedGrade && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Detail Nilai</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Siswa</label>
                  <p className="text-lg font-medium">{selectedGrade.studentName}</p>
                  <p className="text-sm text-gray-500">{getStudentClassName(selectedGrade.studentUsername, selectedGrade.assignmentId)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Tugas</label>
                  <p className="text-lg">{getAssignmentName(selectedGrade.assignmentId)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Nilai</label>
                  <p className="text-2xl font-bold text-blue-600">{selectedGrade.points}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Feedback</label>
                  <p className="text-sm">{selectedGrade.feedback || 'Tidak ada feedback'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Dinilai Pada</label>
                  <p className="text-sm">{formatDate(selectedGrade.gradedAt)}</p>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setShowDetailModal(false)}>
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
              <h2 className="text-xl font-bold mb-4">Konfirmasi Hapus</h2>
              <p className="text-gray-500 mb-6">
                Apakah Anda yakin ingin menghapus nilai ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isDeleting}
                >
                  Batal
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => handleDeleteGrade(deleteConfirmId)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menghapus...</span>
                    </div>
                  ) : (
                    'Hapus'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Confirmation Modal */}
        {showBulkActions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus Massal</h3>
                  <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Apakah Anda yakin ingin menghapus <span className="font-semibold">{selectedGrades.length} nilai</span> yang dipilih?
                </p>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700">Data yang dihapus tidak dapat dikembalikan</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowBulkActions(false)}
                  disabled={isBulkDeleting}
                >
                  Batal
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menghapus...</span>
                    </div>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus {selectedGrades.length} Nilai
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NilaiPage; 