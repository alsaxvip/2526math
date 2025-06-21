import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Calendar, Clock, Pencil, Trash2, Eye, CalendarDays, Users, CheckCircle, X, Save, AlertCircle, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { classApi, eventApi } from '@/lib/api';

// Interfaces
interface Class {
  id: string;
  name: string;
  description: string;
  studentCount: number;
}

interface Event {
  id: string;
  classId: string;
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
  createdAt: string;
  className?: string;
}

interface EventForm {
  classId: string;
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
}

interface ReportData {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  eventsByType: Array<{
    type: string;
    count: number;
  }>;
  eventsByClass: Array<{
    className: string;
    count: number;
  }>;
  eventsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

// Event types
const EVENT_TYPES = [
  { value: 'ujian', label: 'Ujian', icon: '📝', color: 'bg-red-100 text-red-700' },
  { value: 'tugas', label: 'Tugas', icon: '📚', color: 'bg-blue-100 text-blue-700' },
  { value: 'presentasi', label: 'Presentasi', icon: '🎤', color: 'bg-purple-100 text-purple-700' },
  { value: 'praktikum', label: 'Praktikum', icon: '🔬', color: 'bg-green-100 text-green-700' },
  { value: 'karyawisata', label: 'Karyawisata', icon: '🚌', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'olahraga', label: 'Olahraga', icon: '⚽', color: 'bg-orange-100 text-orange-700' },
  { value: 'seminar', label: 'Seminar', icon: '🎓', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'lainnya', label: 'Lainnya', icon: '📅', color: 'bg-gray-100 text-gray-700' }
];

// Enhanced Notification Toast Component
const NotificationToast = ({ notification, onClose }: {
  notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; visible: boolean };
  onClose: () => void;
}) => {
  if (!notification.visible) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'error': return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'warning': return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case 'info': return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 p-3 sm:p-4 rounded-lg border shadow-lg max-w-md ${getColors()}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0">{getIcon()}</div>
            <span className="ml-2 font-medium text-sm sm:text-base truncate">{notification.message}</span>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg border p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-200 rounded-full"></div>
            <div className="h-5 sm:h-6 w-12 sm:w-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-5 sm:h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 sm:h-4 w-full bg-gray-200 rounded mb-3"></div>
          <div className="flex items-center gap-4">
            <div className="h-3 sm:h-4 w-24 sm:w-32 bg-gray-200 rounded"></div>
            <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Enhanced Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'default' }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'large' | 'xl';
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    default: 'max-w-md',
    large: 'max-w-2xl',
    xl: 'max-w-4xl'
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
          transition={{ duration: 0.2 }}
          className={`bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden mx-4`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const EventsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Form state
  const [eventForm, setEventForm] = useState<EventForm>({
    classId: '',
    title: '',
    description: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventType: 'lainnya'
  });

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    visible: boolean;
  }>({
    type: 'success',
    message: '',
    visible: false
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClasses(),
        fetchEvents()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showNotification('error', 'Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classApi.getAll();
      if (response.success) {
        setClasses(response.classes || []);
      } else {
        showNotification('error', 'Gagal memuat daftar kelas');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      showNotification('error', 'Gagal memuat daftar kelas');
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await eventApi.getAll();
      if (response.success) {
        const eventsWithClass = (response.events || []).map((event: Event) => ({
          ...event,
          className: getClassName(event.classId)
        }));
        setEvents(eventsWithClass);
        calculateReportData(eventsWithClass);
      } else {
        showNotification('error', 'Gagal memuat daftar kegiatan');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      showNotification('error', 'Gagal memuat daftar kegiatan');
    }
  };

  const calculateReportData = (eventData: Event[]) => {
    const now = new Date();
    const upcoming = eventData.filter(event => new Date(event.eventDate) >= now);
    const past = eventData.filter(event => new Date(event.eventDate) < now);

    // Events by type
    const typeMap = new Map();
    eventData.forEach(event => {
      typeMap.set(event.eventType, (typeMap.get(event.eventType) || 0) + 1);
    });

    // Events by class
    const classMap = new Map();
    eventData.forEach(event => {
      const className = event.className || 'Unknown';
      classMap.set(className, (classMap.get(className) || 0) + 1);
    });

    // Events by month
    const monthMap = new Map();
    eventData.forEach(event => {
      const month = new Date(event.eventDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });

    setReportData({
      totalEvents: eventData.length,
      upcomingEvents: upcoming.length,
      pastEvents: past.length,
      eventsByType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
      eventsByClass: Array.from(classMap.entries()).map(([className, count]) => ({ className, count })),
      eventsByMonth: Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }))
    });
  };

  const getClassName = (classId: string) => {
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : 'Unknown Class';
  };

  const getEventTypeInfo = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES.find(t => t.value === 'lainnya')!;
  };

  const resetForm = () => {
    setEventForm({
      classId: '',
      title: '',
      description: '',
      eventDate: new Date().toISOString().split('T')[0],
      eventType: 'lainnya'
    });
  };

  const handleCreateEvent = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEventForm({
      classId: event.classId,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      eventType: event.eventType
    });
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.classId || !eventForm.eventDate) {
      showNotification('error', 'Harap isi semua field yang wajib!');
      return;
    }

    setSaving(true);
    try {
      const response = await eventApi.create(
        eventForm.classId,
        eventForm.title,
        eventForm.description,
        eventForm.eventDate,
        eventForm.eventType
      );

      if (response.success) {
        showNotification('success', 'Kegiatan berhasil dibuat!');
        setShowCreateModal(false);
        resetForm();
        fetchEvents();
      } else {
        showNotification('error', response.error || 'Gagal membuat kegiatan');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat membuat kegiatan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent || !eventForm.title || !eventForm.classId || !eventForm.eventDate) {
      showNotification('error', 'Harap isi semua field yang wajib!');
      return;
    }

    setSaving(true);
    try {
      const response = await eventApi.update(
        selectedEvent.id,
        eventForm.title,
        eventForm.description,
        eventForm.eventDate,
        eventForm.eventType
      );

      if (response.success) {
        showNotification('success', 'Kegiatan berhasil diperbarui!');
        setShowEditModal(false);
        setSelectedEvent(null);
        resetForm();
        fetchEvents();
      } else {
        showNotification('error', response.error || 'Gagal memperbarui kegiatan');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat memperbarui kegiatan');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;

    setSaving(true);
    try {
      const response = await eventApi.delete(selectedEvent.id);

      if (response.success) {
        showNotification('success', 'Kegiatan berhasil dihapus!');
        setShowDeleteModal(false);
        setSelectedEvent(null);
        fetchEvents();
      } else {
        showNotification('error', response.error || 'Gagal menghapus kegiatan');
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan saat menghapus kegiatan');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isEventUpcoming = (eventDate: string) => {
    return new Date(eventDate) >= new Date();
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.className || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'upcoming' && isEventUpcoming(event.eventDate)) ||
                         (filter === 'past' && !isEventUpcoming(event.eventDate)) ||
                         event.classId === filter;

    const matchesType = typeFilter === 'all' || event.eventType === typeFilter;
    
    return matchesSearch && matchesFilter && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 sm:h-4 w-48 sm:w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Notification */}
        <NotificationToast 
          notification={notification} 
          onClose={() => setNotification(prev => ({ ...prev, visible: false }))} 
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Kegiatan
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Kelola jadwal dan kegiatan kelas</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchEvents}
              className="border-gray-300 hover:bg-gray-50 h-10 sm:h-11 text-sm sm:text-base"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleCreateEvent}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg h-10 sm:h-11 text-sm sm:text-base"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Tambah Kegiatan
            </Button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-1 mb-4 sm:mb-6 inline-flex overflow-x-auto"
        >
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Daftar Kegiatan
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Laporan
          </button>
        </motion.div>

        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Search and Filter */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari kegiatan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 sm:h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors flex-1 sm:flex-none min-w-0"
                  >
                    <option value="all">Semua Waktu</option>
                    <option value="upcoming">Mendatang</option>
                    <option value="past">Sudah Lewat</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors flex-1 sm:flex-none min-w-0"
                  >
                    <option value="all">Semua Jenis</option>
                    {EVENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center"
                >
                  <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Belum ada kegiatan</h3>
                  <p className="text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                    {searchQuery || filter !== 'all' || typeFilter !== 'all' 
                      ? 'Tidak ada kegiatan yang sesuai dengan filter yang dipilih'
                      : 'Mulai dengan membuat kegiatan pertama Anda'
                    }
                  </p>
                  {(!searchQuery && filter === 'all' && typeFilter === 'all') && (
                    <Button 
                      onClick={handleCreateEvent} 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-10 sm:h-11 text-sm sm:text-base"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Tambah Kegiatan
                    </Button>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  className="grid gap-4"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {filteredEvents.map((event) => {
                    const typeInfo = getEventTypeInfo(event.eventType);
                    const upcoming = isEventUpcoming(event.eventDate);
                    
                    return (
                      <motion.div
                        key={event.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 }
                        }}
                        className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                  {typeInfo.icon} {typeInfo.label}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  upcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {upcoming ? '🔮 Mendatang' : '⏰ Sudah Lewat'}
                                </span>
                              </div>
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {event.title}
                              </h3>
                              <p className="text-gray-600 mb-3 sm:mb-4 line-clamp-2 text-sm sm:text-base">{event.description}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
                                <div className="flex items-center">
                                  <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{formatDate(event.eventDate)}</span>
                                </div>
                                <div className="flex items-center">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{event.className}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewEvent(event)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 sm:h-9 px-2 sm:px-3"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEvent(event)}
                                className="text-green-600 border-green-200 hover:bg-green-50 h-8 sm:h-9 px-2 sm:px-3"
                              >
                                <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEvent(event)}
                                className="text-red-600 border-red-200 hover:bg-red-50 h-8 sm:h-9 px-2 sm:px-3"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && reportData && (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
              <div className="bg-white p-4 sm:p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Kegiatan</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{reportData.totalEvents}</p>
                  </div>
                  <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Kegiatan Mendatang</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{reportData.upcomingEvents}</p>
                  </div>
                  <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Kegiatan Selesai</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600">{reportData.pastEvents}</p>
                  </div>
                  <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Events by Type */}
              <div className="bg-white p-4 sm:p-6 rounded-lg border">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Kegiatan per Jenis</h3>
                <div className="space-y-3">
                  {reportData.eventsByType.map(({ type, count }) => {
                    const typeInfo = getEventTypeInfo(type);
                    const percentage = Math.round((count / reportData.totalEvents) * 100);
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color} mr-3 flex-shrink-0`}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                          <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2 mr-2 sm:mr-3">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 w-6 sm:w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Events by Class */}
              <div className="bg-white p-4 sm:p-6 rounded-lg border">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Kegiatan per Kelas</h3>
                <div className="space-y-3">
                  {reportData.eventsByClass.map(({ className, count }) => {
                    const percentage = Math.round((count / reportData.totalEvents) * 100);
                    return (
                      <div key={className} className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{className}</span>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                          <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2 mr-2 sm:mr-3">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 w-6 sm:w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Events by Month */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Kegiatan per Bulan</h3>
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {reportData.eventsByMonth.map(({ month, count }) => (
                  <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{month}</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 flex-shrink-0 ml-2">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Tambah Kegiatan Baru"
        >
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas <span className="text-red-500">*</span>
              </label>
              <select
                value={eventForm.classId}
                onChange={(e) => setEventForm({ ...eventForm, classId: e.target.value })}
                className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                required
              >
                <option value="">Pilih Kelas</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Kegiatan <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Masukkan judul kegiatan"
                className="h-10 sm:h-11 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kegiatan
              </label>
              <select
                value={eventForm.eventType}
                onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Kegiatan <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={eventForm.eventDate}
                onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                className="h-10 sm:h-11 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Masukkan deskripsi kegiatan"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveEvent}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto order-1 sm:order-2 h-10 sm:h-11"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Event Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Kegiatan"
        >
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas <span className="text-red-500">*</span>
              </label>
              <select
                value={eventForm.classId}
                onChange={(e) => setEventForm({ ...eventForm, classId: e.target.value })}
                className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                required
              >
                <option value="">Pilih Kelas</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Kegiatan <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Masukkan judul kegiatan"
                className="h-10 sm:h-11 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kegiatan
              </label>
              <select
                value={eventForm.eventType}
                onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                className="w-full px-3 py-2 h-10 sm:h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Kegiatan <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={eventForm.eventDate}
                onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                className="h-10 sm:h-11 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Masukkan deskripsi kegiatan"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdateEvent}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto order-1 sm:order-2 h-10 sm:h-11"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Event Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Detail Kegiatan"
        >
          {selectedEvent && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Judul</label>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedEvent.title}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Kelas</label>
                    <p className="font-medium text-gray-900">{selectedEvent.className}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Jenis</label>
                    <div className="flex items-center">
                      {(() => {
                        const typeInfo = getEventTypeInfo(selectedEvent.eventType);
                        return (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Tanggal</label>
                  <p className="font-medium text-gray-900">{formatDate(selectedEvent.eventDate)}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {isEventUpcoming(selectedEvent.eventDate) ? '🔮 Mendatang' : '⏰ Sudah Lewat'}
                  </p>
                </div>

                {selectedEvent.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Deskripsi</label>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{selectedEvent.description}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Dibuat</label>
                  <p className="text-xs sm:text-sm text-gray-600">{formatTime(selectedEvent.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditEvent(selectedEvent);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto order-1 sm:order-2 h-10 sm:h-11"
                >
                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Konfirmasi Hapus"
        >
          {selectedEvent && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center text-amber-600 mb-4">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                <span className="font-medium text-sm sm:text-base">Peringatan!</span>
              </div>
              <p className="text-gray-700 text-sm sm:text-base">
                Apakah Anda yakin ingin menghapus kegiatan <strong>"{selectedEvent.title}"</strong>?
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto order-1 sm:order-2 h-10 sm:h-11"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Hapus
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default EventsPage; 