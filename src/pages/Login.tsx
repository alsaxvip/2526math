import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { authApi, getCurrentUser } from '@/lib/api';
import { 
  GraduationCap, 
  BookOpen, 
  RefreshCw, 
  Eye, 
  EyeOff,
  User,
  Lock,
  ArrowRight,
  Shield,
  Users
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');
  const [showAdmin, setShowAdmin] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      // User is already logged in, redirect to appropriate dashboard
      if (user.role === 'teacher') {
        navigate('/guru');
      } else if (user.role === 'student') {
        navigate('/siswa');
      }
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.username || !form.password) {
      setError('Username dan password harus diisi');
      setLoading(false);
      return;
    }

    try {
      // Kirim data ke backend Google Apps Script
      const data = await authApi.login(form.username, form.password);
      
      if (data.success) {
        // Session dan user data disimpan di localStorage via authApi.login
        
        // Redirect ke dashboard sesuai role
        if (data.user.role === 'teacher') {
          navigate('/guru');
        } else if (data.user.role === 'student') {
          // Pastikan siswa diarahkan ke dashboard siswa
          navigate('/siswa');
        } else {
          setError('Tipe user tidak valid.');
        }
      } else {
        // Tampilkan pesan error spesifik
        setError('Username atau password tidak valid. Silakan coba lagi.');
        console.error('Login error:', data.error);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menghubungi server. Silakan coba beberapa saat lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: 'teacher' | 'student') => {
    setActiveTab(tab);
    setForm({ username: '', password: '' });
    setError('');
  };

  // Verify student data - for admin only
  const verifyStudentData = async () => {
    setVerifying(true);
    setVerificationResult('');
    try {
      const result = await authApi.verifyStudents();
      if (result.success) {
        setVerificationResult(`Verifikasi berhasil: ${result.message}`);
      } else {
        setVerificationResult(`Verifikasi gagal: ${result.error}`);
      }
    } catch (err) {
      setVerificationResult('Terjadi kesalahan saat melakukan verifikasi');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  // Toggle admin panel on pressing Ctrl+Shift+A
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        setShowAdmin(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md relative"
      >
        {/* Role selection tabs */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-lg transition-all duration-200 text-sm ${
                activeTab === 'teacher' 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => switchTab('teacher')}
            >
              <BookOpen size={18} />
              <span>Guru</span>
            </button>
            <button
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-lg transition-all duration-200 text-sm ${
                activeTab === 'student' 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => switchTab('student')}
            >
              <GraduationCap size={18} />
              <span>Siswa</span>
            </button>
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardHeader className="pb-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Kelas Guru
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                {activeTab === 'teacher' 
                  ? 'Masuk ke dashboard guru untuk mengelola kelas dan siswa'
                  : 'Masuk ke dashboard siswa untuk melihat progress belajar'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder={activeTab === 'teacher' ? 'Masukkan username guru' : 'Masukkan username siswa'}
                      className="pl-10 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Masukkan password"
                      className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm sm:text-base"
                  disabled={loading || !form.username || !form.password}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Masuk...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Masuk</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Admin Panel - Hidden by default */}
        <AnimatePresence>
          {showAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-4 sm:mt-6"
            >
              <Card className="border-orange-200 bg-orange-50/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                    <Shield className="w-5 h-5" />
                    Admin Panel
                  </CardTitle>
                  <CardDescription className="text-orange-700 text-sm">
                    Panel administratif untuk verifikasi sistem
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <Button
                    onClick={verifyStudentData}
                    disabled={verifying}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 h-10 sm:h-11 text-sm sm:text-base"
                  >
                    {verifying ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memverifikasi...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Verifikasi Data Siswa</span>
                      </div>
                    )}
                  </Button>
                  
                  <AnimatePresence>
                    {verificationResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white p-3 rounded border border-orange-200 text-sm text-gray-700"
                      >
                        {verificationResult}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <p className="text-xs text-orange-600 text-center">
                    Press Ctrl+Shift+A to toggle this panel
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login; 