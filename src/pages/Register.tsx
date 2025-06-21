import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { 
  GraduationCap, 
  BookOpen, 
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  Shield
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student', // Default role adalah student
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi form
    if (!form.fullName || !form.username || !form.password || !form.confirmPassword) {
      setError('Semua field harus diisi');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (form.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      // Since there's no register endpoint yet, we'll simulate a successful registration
      // In a real app, this would be: const data = await authApi.register(...)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just redirect to login with success message
      // TODO: Implement actual registration endpoint in the backend
      console.log('Registration would be:', {
        username: form.username,
        fullName: form.fullName,
        role: form.role
      });
      
      // Simulate successful registration
      navigate('/login', { 
        state: { message: 'Pendaftaran berhasil! Silakan login dengan akun Anda.' }
      });
      
    } catch (err) {
      setError('Terjadi kesalahan saat menghubungi server. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Daftar Akun</h1>
          <p className="text-sm sm:text-base text-gray-600">Bergabung dengan platform pembelajaran modern</p>
        </motion.div>

        {/* Register Card */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <span>Buat Akun Baru</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Isi data diri Anda untuk membuat akun baru di Kelas Guru
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Full Name Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap Anda"
                      className="pl-10 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Daftar Sebagai
                  </label>
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                      type="button"
                      className={`flex-1 py-3 px-3 sm:px-4 flex items-center justify-center gap-2 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        form.role === 'student' 
                          ? 'bg-white text-green-600 shadow-sm font-medium' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setForm(prev => ({ ...prev, role: 'student' }))}
                    >
                      <GraduationCap size={18} className="sm:w-5 sm:h-5" />
                      <span>Siswa</span>
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-3 px-3 sm:px-4 flex items-center justify-center gap-2 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        form.role === 'teacher' 
                          ? 'bg-white text-green-600 shadow-sm font-medium' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setForm(prev => ({ ...prev, role: 'teacher' }))}
                    >
                      <BookOpen size={18} className="sm:w-5 sm:h-5" />
                      <span>Guru</span>
                    </button>
                  </div>
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Pilih username unik"
                      className="pl-10 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      required
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
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimal 6 karakter"
                      className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      required
                      autoComplete="new-password"
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

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Ulangi password"
                      className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-11 sm:h-12 text-sm sm:text-base"
                      disabled={loading}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
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

                {/* Register Button */}
                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium text-sm sm:text-base"
                  disabled={loading || !form.fullName || !form.username || !form.password || !form.confirmPassword}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Mendaftar...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Daftar Sekarang</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Login Link */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Sudah punya akun?{' '}
                    <Link 
                      to="/login" 
                      className="text-green-600 font-medium hover:text-green-700 hover:underline transition-colors"
                    >
                      Masuk disini
                    </Link>
                  </p>
                </div>
              </div>

              {/* Terms notice */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Dengan mendaftar, Anda menyetujui{' '}
                  <span className="text-green-600 hover:underline cursor-pointer">
                    Syarat & Ketentuan
                  </span>{' '}
                  dan{' '}
                  <span className="text-green-600 hover:underline cursor-pointer">
                    Kebijakan Privasi
                  </span>{' '}
                  kami.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="text-center mt-6 sm:mt-8"
        >
          <p className="text-xs sm:text-sm text-gray-500">
            © 2024 Kelas Guru. Platform pembelajaran digital.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register; 