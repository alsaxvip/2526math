import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Gamepad2, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const StudentLayout = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Periksa apakah user sudah login dan rolenya adalah student
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== 'student') {
        navigate('/login');
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#1a1c2e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1c2e] text-white">
      {/* Header */}
      <header className="h-16 flex items-center justify-between border-b border-[#353964] px-4 lg:px-8 bg-[#252940]">
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <Gamepad2 className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Student Dashboard
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="font-medium">{currentUser.fullName || 'Student'}</div>
              <div className="text-xs text-indigo-300">{currentUser.className || 'Student'}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white ring-2 ring-purple-400">
              {currentUser.fullName?.[0] || 'S'}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMobileMenu}
            className="md:hidden text-white hover:bg-[#353964]"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
          
          {/* Logout button for desktop */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex gap-2 bg-[#252940] border-[#353964] text-gray-300 hover:bg-[#353964] hover:text-white"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </header>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm" onClick={toggleMobileMenu}>
          <div className="fixed inset-y-0 right-0 w-3/4 max-w-sm z-50 bg-[#252940]" onClick={(e) => e.stopPropagation()}>
            <div className="h-16 flex items-center px-6 border-b border-[#353964]">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-5 w-5 text-indigo-400" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Menu</h1>
              </div>
            </div>
            
            <div className="p-4">
              <div className="bg-[#1e213a] rounded-lg p-4 border border-[#353964]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white ring-2 ring-purple-400">
                    {currentUser.fullName?.[0] || 'S'}
                  </div>
                  <div>
                    <div className="font-medium">{currentUser.fullName || 'Student'}</div>
                    <div className="text-xs text-indigo-300">{currentUser.className || 'Student'}</div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-[#252940] border-[#353964] text-gray-300 hover:bg-[#353964] hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout; 