import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, BookOpen, Award, Calendar, BookMarked, Layers, Settings, BarChart, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearSessionCredentials, getCurrentUser } from '@/lib/api';

const TeacherLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get current user from localStorage
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // If no user data, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear session credentials and navigate to login
    clearSessionCredentials();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: 'Dashboard', path: '/guru', icon: <Home size={20} /> },
    { name: 'Kelas', path: '/guru/kelas', icon: <BookOpen size={20} /> },
    { name: 'Siswa', path: '/guru/siswa', icon: <Users size={20} /> },
    { name: 'Tugas', path: '/guru/tugas', icon: <BookMarked size={20} /> },
    { name: 'Nilai', path: '/guru/nilai', icon: <Award size={20} /> },
    { name: 'Presensi', path: '/guru/presensi', icon: <Calendar size={20} /> },
    { name: 'Jurnal', path: '/guru/jurnal', icon: <Layers size={20} /> },
    { name: 'Kegiatan', path: '/guru/kegiatan', icon: <Calendar size={20} /> },
    { name: 'Bank Soal', path: '/guru/bank-soal', icon: <BookMarked size={20} /> },
    { name: 'Gamifikasi', path: '/guru/gamifikasi', icon: <BarChart size={20} /> },
    { name: 'Pengaturan', path: '/guru/pengaturan', icon: <Settings size={20} /> },
  ];

  // Show loading if no user data yet
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
        <div className="flex flex-col h-full bg-card border-r border-border">
          {/* Logo/Header */}
          <div className="h-16 flex items-center px-6 border-b border-border bg-card">
            <h1 className="text-xl font-bold text-foreground">Kelas Guru</h1>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* User section */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {currentUser.fullName?.[0] || currentUser.username?.[0] || 'G'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {currentUser.fullName || currentUser.username || 'Guru'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {currentUser.username}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-10"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Keluar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile header */}
        <header className="h-16 lg:hidden flex items-center justify-between border-b border-border px-4 bg-card/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              className="text-foreground hover:bg-muted"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
            <h1 className="text-lg font-bold text-foreground">Kelas Guru</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
            {currentUser.fullName?.[0] || currentUser.username?.[0] || 'G'}
          </div>
        </header>
        
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={toggleMobileMenu}
            />
            
            {/* Menu panel */}
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-card shadow-2xl">
              {/* Menu header */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                <h1 className="text-lg font-bold text-foreground">Menu</h1>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMobileMenu}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </Button>
              </div>
              
              {/* User info */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {currentUser.fullName?.[0] || currentUser.username?.[0] || 'G'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {currentUser.fullName || currentUser.username || 'Guru'}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {currentUser.username}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation links */}
              <div className="flex-1 py-4 overflow-y-auto">
                <div className="space-y-1 px-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        location.pathname === item.path
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                      onClick={toggleMobileMenu}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                </div>
                
                {/* Logout button */}
                <div className="mt-6 px-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-11"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    Keluar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] lg:min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout; 