import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar, BookOpen, Check, Pencil, Trash2, FileText, Clock, CalendarDays, X, Save, AlertCircle, RefreshCw, BarChart3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { classApi, journalApi } from '@/lib/api';

// Interfaces
interface Class {
  id: string;
  name: string;
  description: string;
  studentCount: number;
}

interface Journal {
  id: string;
  classId: string;
  date: string;
  topic: string;
  activities: string;
  notes: string;
  createdAt: string;
  className?: string;
  isComplete?: boolean;
}

interface JournalForm {
  classId: string;
  date: string;
  topic: string;
  activities: string;
  notes: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
  topic: string;
  activities: string;
  notes: string;
  isDefault: boolean;
}

interface ReportData {
  totalJournals: number;
  completedJournals: number;
  incompleteJournals: number;
  completionRate: number;
  journalsByClass: Array<{
    className: string;
    total: number;
    completed: number;
    incomplete: number;
  }>;
  journalsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

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

  const icons = {
    success: <Check className="w-4 h-4 sm:w-5 sm:h-5" />,
    error: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
    warning: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
    info: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{icons[notification.type]}</div>
            <span className="text-sm font-medium flex-1 truncate">{notification.message}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Enhanced Loading Component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-200/50 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 rounded-lg"></div>
            <div className="h-5 sm:h-6 bg-gray-300 rounded w-32 sm:w-48"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-12 sm:w-16 h-6 sm:h-8 bg-gray-300 rounded-lg"></div>
            <div className="w-12 sm:w-16 h-6 sm:h-8 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 sm:h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-3 sm:h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 sm:h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// Modal Component with enhanced animations
const Modal = ({ isOpen, onClose, title, children, size = 'default' }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large' | 'xl';
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    default: 'max-w-md w-full',
    large: 'max-w-2xl w-full',
    xl: 'max-w-4xl w-full'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} max-h-[90vh] overflow-hidden mx-4`}
        >
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const JurnalPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('journals');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Form state
  const [journalForm, setJournalForm] = useState<JournalForm>({
    classId: '',
    date: new Date().toISOString().split('T')[0],
    topic: '',
    activities: '',
    notes: ''
  });
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    visible: boolean;
  }>({ type: 'info', message: '', visible: false });

  // Notification helper
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 5000);
  };
  
  const [templates, setTemplates] = useState<Template[]>([
    { 
      id: 1, 
      name: 'Template Standar', 
      description: 'Template jurnal pembelajaran standar untuk kegiatan harian',
      topic: 'Topik Pembelajaran',
      activities: 'Kegiatan Pembuka:\n- Salam dan doa\n- Apersepsi\n- Menyampaikan tujuan pembelajaran\n\nKegiatan Inti:\n- Penjelasan materi\n- Diskusi kelompok\n- Latihan soal\n\nKegiatan Penutup:\n- Kesimpulan\n- Evaluasi\n- Tugas rumah',
      notes: 'Catatan dan refleksi pembelajaran',
      isDefault: true 
    },
    { 
      id: 2, 
      name: 'Template Praktikum', 
      description: 'Template khusus untuk kegiatan praktikum dan eksperimen',
      topic: 'Praktikum [Nama Praktikum]',
      activities: 'Persiapan:\n- Penjelasan tujuan praktikum\n- Pembagian kelompok\n- Persiapan alat dan bahan\n\nPelaksanaan:\n- Demonstrasi prosedur\n- Praktikum kelompok\n- Pengamatan dan pencatatan data\n\nPenutup:\n- Diskusi hasil\n- Kesimpulan\n- Laporan praktikum',
      notes: 'Evaluasi jalannya praktikum dan hasil yang diperoleh',
      isDefault: false 
    },
    { 
      id: 3, 
      name: 'Template Evaluasi', 
      description: 'Template untuk pertemuan evaluasi, ulangan, atau ujian',
      topic: 'Evaluasi [Materi]',
      activities: 'Persiapan:\n- Pengaturan tempat duduk\n- Pembagian soal\n- Penjelasan tata tertib\n\nPelaksanaan:\n- Ujian/ulangan\n- Pengawasan\n- Pengumpulan jawaban\n\nTindak Lanjut:\n- Koreksi\n- Analisis hasil\n- Feedback',
      notes: 'Analisis hasil evaluasi dan rencana tindak lanjut',
      isDefault: false 
    }
  ]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClasses(),
        fetchJournals()
      ]);
      showNotification('success', 'Data berhasil dimuat');
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showNotification('error', 'Gagal memuat data');
    } finally {
      setLoading(false);
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
      showNotification('error', 'Gagal memuat data kelas');
    }
  };

  const fetchJournals = async () => {
    try {
      const response = await journalApi.getAll();
      if (response.success) {
        const journalsWithClassName = (response.journals || []).map((journal: Journal) => ({
          ...journal,
          className: getClassName(journal.classId),
          isComplete: journal.topic && journal.activities && journal.notes
        }));
        setJournals(journalsWithClassName);
        calculateReportData(journalsWithClassName);
      }
    } catch (error) {
      console.error('Error fetching journals:', error);
      showNotification('error', 'Gagal memuat data jurnal');
    }
  };

  const calculateReportData = (journalData: Journal[]) => {
    const totalJournals = journalData.length;
    const completedJournals = journalData.filter(j => j.isComplete).length;
    const incompleteJournals = totalJournals - completedJournals;
    const completionRate = totalJournals > 0 ? Math.round((completedJournals / totalJournals) * 100) : 0;

    // Group by class
    const journalsByClass = classes.map(cls => {
      const classJournals = journalData.filter(j => j.classId === cls.id);
      const completed = classJournals.filter(j => j.isComplete).length;
      return {
        className: cls.name,
        total: classJournals.length,
        completed: completed,
        incomplete: classJournals.length - completed
      };
    }).filter(item => item.total > 0);

    // Group by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const journalsByMonth = monthNames.map((month, index) => {
      const monthJournals = journalData.filter(j => {
        const journalDate = new Date(j.date);
        return journalDate.getMonth() === index && journalDate.getFullYear() === new Date().getFullYear();
      });
      return {
        month,
        count: monthJournals.length
      };
    }).filter(item => item.count > 0);

    setReportData({
      totalJournals,
      completedJournals,
      incompleteJournals,
      completionRate,
      journalsByClass,
      journalsByMonth
    });
  };

  const getClassName = (classId: string) => {
    const foundClass = classes.find(c => c.id === classId);
    return foundClass ? foundClass.name : 'Unknown Class';
  };

  const resetForm = () => {
    setJournalForm({
      classId: '',
      date: new Date().toISOString().split('T')[0],
      topic: '',
      activities: '',
      notes: ''
    });
  };

  const handleCreateJournal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditJournal = (journal: Journal) => {
    setSelectedJournal(journal);
    setJournalForm({
      classId: journal.classId,
      date: journal.date,
      topic: journal.topic,
      activities: journal.activities,
      notes: journal.notes
    });
    setShowEditModal(true);
  };

  const handleViewJournal = (journal: Journal) => {
    setSelectedJournal(journal);
    setShowDetailModal(true);
  };

  const handleDeleteJournal = (journal: Journal) => {
    setSelectedJournal(journal);
    setShowDeleteModal(true);
  };

  const handleSaveJournal = async () => {
    if (!journalForm.classId || !journalForm.topic || !journalForm.activities) {
      showNotification('warning', 'Mohon lengkapi kelas, topik, dan aktivitas pembelajaran');
      return;
    }

    setSaving(true);
    try {
      const response = await journalApi.create(
        journalForm.classId,
        journalForm.date,
        journalForm.topic,
        journalForm.activities,
        journalForm.notes
      );

      if (response.success) {
        await fetchJournals();
        setShowCreateModal(false);
        resetForm();
        showNotification('success', 'Jurnal berhasil dibuat');
      } else {
        showNotification('error', 'Gagal membuat jurnal: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating journal:', error);
      showNotification('error', 'Terjadi kesalahan saat membuat jurnal');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateJournal = async () => {
    if (!selectedJournal || !journalForm.topic || !journalForm.activities) {
      showNotification('warning', 'Mohon lengkapi topik dan aktivitas pembelajaran');
      return;
    }

    setSaving(true);
    try {
      const response = await journalApi.update(
        selectedJournal.id,
        journalForm.topic,
        journalForm.activities,
        journalForm.notes
      );

      if (response.success) {
        await fetchJournals();
        setShowEditModal(false);
        setSelectedJournal(null);
        resetForm();
        showNotification('success', 'Jurnal berhasil diperbarui');
      } else {
        showNotification('error', 'Gagal memperbarui jurnal: ' + response.error);
      }
    } catch (error) {
      console.error('Error updating journal:', error);
      showNotification('error', 'Terjadi kesalahan saat memperbarui jurnal');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedJournal) return;

    setSaving(true);
    try {
      const response = await journalApi.delete(selectedJournal.id);

      if (response.success) {
        await fetchJournals();
        setShowDeleteModal(false);
        setSelectedJournal(null);
        showNotification('success', 'Jurnal berhasil dihapus');
      } else {
        showNotification('error', 'Gagal menghapus jurnal: ' + response.error);
      }
    } catch (error) {
      console.error('Error deleting journal:', error);
      showNotification('error', 'Terjadi kesalahan saat menghapus jurnal');
    } finally {
      setSaving(false);
    }
  };

  // Template functions
  const handleUseTemplate = (template: Template) => {
    setJournalForm(prev => ({
      ...prev,
      topic: template.topic,
      activities: template.activities,
      notes: template.notes
    }));
    setShowTemplateModal(false);
    setShowCreateModal(true);
    showNotification('success', `Template "${template.name}" berhasil diterapkan`);
  };

  const handleViewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = (templateId: number) => {
    if (templates.find(t => t.id === templateId)?.isDefault) {
      showNotification('warning', 'Template default tidak dapat dihapus');
      return;
    }
    
    if (confirm('Yakin ingin menghapus template ini?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      showNotification('success', 'Template berhasil dihapus');
    }
  };

  const filteredJournals = journals.filter(journal => {
    const matchesSearch = (journal.className || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         journal.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         journal.activities.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'complete' && journal.isComplete) || 
                         (filter === 'incomplete' && !journal.isComplete);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="h-6 sm:h-8 bg-gray-300 rounded w-48 sm:w-64 animate-pulse"></div>
              <div className="h-4 sm:h-5 bg-gray-200 rounded w-56 sm:w-80 mt-2 animate-pulse"></div>
            </div>
            <div className="h-9 sm:h-10 bg-gray-300 rounded w-32 sm:w-40 animate-pulse"></div>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50/50 p-4 sm:p-6 space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Jurnal Pembelajaran</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Dokumentasi dan refleksi kegiatan pembelajaran</p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 h-10 sm:h-11 text-sm sm:text-base w-full sm:w-auto"
            onClick={handleCreateJournal}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Buat Jurnal Baru</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Enhanced Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden"
      >
        <div className="flex border-b border-gray-200/50 overflow-x-auto">
          {[
            { id: 'journals', label: 'Semua Jurnal', icon: BookOpen },
            { id: 'templates', label: 'Template', icon: FileText },
            { id: 'reports', label: 'Laporan', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'journals' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Enhanced Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari jurnal berdasarkan topik, kelas, atau aktivitas..."
                    className="pl-10 h-10 sm:h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 rounded-xl text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'complete', label: 'Lengkap' },
                    { id: 'incomplete', label: 'Belum Lengkap' }
                  ].map((filterOption) => (
                    <Button
                      key={filterOption.id}
                      variant={filter === filterOption.id ? 'default' : 'outline'}
                      size="sm"
                      className={`transition-all duration-200 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 ${
                        filter === filterOption.id
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setFilter(filterOption.id)}
                    >
                      {filterOption.label}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:bg-gray-50 h-8 sm:h-9 px-2 sm:px-3"
                    onClick={fetchJournals}
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredJournals.length > 0 ? (
                  <AnimatePresence>
                    {filteredJournals.map((journal, index) => (
                      <motion.div
                        key={journal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="bg-white border border-gray-200/50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                      >
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col gap-4 mb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1 flex-1">{journal.topic}</h2>
                                </div>
                                <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 gap-3 sm:gap-4">
                                  <div className="flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>{formatDate(journal.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="truncate">{journal.className}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge
                                  className={`${
                                    journal.isComplete
                                      ? 'bg-green-100 text-green-800 border-green-200'
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }`}
                                >
                                  {journal.isComplete ? (
                                    <>
                                      <Check className="w-3 h-3 mr-1" />
                                      Lengkap
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mr-1" />
                                      Draft
                                    </>
                                  )}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200 h-8 text-xs flex-1 sm:flex-none"
                                onClick={() => handleViewJournal(journal)}
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Lihat
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-gray-200 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all duration-200 h-8 text-xs flex-1 sm:flex-none"
                                onClick={() => handleEditJournal(journal)}
                              >
                                <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200 h-8 text-xs px-3"
                                onClick={() => handleDeleteJournal(journal)}
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-3 sm:space-y-4">
                              <div>
                                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Topik Pembelajaran</h3>
                                <p className="text-gray-900 text-sm line-clamp-2">{journal.topic || '-'}</p>
                              </div>
                              <div>
                                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Aktivitas Pembelajaran</h3>
                                <p className="text-gray-900 text-sm line-clamp-3">{journal.activities || '-'}</p>
                              </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                              <div>
                                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Catatan & Refleksi</h3>
                                <p className="text-gray-900 text-sm line-clamp-3">{journal.notes || 'Tidak ada catatan'}</p>
                              </div>
                              <div>
                                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Tanggal Dibuat</h3>
                                <p className="text-gray-600 text-xs sm:text-sm">{journal.createdAt ? formatDate(journal.createdAt) : '-'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 sm:p-12 text-center"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Tidak ada jurnal yang ditemukan</h3>
                    <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">Coba ubah filter atau buat jurnal baru untuk memulai</p>
                    <Button
                      onClick={handleCreateJournal}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-10 sm:h-11 text-sm sm:text-base"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Buat Jurnal Pertama
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              <AnimatePresence>
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border border-gray-200/50 rounded-2xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{template.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                      </div>
                      {template.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs ml-2 flex-shrink-0">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 h-8 text-xs"
                        onClick={() => handleViewTemplate(template)}
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Lihat
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-gray-200 hover:bg-green-50 hover:border-green-200 hover:text-green-700 h-8 text-xs"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Gunakan
                      </Button>
                      {!template.isDefault && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 h-8 px-3"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: templates.length * 0.1 }}
                className="bg-gray-50/50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-center cursor-pointer hover:bg-gray-100/50 hover:border-gray-400 transition-all duration-200 group"
                onClick={() => setShowTemplateModal(true)}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-300 transition-colors">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Buat Template Baru</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Sesuaikan format jurnal sesuai kebutuhan</p>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'reports' && reportData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg border shadow-sm p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-medium mb-4 sm:mb-6">Ringkasan Jurnal Pembelajaran</h2>
                <div className="space-y-4 sm:space-y-6">
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                      <h3 className="font-medium text-sm sm:text-base">Jurnal Per Kelas</h3>
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 w-full sm:w-auto">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Ekspor Data
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Kelas</th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Total</th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Lengkap</th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Belum</th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reportData.journalsByClass.length > 0 ? (
                            reportData.journalsByClass.map((classData, index) => (
                              <tr key={index}>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium">{classData.className}</td>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm">{classData.total}</td>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-green-600">{classData.completed}</td>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-yellow-600">{classData.incomplete}</td>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-500 h-2 rounded-full" 
                                        style={{ width: `${classData.total > 0 ? (classData.completed / classData.total) * 100 : 0}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs">
                                      {classData.total > 0 ? Math.round((classData.completed / classData.total) * 100) : 0}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-2 sm:px-3 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
                                Belum ada data jurnal
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                      <h3 className="font-medium text-sm sm:text-base">Distribusi Jurnal Per Bulan</h3>
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 w-full sm:w-auto">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Lihat Detail
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Bulan</th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Jumlah Jurnal</th>
                            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Persentase</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reportData.journalsByMonth.length > 0 ? (
                            reportData.journalsByMonth.map((monthData, index) => (
                              <tr key={index}>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium">{monthData.month}</td>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm">{monthData.count}</td>
                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm">
                                  {reportData.totalJournals > 0 ? 
                                    Math.round((monthData.count / reportData.totalJournals) * 100) : 0}%
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-2 sm:px-3 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
                                Belum ada data jurnal bulan ini
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-medium mb-4 sm:mb-6">Statistik Jurnal</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs sm:text-sm font-medium">Total Jurnal</h3>
                      <span className="text-xl sm:text-2xl font-bold text-blue-600">{reportData.totalJournals}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Tahun {new Date().getFullYear()}</span>
                      <span className="text-blue-600">📚 Jurnal aktif</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs sm:text-sm font-medium">Jurnal Lengkap</h3>
                      <span className="text-green-600 font-bold text-lg sm:text-xl">{reportData.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2">
                      <div 
                        className="bg-green-500 h-2 sm:h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${reportData.completionRate}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {reportData.completedJournals} dari {reportData.totalJournals} jurnal
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs sm:text-sm font-medium">Jurnal Belum Lengkap</h3>
                      <span className="text-yellow-600 font-bold text-lg sm:text-xl">
                        {reportData.totalJournals > 0 ? 100 - reportData.completionRate : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2">
                      <div 
                        className="bg-yellow-500 h-2 sm:h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${reportData.totalJournals > 0 ? 100 - reportData.completionRate : 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {reportData.incompleteJournals} jurnal perlu dilengkapi
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-medium mb-3">Distribusi per Bulan</h3>
                    <div className="flex items-end h-24 sm:h-32 gap-1 justify-between">
                      {reportData.journalsByMonth.length > 0 ? (
                        reportData.journalsByMonth.map((monthData, index) => {
                          const maxCount = Math.max(...reportData.journalsByMonth.map(m => m.count));
                          const height = maxCount > 0 ? (monthData.count / maxCount) * 100 : 0;
                          return (
                            <div key={index} className="flex flex-col items-center">
                              <div 
                                className="bg-blue-500 w-4 sm:w-6 rounded-t transition-all duration-300 hover:bg-blue-600" 
                                style={{ height: `${Math.max(height, 5)}%` }}
                                title={`${monthData.month}: ${monthData.count} jurnal`}
                              ></div>
                              <span className="text-xs mt-1 text-gray-600">{monthData.month}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-full text-center text-gray-500 text-xs sm:text-sm">
                          Belum ada data
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && !reportData && (
            <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium">Memuat Data Laporan</h3>
              <p className="text-gray-500 mt-1">Sedang menganalisis data jurnal pembelajaran...</p>
            </div>
          )}

          {/* Create Journal Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Buat Jurnal Baru"
            size="xl"
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kelas *</label>
                  <select
                    className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    value={journalForm.classId}
                    onChange={(e) => setJournalForm(prev => ({ ...prev, classId: e.target.value }))}
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    value={journalForm.date}
                    onChange={(e) => setJournalForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topik Pembelajaran *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  placeholder="Masukkan topik pembelajaran"
                  value={journalForm.topic}
                  onChange={(e) => setJournalForm(prev => ({ ...prev, topic: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktivitas Pembelajaran *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base resize-none"
                  rows={6}
                  placeholder="Deskripsikan aktivitas pembelajaran yang dilakukan"
                  value={journalForm.activities}
                  onChange={(e) => setJournalForm(prev => ({ ...prev, activities: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan & Refleksi</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base resize-none"
                  rows={4}
                  placeholder="Catatan, refleksi, atau hal-hal penting lainnya"
                  value={journalForm.notes}
                  onChange={(e) => setJournalForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="flex-1 order-2 sm:order-1 h-10 sm:h-11"
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 order-1 sm:order-2 h-10 sm:h-11"
                  onClick={handleSaveJournal}
                  disabled={saving}
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Edit Journal Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Jurnal"
            size="xl"
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base"
                    value={selectedJournal ? getClassName(selectedJournal.classId) : ''}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base"
                    value={journalForm.date}
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topik Pembelajaran *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  placeholder="Masukkan topik pembelajaran"
                  value={journalForm.topic}
                  onChange={(e) => setJournalForm(prev => ({ ...prev, topic: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktivitas Pembelajaran *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base resize-none"
                  rows={6}
                  placeholder="Deskripsikan aktivitas pembelajaran yang dilakukan"
                  value={journalForm.activities}
                  onChange={(e) => setJournalForm(prev => ({ ...prev, activities: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan & Refleksi</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base resize-none"
                  rows={4}
                  placeholder="Catatan, refleksi, atau hal-hal penting lainnya"
                  value={journalForm.notes}
                  onChange={(e) => setJournalForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="flex-1 order-2 sm:order-1 h-10 sm:h-11"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 order-1 sm:order-2 h-10 sm:h-11"
                  onClick={handleUpdateJournal}
                  disabled={saving}
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Detail Journal Modal */}
          <Modal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title="Detail Jurnal"
            size="xl"
          >
            {selectedJournal && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Kelas</h3>
                    <p className="mt-1 text-sm sm:text-base">{getClassName(selectedJournal.classId)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tanggal</h3>
                    <p className="mt-1 text-sm sm:text-base">{formatDate(selectedJournal.date)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Topik Pembelajaran</h3>
                  <p className="mt-1 text-sm sm:text-base">{selectedJournal.topic}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Aktivitas Pembelajaran</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm sm:text-base">{selectedJournal.activities}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Catatan & Refleksi</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm sm:text-base">{selectedJournal.notes || '-'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Dibuat Pada</h3>
                  <p className="mt-1 text-sm sm:text-base">{selectedJournal.createdAt ? formatDate(selectedJournal.createdAt) : '-'}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="flex-1 order-2 sm:order-1 h-10 sm:h-11"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Tutup
                  </Button>
                  <Button
                    className="flex-1 order-1 sm:order-2 h-10 sm:h-11"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditJournal(selectedJournal);
                    }}
                  >
                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Edit Jurnal
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Hapus Jurnal"
          >
            {selectedJournal && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  <div>
                    <h4 className="font-medium text-red-800 text-sm sm:text-base">Konfirmasi Penghapusan</h4>
                    <p className="text-xs sm:text-sm text-red-600">Tindakan ini tidak dapat dibatalkan</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Anda yakin ingin menghapus jurnal dengan topik <strong>"{selectedJournal.topic}"</strong> 
                    untuk kelas <strong>{getClassName(selectedJournal.classId)}</strong> 
                    pada tanggal <strong>{formatDate(selectedJournal.date)}</strong>?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="flex-1 order-2 sm:order-1 h-10 sm:h-11"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={saving}
                  >
                    Batal
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 order-1 sm:order-2 h-10 sm:h-11"
                    onClick={handleConfirmDelete}
                    disabled={saving}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {saving ? 'Menghapus...' : 'Hapus Jurnal'}
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Template Detail Modal */}
          <Modal
            isOpen={showTemplateModal}
            onClose={() => setShowTemplateModal(false)}
            title="Detail Template"
            size="large"
          >
            {selectedTemplate && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nama Template</h3>
                    <p className="mt-1 font-medium text-sm sm:text-base">{selectedTemplate.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="mt-1">
                      {selectedTemplate.isDefault ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Template Default
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Template Kustom
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Deskripsi</h3>
                  <p className="mt-1 text-sm sm:text-base">{selectedTemplate.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Template Topik</h3>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm">{selectedTemplate.topic}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Template Aktivitas</h3>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <pre className="text-sm whitespace-pre-wrap">{selectedTemplate.activities}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Template Catatan</h3>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm">{selectedTemplate.notes}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="flex-1 order-2 sm:order-1 h-10 sm:h-11"
                    onClick={() => setShowTemplateModal(false)}
                  >
                    Tutup
                  </Button>
                  <Button
                    className="flex-1 order-1 sm:order-2 h-10 sm:h-11"
                    onClick={() => handleUseTemplate(selectedTemplate)}
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Gunakan Template
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </motion.div>
      
      {/* Notification Toast */}
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
    </motion.div>
  );
};

export default JurnalPage; 