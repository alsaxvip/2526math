import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import { 
  Plus, 
  Search, 
  Users, 
  GraduationCap, 
  Edit,
  Trash2,
  Eye,
  Calendar,
  UserPlus,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  Mail,
  User,
  MoreVertical,
  Download,
  UserCheck,
  UserX,
  Phone,
  MapPin,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { studentsApi, classApi } from '@/lib/api';

interface Student {
  id: string;
  username: string;
  fullName: string;
  classId?: string;
  className?: string;
  role?: string;
  joinedAt?: string;
  backendId?: string;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  description: string;
}

const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form States
  const [newStudent, setNewStudent] = useState({
    username: '',
    password: 'pass123',
    fullName: '',
    classId: ''
  });
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    classId: ''
  });
  
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  
  // Notification State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  useEffect(() => {
    loadClasses();
  }, []);
  
  useEffect(() => {
    if (classes.length > 0) {
      loadStudents();
    }
  }, [classes, selectedClassId]);
  
  useEffect(() => {
    // Filter students based on search term and selected class
    let filtered = students;
    
    // Filter by class
    if (selectedClassId !== 'all') {
      filtered = filtered.filter(student => student.classId === selectedClassId);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, students, selectedClassId]);

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

  const debugStudentData = async () => {
    try {
      console.log('🔍 Debug: Current students in state:', students);
      
      const response = await studentsApi.getAll();
      console.log('🔍 Debug: Raw API response:', response);
      
      if (response.success && response.students) {
        console.log('🔍 Debug: Raw students data:', response.students);
        
        response.students.forEach((student: any, index: number) => {
          console.log(`🔍 Debug: Student ${index + 1}:`, {
            id: student.id,
            studentUsername: student.studentUsername,
            username: student.username,
            fullName: student.fullName,
            classId: student.classId,
            raw: student
          });
        });
      }
      
      showNotification('success', 'Data siswa telah dicetak ke console. Buka Developer Tools untuk melihat.');
    } catch (error) {
      console.error('🔍 Debug error:', error);
      showNotification('error', 'Terjadi kesalahan saat debugging');
    }
  };
  
  const loadClasses = async () => {
    try {
      console.log('🔄 Loading classes for student management...');
      const response = await classApi.getAll();
      if (response.success) {
        setClasses(response.classes || []);
        console.log('✅ Loaded classes:', response.classes?.length || 0);
      } else {
        console.error('❌ Failed to load classes:', response.error);
        showNotification('error', response.error || 'Gagal memuat data kelas');
      }
    } catch (error) {
      console.error('💥 Error loading classes:', error);
      showNotification('error', 'Terjadi kesalahan saat memuat data kelas');
    }
  };
  
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading students...');
      
      const response = await studentsApi.getAll();
      console.log('👥 Students response:', response);
      
      if (response.success) {
        // Process students data to include class name
        // Backend returns: id (composite), username, fullName, classId, role, joinedAt
        const processedStudents = (response.students || [])
          .map((student: any) => {
            const className = getClassName(student.classId);
            
            // Use 'username' field since 'studentUsername' is undefined in backend response
            const studentUsername = student.username || student.studentUsername;
            
            // Skip students without valid username
            if (!studentUsername) {
              console.warn('⚠️ Skipping student without username:', student);
              return null;
            }
            
            return {
              id: student.id, // Keep original backend ID (composite format)
              username: studentUsername,
              fullName: student.fullName || 'Unknown',
              classId: student.classId,
              className,
              role: student.role || 'student',
              joinedAt: student.joinedAt,
              backendId: student.id // Store original backend ID separately
            };
          })
          .filter(Boolean); // Remove null entries
        
        setStudents(processedStudents);
        console.log('✅ Loaded students:', processedStudents.length);
        
        // Log processed students for debugging
        processedStudents.forEach((student: Student, index: number) => {
          console.log(`✅ Processed Student ${index + 1}:`, {
            id: student.id,
            username: student.username,
            backendId: student.backendId,
            fullName: student.fullName
          });
        });
        
        // Log any problematic students for debugging
        const problematicStudents = (response.students || []).filter((student: any) => 
          !student.username && !student.studentUsername
        );
        if (problematicStudents.length > 0) {
          console.warn('⚠️ Found students without username:', problematicStudents);
        }
      } else {
        console.error('❌ Failed to load students:', response.error);
        showNotification('error', response.error || 'Gagal memuat data siswa');
      }
    } catch (error) {
      console.error('💥 Error loading students:', error);
      showNotification('error', 'Terjadi kesalahan saat memuat data siswa');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getClassName = (classId?: string) => {
    if (!classId || classId === '' || classId === 'default') {
      return 'Belum ada kelas';
    }
    
    const foundClass = classes.find(c => c.id === classId);
    return foundClass ? foundClass.name : 'Kelas tidak ditemukan';
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      console.log('➕ Creating student:', newStudent);
      
      const response = await studentsApi.create(
        newStudent.classId,
        newStudent.username,
        newStudent.fullName,
        newStudent.password
      );
      
      console.log('📝 Create response:', response);
      
      if (response.success) {
        setNewStudent({ username: '', password: 'pass123', fullName: '', classId: '' });
        setShowCreateForm(false);
        showNotification('success', `Siswa "${newStudent.fullName}" berhasil dibuat!`);
        await loadStudents();
      } else {
        console.error('❌ Failed to create student:', response.error);
        showNotification('error', response.error || 'Gagal membuat siswa');
      }
    } catch (error) {
      console.error('💥 Error creating student:', error);
      showNotification('error', 'Terjadi kesalahan saat membuat siswa');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.fullName,
      classId: student.classId || ''
    });
    setShowEditForm(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    setIsUpdating(true);

    try {
      console.log('✏️ Updating student:', editingStudent.id, editForm);
      
      const response = await studentsApi.update(
        editingStudent.id,
        editForm.fullName
      );
      
      console.log('📝 Update response:', response);
      
      if (response.success) {
        setShowEditForm(false);
        setEditingStudent(null);
        showNotification('success', `Data siswa "${editForm.fullName}" berhasil diperbarui!`);
        await loadStudents();
      } else {
        console.error('❌ Failed to update student:', response.error);
        showNotification('error', response.error || 'Gagal memperbarui data siswa');
      }
    } catch (error) {
      console.error('💥 Error updating student:', error);
      showNotification('error', 'Terjadi kesalahan saat memperbarui data siswa');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStudent = (student: Student) => {
    setDeletingStudent(student);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    
    // Comprehensive validation and debugging
    console.log('🔍 DEBUG: Deleting student object:', {
      id: deletingStudent.id,
      username: deletingStudent.username,
      fullName: deletingStudent.fullName,
      classId: deletingStudent.classId,
      backendId: deletingStudent.backendId,
      typeof_id: typeof deletingStudent.id,
      id_length: deletingStudent.id?.length,
      id_stringified: JSON.stringify(deletingStudent.id),
      full_object: JSON.stringify(deletingStudent)
    });
    
    // Validate student ID before deleting (use the original backend ID)
    if (!deletingStudent.id || 
        deletingStudent.id === 'undefined' || 
        deletingStudent.id === '' || 
        typeof deletingStudent.id !== 'string' ||
        deletingStudent.id.trim() === '') {
      console.error('❌ Cannot delete student: Invalid ID', deletingStudent);
      showNotification('error', 'Tidak dapat menghapus siswa: ID tidak valid');
      setShowDeleteConfirm(false);
      setDeletingStudent(null);
      return;
    }
    
    setIsDeleting(true);

    try {
      console.log('🗑️ Deleting student with backend ID:', deletingStudent.id);
      
      // Use the original backend ID (composite format) for deletion
      const response = await studentsApi.delete(deletingStudent.id);
      
      console.log('🗑️ Delete response:', response);
      
      if (response.success) {
        setShowDeleteConfirm(false);
        setDeletingStudent(null);
        showNotification('success', `Siswa "${deletingStudent.fullName}" berhasil dihapus!`);
        await loadStudents();
      } else {
        console.error('❌ Failed to delete student:', response.error);
        showNotification('error', response.error || 'Gagal menghapus siswa');
      }
    } catch (error) {
      console.error('💥 Error deleting student:', error);
      showNotification('error', 'Terjadi kesalahan saat menghapus siswa');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Siswa</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola semua siswa dan penempatan kelas</p>
          </div>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 sm:space-x-4 animate-pulse">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 sm:h-8 bg-gray-200 rounded w-16 sm:w-20 flex-shrink-0"></div>
                  <div className="h-6 sm:h-8 bg-gray-200 rounded w-20 sm:w-24 flex-shrink-0"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50/50 min-h-screen p-4 sm:p-6">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50"
          >
            <div className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              )}
              <span className="font-medium text-sm sm:text-base flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <AnimatedContainer variant={fadeInUp}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Siswa</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola semua siswa dan penempatan kelas</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={debugStudentData}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Debug Data
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm"
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Tambah Siswa
            </Button>
          </div>
        </div>
      </AnimatedContainer>

      {/* Search and Filters */}
      <AnimatedContainer variant={slideInFromLeft} delay={0.1}>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari siswa berdasarkan nama, username, atau kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none min-w-0"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="all">Semua Kelas</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                <Badge variant="outline" className="text-xs sm:text-sm whitespace-nowrap">
                  {filteredStudents.length} Siswa
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Modern Table - Desktop View */}
      <AnimatedContainer variant={fadeInUp} delay={0.2}>
        <Card className="border-0 shadow-lg overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Siswa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bergabung
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {student.username}
                              {/* Debug: Show username if it's problematic */}
                              {(!student.username || student.username === 'undefined' || student.username === '') && (
                                <div className="text-xs text-red-500 font-mono bg-red-50 px-1 rounded mt-1">
                                  ⚠️ Invalid Username: "{student.username}"
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                          {student.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={student.className === 'Belum ada kelas' ? 'outline' : 'default'}
                          className={`${
                            student.className === 'Belum ada kelas' 
                              ? 'text-gray-500 border-gray-300' 
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          {student.className}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.joinedAt ? (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(student.joinedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {searchTerm ? 'Tidak ada siswa yang ditemukan' : 'Belum ada siswa'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm 
                            ? 'Coba ubah kata kunci pencarian atau filter kelas'
                            : 'Mulai dengan menambahkan siswa pertama untuk mengelola pembelajaran'
                          }
                        </p>
                        {!searchTerm && (
                          <Button 
                            onClick={() => setShowCreateForm(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Tambah Siswa Pertama
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {filteredStudents.length > 0 ? (
              <div className="p-4 space-y-3">
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{student.fullName}</h3>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{student.username}</span>
                          </p>
                          {/* Debug info for problematic usernames */}
                          {(!student.username || student.username === 'undefined' || student.username === '') && (
                            <div className="text-xs text-red-500 font-mono bg-red-50 px-1 rounded mt-1">
                              ⚠️ Invalid Username: "{student.username}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStudent(student)}
                          className="w-8 h-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStudent(student)}
                          className="w-8 h-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center">
                        <Badge 
                          variant={student.className === 'Belum ada kelas' ? 'outline' : 'default'}
                          className={`text-xs ${
                            student.className === 'Belum ada kelas' 
                              ? 'text-gray-500 border-gray-300' 
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          {student.className}
                        </Badge>
                      </div>
                      {student.joinedAt && (
                        <div className="flex items-center text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>
                            {new Date(student.joinedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Tidak ada siswa yang ditemukan' : 'Belum ada siswa'}
                </h3>
                <p className="text-gray-500 mb-4 text-sm">
                  {searchTerm 
                    ? 'Coba ubah kata kunci pencarian atau filter kelas'
                    : 'Mulai dengan menambahkan siswa pertama untuk mengelola pembelajaran'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10 text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tambah Siswa Pertama
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </AnimatedContainer>

      {/* Create Student Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => !isCreating && setShowCreateForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-md bg-white shadow-2xl mx-4">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Tambah Siswa Baru</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Isi informasi siswa yang akan ditambahkan
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateStudent}>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        placeholder="Contoh: john_doe, siswa001"
                        value={newStudent.username}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, username: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nama Lengkap</label>
                      <Input
                        placeholder="Contoh: John Doe"
                        value={newStudent.fullName}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, fullName: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        type="password"
                        value={newStudent.password}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, password: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kelas</label>
                      <select
                        className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base"
                        value={newStudent.classId}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, classId: e.target.value }))}
                      >
                        <option value="">Pilih Kelas</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                  <div className="flex gap-3 p-4 sm:p-6 pt-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10 sm:h-11 text-sm sm:text-base"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Membuat...</span>
                        </div>
                      ) : (
                        'Tambah Siswa'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {showEditForm && editingStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => !isUpdating && setShowEditForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-md bg-white shadow-2xl mx-4">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Edit Siswa</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Perbarui informasi siswa "{editingStudent.fullName}"
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateStudent}>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        value={editingStudent.username}
                        disabled
                        className="bg-gray-100 h-10 sm:h-11 text-sm sm:text-base"
                      />
                      <p className="text-xs text-gray-500">Username tidak dapat diubah</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nama Lengkap</label>
                      <Input
                        value={editForm.fullName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kelas</label>
                      <select
                        className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base"
                        value={editForm.classId}
                        onChange={(e) => setEditForm(prev => ({ ...prev, classId: e.target.value }))}
                      >
                        <option value="">Pilih Kelas</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                  <div className="flex gap-3 p-4 sm:p-6 pt-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                      onClick={() => setShowEditForm(false)}
                      disabled={isUpdating}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10 sm:h-11 text-sm sm:text-base"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Memperbarui...</span>
                        </div>
                      ) : (
                        'Perbarui Data'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && deletingStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-md bg-white shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Konfirmasi Hapus
                  </CardTitle>
                  <CardDescription>
                    Tindakan ini tidak dapat dibatalkan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Apakah Anda yakin ingin menghapus siswa <strong>"{deletingStudent.fullName}"</strong>?
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Semua data yang terkait dengan siswa ini akan ikut terhapus.
                  </p>
                </CardContent>
                <div className="flex gap-3 p-6 pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    onClick={confirmDeleteStudent}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Menghapus...</span>
                      </div>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Siswa
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentsPage; 