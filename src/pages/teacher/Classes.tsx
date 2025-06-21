import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingCard, LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, StaggeredList, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Users, 
  Edit,
  Trash2,
  Eye,
  Calendar,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { classApi } from '@/lib/api';

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  description: string;
  teacherUsername: string;
  createdAt: string;
}

interface ClassStats {
  studentsCount: number;
  assignmentsCount: number;
  averageGrade: number | null;
}

const Classes = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([]);
  const [classStats, setClassStats] = useState<Record<string, ClassStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Create Modal State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    subject: '',
    description: ''
  });

  // Edit Modal State
  const [showEditForm, setShowEditForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    description: ''
  });

  // Delete Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    // Filter classes based on search term
    if (searchTerm) {
      const filtered = classes.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses(classes);
    }
  }, [searchTerm, classes]);

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

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      setLoadingProgress(20);
      console.log('🔄 Loading classes...');
      
      const response = await classApi.getAll();
      console.log('📊 Classes response:', response);
      
      if (response.success) {
        const classesList = response.classes || [];
        setClasses(classesList);
        setFilteredClasses(classesList);
        setLoadingProgress(60);
        console.log('✅ Loaded classes:', classesList.length);
        
        // Show classes immediately, load stats in background
        setIsLoading(false);
        setLoadingProgress(100);
        
        // Load statistics incrementally in the background
        if (classesList.length > 0) {
          loadClassStatsIncremental(classesList);
        }
      } else {
        console.error('❌ Failed to load classes:', response.error);
        showNotification('error', response.error || 'Gagal memuat data kelas');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('💥 Error loading classes:', error);
      showNotification('error', 'Terjadi kesalahan saat memuat data kelas');
      setIsLoading(false);
    }
  };

  const loadClassStatsIncremental = async (classesList: ClassItem[]) => {
    if (classesList.length === 0) return;
    
    try {
      setIsLoadingStats(true);
      console.log('📈 Loading class statistics incrementally...');
      
      // Load stats one by one to show progressive updates
      let completed = 0;
      
      // Function to load single class stats
      const loadSingleClassStats = async (classItem: ClassItem) => {
        try {
          const statsResponse = await classApi.getStats(classItem.id);
          const stats = statsResponse.success && statsResponse.stats ? 
            statsResponse.stats : 
            { studentsCount: 0, assignmentsCount: 0, averageGrade: null };
          
          // Update stats immediately for this class
          setClassStats(prev => ({
            ...prev,
            [classItem.id]: stats
          }));
          
          completed++;
          const progress = Math.round((completed / classesList.length) * 100);
          console.log(`📊 Loaded stats for ${classItem.name}: ${progress}% complete`);
          
          return { classId: classItem.id, stats };
        } catch (error) {
          console.error(`Error loading stats for class ${classItem.id}:`, error);
          // Set default stats for failed requests
          const defaultStats = { studentsCount: 0, assignmentsCount: 0, averageGrade: null };
          setClassStats(prev => ({
            ...prev,
            [classItem.id]: defaultStats
          }));
          completed++;
          return { classId: classItem.id, stats: defaultStats };
        }
      };
      
      // Load first 3 classes immediately (most important)
      const priorityClasses = classesList.slice(0, 3);
      const remainingClasses = classesList.slice(3);
      
      // Load priority classes in parallel
      await Promise.all(
        priorityClasses.map((classItem) => loadSingleClassStats(classItem))
      );
      
      // Load remaining classes with small delays to prevent overwhelming
      for (let i = 0; i < remainingClasses.length; i++) {
        const classItem = remainingClasses[i];
        setTimeout(() => {
          loadSingleClassStats(classItem);
        }, i * 100); // 100ms delay between each request
      }
      
      console.log('✅ Stats loading initiated for all classes');
      
    } catch (error) {
      console.error('💥 Error loading class statistics:', error);
    } finally {
      // Mark stats loading as complete after a reasonable time
      setTimeout(() => {
        setIsLoadingStats(false);
      }, classesList.length * 150); // Give enough time for all requests
    }
  };

  // Keep the old function as fallback for full reload
  const loadClassStats = async (classesList: ClassItem[]) => {
    if (classesList.length === 0) return;
    
    try {
      setIsLoadingStats(true);
      console.log('📈 Loading class statistics...');
      
      const statsPromises = classesList.map(async (classItem) => {
        try {
          const statsResponse = await classApi.getStats(classItem.id);
          return {
            classId: classItem.id,
            stats: statsResponse.success && statsResponse.stats ? 
              statsResponse.stats : 
              { studentsCount: 0, assignmentsCount: 0, averageGrade: null }
          };
        } catch (error) {
          console.error(`Error loading stats for class ${classItem.id}:`, error);
          return {
            classId: classItem.id,
            stats: { studentsCount: 0, assignmentsCount: 0, averageGrade: null }
          };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      
      // Convert to object for easy lookup
      const statsMap: Record<string, ClassStats> = {};
      statsResults.forEach(({ classId, stats }) => {
        statsMap[classId] = stats;
      });
      
      setClassStats(statsMap);
      console.log('✅ Loaded class statistics:', statsMap);
      
    } catch (error) {
      console.error('💥 Error loading class statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Optimized refresh with intelligent reloading
  const handleRefresh = async () => {
    try {
      console.log('🔄 Refreshing classes data...');
      
      // Quick refresh: only reload stats if classes are already loaded
      if (classes.length > 0) {
        setIsLoadingStats(true);
        showNotification('success', 'Memperbarui statistik kelas...');
        await loadClassStats(classes);
      } else {
        // Full reload if no classes are loaded
        await loadClasses();
      }
      
      showNotification('success', 'Data berhasil diperbarui');
    } catch (error) {
      console.error('💥 Error refreshing data:', error);
      showNotification('error', 'Gagal memperbarui data');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      console.log('➕ Creating class:', newClass);
      
      const response = await classApi.create(
        newClass.name,
        newClass.subject,
        newClass.description
      );
      
      console.log('📝 Create response:', response);
      
      if (response.success) {
        setNewClass({ name: '', subject: '', description: '' });
        setShowCreateForm(false);
        showNotification('success', `Kelas "${newClass.name}" berhasil dibuat!`);
        await loadClasses(); // Reload classes and stats
      } else {
        console.error('❌ Failed to create class:', response.error);
        showNotification('error', response.error || 'Gagal membuat kelas');
      }
    } catch (error) {
      console.error('💥 Error creating class:', error);
      showNotification('error', 'Terjadi kesalahan saat membuat kelas');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClass = (classItem: ClassItem) => {
    setEditingClass(classItem);
    setEditForm({
      name: classItem.name,
      subject: classItem.subject,
      description: classItem.description
    });
    setShowEditForm(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    
    setIsUpdating(true);

    try {
      console.log('✏️ Updating class:', editingClass.id, editForm);
      
      const response = await classApi.update(
        editingClass.id,
        editForm.name,
        editForm.subject,
        editForm.description
      );
      
      console.log('📝 Update response:', response);
      
      if (response.success) {
        setShowEditForm(false);
        setEditingClass(null);
        showNotification('success', `Kelas "${editForm.name}" berhasil diperbarui!`);
        await handleRefresh(); // Use optimized refresh
      } else {
        console.error('❌ Failed to update class:', response.error);
        showNotification('error', response.error || 'Gagal memperbarui kelas');
      }
    } catch (error) {
      console.error('💥 Error updating class:', error);
      showNotification('error', 'Terjadi kesalahan saat memperbarui kelas');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClass = (classItem: ClassItem) => {
    setDeletingClass(classItem);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteClass = async () => {
    if (!deletingClass) return;
    
    setIsDeleting(true);

    try {
      console.log('🗑️ Deleting class:', deletingClass.id);
      
      const response = await classApi.delete(deletingClass.id);
      
      console.log('🗑️ Delete response:', response);
      
      if (response.success) {
        setShowDeleteConfirm(false);
        setDeletingClass(null);
        showNotification('success', `Kelas "${deletingClass.name}" berhasil dihapus!`);
        await handleRefresh(); // Use optimized refresh
      } else {
        console.error('❌ Failed to delete class:', response.error);
        showNotification('error', response.error || 'Gagal menghapus kelas');
      }
    } catch (error) {
      console.error('💥 Error deleting class:', error);
      showNotification('error', 'Terjadi kesalahan saat menghapus kelas');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRandomGradient = () => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-cyan-500 to-blue-600',
      'from-violet-500 to-purple-600'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Kelas</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola semua kelas Anda</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50/50 min-h-screen">
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kelas</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Kelola semua kelas Anda dengan mudah
              {isLoadingStats && <span className="ml-2 text-blue-600">• Memuat statistik...</span>}
              {loadingProgress > 0 && loadingProgress < 100 && (
                <span className="ml-2 text-blue-600">• Loading {loadingProgress}%</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              onClick={handleRefresh}
              variant="outline" 
              size="sm"
              disabled={isLoadingStats}
              className="flex items-center gap-2 flex-1 sm:flex-none h-9 sm:h-10"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm">{isLoadingStats ? 'Memuat...' : 'Refresh'}</span>
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex-1 sm:flex-none h-9 sm:h-10"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="text-xs sm:text-sm">Buat Kelas</span>
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
                  placeholder="Cari kelas, mata pelajaran, atau deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div className="flex gap-2 self-start sm:self-center">
                <Badge variant="outline" className="text-xs sm:text-sm whitespace-nowrap">
                  {filteredClasses.length} Kelas
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Classes Grid */}
      <StaggeredList>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClasses.map((classItem, index) => {
            const stats = classStats[classItem.id] || { studentsCount: 0, assignmentsCount: 0, averageGrade: null };
            
            return (
              <AnimatedContainer key={classItem.id} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Card Header with Gradient */}
                    <div className={`bg-gradient-to-r ${getRandomGradient()} p-4 sm:p-6 text-white relative`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold mb-2 truncate">{classItem.name}</h3>
                          {classItem.subject && (
                            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                              {classItem.subject}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-10">
                        <BookOpen className="w-full h-full" />
                      </div>
                    </div>

                    <CardContent className="p-4 sm:p-6">
                      <p className="text-gray-600 mb-4 line-clamp-2 text-sm sm:text-base">
                        {classItem.description || 'Tidak ada deskripsi'}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="text-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          </div>
                          <div className="text-base sm:text-lg font-bold text-gray-900">
                            {!stats || isLoadingStats ? (
                              <div className="w-6 h-5 sm:w-8 sm:h-6 mx-auto bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                              stats.studentsCount
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Siswa</div>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          </div>
                          <div className="text-base sm:text-lg font-bold text-gray-900">
                            {!stats || isLoadingStats ? (
                              <div className="w-6 h-5 sm:w-8 sm:h-6 mx-auto bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                              stats.assignmentsCount
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Tugas</div>
                        </div>
                        <div className="text-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                          </div>
                          <div className="text-base sm:text-lg font-bold text-gray-900">
                            {!stats || isLoadingStats ? (
                              <div className="w-6 h-5 sm:w-8 sm:h-6 mx-auto bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                              stats.averageGrade !== null ? stats.averageGrade.toFixed(1) : '-'
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Rata-rata</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8 sm:h-9 text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Lihat</span>
                          <span className="sm:hidden">Detail</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClass(classItem)}
                          className="w-8 h-8 sm:w-9 sm:h-9 p-0"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 w-8 h-8 sm:w-9 sm:h-9 p-0"
                          onClick={() => handleDeleteClass(classItem)}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>

                      {/* Created date */}
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          Dibuat {new Date(classItem.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatedContainer>
            );
          })}
        </div>
      </StaggeredList>

      {/* Empty State */}
      {!isLoading && filteredClasses.length === 0 && (
        <AnimatedContainer variant={fadeInUp} delay={0.3}>
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-8 sm:py-12 px-4 sm:px-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Tidak ada kelas yang ditemukan' : 'Belum ada kelas'}
              </h3>
              <p className="text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                {searchTerm 
                  ? 'Coba ubah kata kunci pencarian Anda'
                  : 'Mulai dengan membuat kelas pertama Anda untuk mengelola siswa dan pembelajaran'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-10 sm:h-11 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Kelas Pertama
                </Button>
              )}
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}

      {/* Create Class Modal */}
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
                  <CardTitle className="text-lg sm:text-xl">Buat Kelas Baru</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Isi informasi kelas yang akan Anda buat
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateClass}>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nama Kelas</label>
                      <Input
                        placeholder="Contoh: 9A, X-IPA-1"
                        value={newClass.name}
                        onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mata Pelajaran</label>
                      <Input
                        placeholder="Contoh: Matematika, Fisika, Bahasa Indonesia"
                        value={newClass.subject}
                        onChange={(e) => setNewClass(prev => ({ ...prev, subject: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Deskripsi</label>
                      <Input
                        placeholder="Contoh: Kelas pagi, Semester ganjil"
                        value={newClass.description}
                        onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
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
                        'Buat Kelas'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Class Modal */}
      <AnimatePresence>
        {showEditForm && editingClass && (
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
                  <CardTitle className="text-lg sm:text-xl">Edit Kelas</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Perbarui informasi kelas "{editingClass.name}"
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateClass}>
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nama Kelas</label>
                      <Input
                        placeholder="Contoh: 9A, X-IPA-1"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mata Pelajaran</label>
                      <Input
                        placeholder="Contoh: Matematika, Fisika, Bahasa Indonesia"
                        value={editForm.subject}
                        onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Deskripsi</label>
                      <Input
                        placeholder="Contoh: Kelas pagi, Semester ganjil"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
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
                        'Perbarui Kelas'
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
        {showDeleteConfirm && deletingClass && (
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
              <Card className="w-full max-w-md bg-white shadow-2xl mx-4">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-red-600 text-lg sm:text-xl">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Konfirmasi Hapus
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Tindakan ini tidak dapat dibatalkan
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-gray-700 text-sm sm:text-base">
                    Apakah Anda yakin ingin menghapus kelas <strong>"{deletingClass.name}"</strong>?
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Semua data yang terkait dengan kelas ini akan ikut terhapus.
                  </p>
                </CardContent>
                <div className="flex gap-3 p-4 sm:p-6 pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                    onClick={confirmDeleteClass}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Menghapus...</span>
                      </div>
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Hapus Kelas
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

export default Classes; 