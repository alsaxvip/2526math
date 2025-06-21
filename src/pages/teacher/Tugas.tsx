import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Loader2,
  RefreshCw,
  X,
  Save,
  Activity,
  Zap,
  Award,
  GraduationCap,
  Copy
} from 'lucide-react';
import { assignmentApi, classApi } from '@/lib/api';

interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  className?: string;
  dueDate: string;
  maxPoints: number;
  createdAt: string;
  submissionCount?: number;
  totalStudents?: number;
  status?: 'active' | 'completed' | 'overdue';
  completionRate?: number;
  averageScore?: number;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  description: string;
}

const TugasPage = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'created' | 'status'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk operations
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  
  // Form States
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    maxPoints: 100
  });
  
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    maxPoints: 100
  });
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  
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
      loadAssignments();
    }
  }, [classes, selectedClassId]);
  
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Sort and filter assignments
  useEffect(() => {
    let filtered = assignments;
    
    // Filter by class
    if (selectedClassId !== 'all') {
      filtered = filtered.filter(assignment => assignment.classId === selectedClassId);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(assignment => 
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.className && assignment.className.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort assignments
    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          const statusOrder = { 'overdue': 0, 'active': 1, 'completed': 2 };
          aValue = statusOrder[a.status || 'active'];
          bValue = statusOrder[b.status || 'active'];
          break;
        default:
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    setFilteredAssignments(filtered);
  }, [searchTerm, assignments, selectedClassId, sortBy, sortOrder]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedAssignments.length === filteredAssignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(filteredAssignments.map(a => a.id));
    }
  };

  const handleSelectAssignment = (assignmentId: string) => {
    setSelectedAssignments(prev => 
      prev.includes(assignmentId) 
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedAssignments.length === 0) return;
    
    setIsDeleting(true);
    try {
      const deletePromises = selectedAssignments.map(id => assignmentApi.delete(id));
      await Promise.all(deletePromises);
      
      showNotification('success', `${selectedAssignments.length} tugas berhasil dihapus!`);
      setSelectedAssignments([]);
      await loadAssignments();
    } catch (error) {
      showNotification('error', 'Gagal menghapus beberapa tugas');
    } finally {
      setIsDeleting(false);
      setShowBulkActions(false);
    }
  };

  const handleDuplicateAssignment = async (assignment: Assignment) => {
    try {
      const response = await assignmentApi.create(
        assignment.classId,
        `${assignment.title} (Copy)`,
        assignment.description,
        assignment.dueDate,
        assignment.maxPoints
      );
      
      if (response.success) {
        showNotification('success', `Tugas "${assignment.title}" berhasil diduplikasi!`);
        await loadAssignments();
      }
    } catch (error) {
      showNotification('error', 'Gagal menduplikasi tugas');
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    await Promise.all([loadClasses(), loadAssignments()]);
    showNotification('success', 'Data berhasil diperbarui!');
  };

  // Get enhanced statistics
  const getEnhancedStats = () => {
    const total = assignments.length;
    const active = assignments.filter(a => a.status === 'active').length;
    const overdue = assignments.filter(a => a.status === 'overdue').length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    
    const thisWeek = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= now && dueDate <= weekFromNow;
    }).length;

    const averagePoints = total > 0 
      ? Math.round(assignments.reduce((sum, a) => sum + a.maxPoints, 0) / total) 
      : 0;

    return { total, active, overdue, completed, thisWeek, averagePoints };
  };

  const loadClasses = async () => {
    try {
      console.log('🔄 Loading classes for assignment management...');
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
  
  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading assignments...');
      
      const response = selectedClassId === 'all' 
        ? await assignmentApi.getAll()
        : await assignmentApi.getByClass(selectedClassId);
      
      console.log('📚 Assignments response:', response);
      
      if (response.success) {
        // Process assignments data to include class name and status
        const processedAssignments = (response.assignments || [])
          .map((assignment: any) => {
            const className = getClassName(assignment.classId);
            const status = getAssignmentStatus(assignment.dueDate);
            
            return {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              classId: assignment.classId,
              className: className,
              dueDate: assignment.dueDate,
              maxPoints: assignment.maxPoints || 100,
              createdAt: assignment.createdAt,
              status: status,
              submissionCount: 0, // Will be calculated from grades
              totalStudents: 0    // Will be calculated from students
            };
          });
        
        setAssignments(processedAssignments);
        console.log('✅ Processed assignments:', processedAssignments.length);
      } else {
        console.error('❌ Failed to load assignments:', response.error);
        showNotification('error', response.error || 'Gagal memuat data tugas');
      }
    } catch (error) {
      console.error('💥 Error loading assignments:', error);
      showNotification('error', 'Terjadi kesalahan saat memuat data tugas');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getClassName = (classId?: string) => {
    if (!classId) return 'Tidak ada kelas';
    const foundClass = classes.find(cls => cls.id === classId);
    return foundClass ? foundClass.name : 'Unknown Class';
  };

  const getAssignmentStatus = (dueDate: string): 'active' | 'completed' | 'overdue' => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (due < now) {
      return 'overdue';
    }
    
    // For simplicity, we'll mark as active. In real app, you'd check submission status
    return 'active';
  };

  const handleCreateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      console.log('➕ Creating assignment:', newAssignment);
      
      const response = await assignmentApi.create(
        newAssignment.classId,
        newAssignment.title,
        newAssignment.description,
        newAssignment.dueDate,
        newAssignment.maxPoints
      );
      
      console.log('📝 Create response:', response);
      
      if (response.success) {
        setNewAssignment({ title: '', description: '', classId: '', dueDate: '', maxPoints: 100 });
        setShowCreateForm(false);
        showNotification('success', `Tugas "${newAssignment.title}" berhasil dibuat!`);
        await loadAssignments();
      } else {
        console.error('❌ Failed to create assignment:', response.error);
        showNotification('error', response.error || 'Gagal membuat tugas');
      }
    } catch (error) {
      console.error('💥 Error creating assignment:', error);
      showNotification('error', 'Terjadi kesalahan saat membuat tugas');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setEditForm({
      title: assignment.title,
      description: assignment.description,
      classId: assignment.classId,
      dueDate: assignment.dueDate,
      maxPoints: assignment.maxPoints
    });
    setShowEditForm(true);
  };

  const handleUpdateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAssignment) return;
    
    setIsUpdating(true);

    try {
      console.log('✏️ Updating assignment:', editingAssignment.id, editForm);
      
      const response = await assignmentApi.update(
        editingAssignment.id,
        editForm.title,
        editForm.description,
        editForm.dueDate,
        editForm.maxPoints
      );
      
      console.log('📝 Update response:', response);
      
      if (response.success) {
        setShowEditForm(false);
        setEditingAssignment(null);
        showNotification('success', `Tugas "${editForm.title}" berhasil diperbarui!`);
        await loadAssignments();
      } else {
        console.error('❌ Failed to update assignment:', response.error);
        showNotification('error', response.error || 'Gagal memperbarui tugas');
      }
    } catch (error) {
      console.error('💥 Error updating assignment:', error);
      showNotification('error', 'Terjadi kesalahan saat memperbarui tugas');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    setDeletingAssignment(assignment);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!deletingAssignment) return;
    
    setIsDeleting(true);

    try {
      console.log('🗑️ Deleting assignment:', deletingAssignment.id);
      
      const response = await assignmentApi.delete(deletingAssignment.id);
      
      console.log('🗑️ Delete response:', response);
      
      if (response.success) {
        setShowDeleteConfirm(false);
        setDeletingAssignment(null);
        showNotification('success', `Tugas "${deletingAssignment.title}" berhasil dihapus!`);
        await loadAssignments();
      } else {
        console.error('❌ Failed to delete assignment:', response.error);
        showNotification('error', response.error || 'Gagal menghapus tugas');
      }
    } catch (error) {
      console.error('💥 Error deleting assignment:', error);
      showNotification('error', 'Terjadi kesalahan saat menghapus tugas');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Selesai';
      case 'overdue':
        return 'Lewat Deadline';
      default:
        return 'Aktif';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Tugas</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola semua tugas dan aktivitas pembelajaran siswa</p>
          </div>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 sm:space-x-4 animate-pulse">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50/50 min-h-screen">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 max-w-md"
          >
            <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              )}
              <span className="font-medium text-xs sm:text-sm flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <AnimatedContainer variant={fadeInUp}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Tugas
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Kelola semua tugas dan aktivitas pembelajaran siswa</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {selectedAssignments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 order-3 sm:order-1"
              >
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                  {selectedAssignments.length} dipilih
                </Badge>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowBulkActions(true)}
                  className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Hapus
                </Button>
              </motion.div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshData}
              disabled={isLoading}
              className="border-gray-200 hover:bg-gray-50 order-2 h-8 sm:h-9 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg order-1 sm:order-3 h-8 sm:h-9 text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="hidden sm:inline">Buat Tugas Baru</span>
              <span className="sm:hidden">Buat Tugas</span>
            </Button>
          </div>
        </div>
      </AnimatedContainer>

      {/* Enhanced Filters */}
      <AnimatedContainer variant={slideInFromLeft} delay={0.1}>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                <Input
                  placeholder="Cari tugas berdasarkan judul atau deskripsi..."
                  className="pl-8 sm:pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9 sm:h-10 text-xs sm:text-sm"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <select
                    className="flex h-9 sm:h-10 rounded-md border border-gray-200 bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-500 min-w-0 flex-1"
                    value={selectedClassId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedClassId(e.target.value)}
                  >
                    <option value="all">Semua Kelas</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <select
                    className="flex h-9 sm:h-10 rounded-md border border-gray-200 bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-500 min-w-0 flex-1"
                    value={sortBy}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as any)}
                  >
                    <option value="dueDate">Urutkan: Deadline</option>
                    <option value="title">Urutkan: Judul</option>
                    <option value="created">Urutkan: Dibuat</option>
                    <option value="status">Urutkan: Status</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="border-gray-200 hover:bg-gray-50 h-9 px-2 sm:px-3"
                >
                  {sortOrder === 'asc' ? (
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </div>
            </div>
            {filteredAssignments.length > 0 && (
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAssignments.length === filteredAssignments.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs sm:text-sm text-gray-600">
                    Pilih semua ({filteredAssignments.length} tugas)
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-gray-500">
                  Menampilkan {filteredAssignments.length} dari {assignments.length} tugas
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Enhanced Statistics Cards */}
      <AnimatedContainer variant={slideInFromLeft} delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Tugas</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 truncate">{getEnhancedStats().total}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Tugas Aktif</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">{getEnhancedStats().active}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Lewat Deadline</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600 truncate">{getEnhancedStats().overdue}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Selesai</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 truncate">{getEnhancedStats().completed}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Minggu Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600 truncate">{getEnhancedStats().thisWeek}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Rata-rata Poin</p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600 truncate">{getEnhancedStats().averagePoints}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedContainer>

      {/* Assignments List */}
      <AnimatedContainer variant={fadeInUp} delay={0.3}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Daftar Tugas
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Menampilkan {filteredAssignments.length} dari {assignments.length} tugas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAssignments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filteredAssignments.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedAssignments.includes(assignment.id)}
                              onChange={() => handleSelectAssignment(assignment.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
                              {assignment.title.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{assignment.title}</h3>
                              <Badge 
                                variant="outline" 
                                className={`${getStatusClass(assignment.status || 'active')} font-medium text-xs flex-shrink-0`}
                              >
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(assignment.status || 'active')}
                                  <span>{getStatusText(assignment.status || 'active')}</span>
                                </div>
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{assignment.className}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">{formatDate(assignment.dueDate)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">{assignment.maxPoints} poin</span>
                              </div>
                              {assignment.completionRate && (
                                <div className="flex items-center gap-1">
                                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="whitespace-nowrap">{Math.round(assignment.completionRate)}% selesai</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-1 ml-2 sm:ml-4 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAssignment(assignment)}
                            className="hover:bg-blue-50 hover:text-blue-600 w-8 h-8 sm:w-9 sm:h-9 p-0"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateAssignment(assignment)}
                            className="hover:bg-green-50 hover:text-green-600 w-8 h-8 sm:w-9 sm:h-9 p-0"
                            title="Duplikasi Tugas"
                          >
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAssignment(assignment)}
                            className="hover:bg-amber-50 hover:text-amber-600 w-8 h-8 sm:w-9 sm:h-9 p-0"
                            title="Edit Tugas"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment)}
                            className="hover:bg-red-50 hover:text-red-600 w-8 h-8 sm:w-9 sm:h-9 p-0"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 px-4">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Belum ada tugas</h3>
                <p className="text-gray-500 mb-4 text-xs sm:text-sm">
                  {searchTerm || selectedClassId !== 'all' 
                    ? 'Tidak ada tugas yang sesuai dengan filter Anda'
                    : 'Mulai dengan membuat tugas pertama untuk siswa Anda'
                  }
                </p>
                {!searchTerm && selectedClassId === 'all' && (
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Buat Tugas Pertama
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedContainer>

      {/* Create Assignment Modal */}
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
              <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Buat Tugas Baru</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Isi informasi tugas yang akan diberikan kepada siswa
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateAssignment}>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Judul Tugas</label>
                      <Input
                        placeholder="Contoh: Tugas Matematika - Persamaan Kuadrat"
                        value={newAssignment.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                        className="h-9 sm:h-10 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Deskripsi</label>
                      <textarea
                        placeholder="Jelaskan detail tugas, instruksi, dan kriteria penilaian..."
                        value={newAssignment.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Kelas</label>
                        <select
                          className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background focus:border-blue-500 focus:ring-blue-500"
                          value={newAssignment.classId}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewAssignment(prev => ({ ...prev, classId: e.target.value }))}
                          required
                        >
                          <option value="">Pilih Kelas</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Batas Waktu</label>
                        <input
                          type="datetime-local"
                          value={newAssignment.dueDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Nilai Maksimal</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        placeholder="100"
                        value={newAssignment.maxPoints}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAssignment(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 100 }))}
                        className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </CardContent>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 pt-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-9 sm:h-10 text-xs sm:text-sm order-2 sm:order-1"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-9 sm:h-10 text-xs sm:text-sm order-1 sm:order-2"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Membuat...</span>
                        </div>
                      ) : (
                        'Buat Tugas'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Assignment Modal */}
      <AnimatePresence>
        {showEditForm && editingAssignment && (
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
              <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Edit Tugas</CardTitle>
                  <CardDescription>
                    Perbarui informasi tugas "{editingAssignment.title}"
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateAssignment}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Judul Tugas</label>
                      <Input
                        value={editForm.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Deskripsi</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Kelas</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-500"
                          value={editForm.classId}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm(prev => ({ ...prev, classId: e.target.value }))}
                          required
                        >
                          <option value="">Pilih Kelas</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Batas Waktu</label>
                        <input
                          type="datetime-local"
                          value={editForm.dueDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nilai Maksimal</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={editForm.maxPoints}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 100 }))}
                        required
                      />
                    </div>
                  </CardContent>
                  <div className="flex gap-3 p-6 pt-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowEditForm(false)}
                      disabled={isUpdating}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Memperbarui...</span>
                        </div>
                      ) : (
                        'Perbarui Tugas'
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
        {showDeleteConfirm && deletingAssignment && (
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
                  <CardTitle className="flex items-center gap-2 text-red-600 text-base sm:text-lg">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Konfirmasi Hapus
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Tindakan ini tidak dapat dibatalkan
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Apakah Anda yakin ingin menghapus tugas "{deletingAssignment.title}"? 
                    Semua data terkait termasuk pengumpulan dan nilai akan ikut terhapus.
                  </p>
                </CardContent>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 pt-0">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm order-2 sm:order-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 h-9 sm:h-10 text-xs sm:text-sm order-1 sm:order-2"
                    onClick={confirmDeleteAssignment}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Menghapus...</span>
                      </div>
                    ) : (
                      'Hapus Tugas'
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedAssignment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowDetailModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Detail Tugas
                  </CardTitle>
                  <CardDescription>
                    Informasi lengkap tugas "{selectedAssignment.title}"
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Judul</h3>
                    <p className="text-gray-600">{selectedAssignment.title}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Deskripsi</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedAssignment.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Kelas</h3>
                      <p className="text-gray-600">{selectedAssignment.className}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Batas Waktu</h3>
                      <p className="text-gray-600">{formatDate(selectedAssignment.dueDate)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Nilai Maksimal</h3>
                      <p className="text-gray-600">{selectedAssignment.maxPoints} poin</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Status</h3>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusClass(selectedAssignment.status || 'active')} font-medium`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(selectedAssignment.status || 'active')}
                          <span>{getStatusText(selectedAssignment.status || 'active')}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <div className="flex gap-3 p-6 pt-0">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Tutup
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditAssignment(selectedAssignment);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Tugas
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Actions Confirmation Modal */}
      <AnimatePresence>
        {showBulkActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => !isDeleting && setShowBulkActions(false)}
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
                  <p className="text-gray-600">
                    Apakah Anda yakin ingin menghapus {selectedAssignments.length > 1 ? 'tugas ini' : 'tugas terpilih'}? 
                    Semua data terkait termasuk pengumpulan dan nilai akan ikut terhapus.
                  </p>
                </CardContent>
                <div className="flex gap-3 p-6 pt-0">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowBulkActions(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>Menghapus...</span>
                      </div>
                    ) : (
                      'Hapus Tugas'
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

export default TugasPage; 