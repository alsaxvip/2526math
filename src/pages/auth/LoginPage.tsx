import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { AnimatedContainer, fadeInUp, slideInFromLeft } from '@/components/ui/motion';
import { Eye, EyeOff, GraduationCap, Users, BookOpen } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'Administrator' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <AnimatedContainer variant={slideInFromLeft} className="space-y-8">
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="flex items-center justify-center lg:justify-start gap-3 mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Kelas Guru
              </h1>
            </motion.div>
            
            <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Platform Manajemen Kelas Modern
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Kelola kelas, siswa, dan aktivitas pembelajaran dengan mudah dan efisien
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Users, title: "Manajemen Siswa", desc: "Kelola data siswa dengan mudah" },
                { icon: BookOpen, title: "Pembelajaran", desc: "Tugas dan penilaian terintegrasi" },
                { icon: GraduationCap, title: "Gamifikasi", desc: "Badge dan level untuk motivasi" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="text-center p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                >
                  <feature.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatedContainer>

        {/* Right Side - Login Form */}
        <AnimatedContainer variant={fadeInUp} delay={0.3}>
          <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Masuk ke Akun</CardTitle>
              <CardDescription>
                Masukkan username dan password untuk mengakses dashboard
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Demo Credentials */}
                <motion.div 
                  className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Demo Account:</p>
                  {demoUsers.map((user, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      onClick={() => {
                        setUsername(user.username);
                        setPassword(user.password);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                        <Badge variant="secondary" className="text-xs">{user.role}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{user.password}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </AnimatedContainer>
      </div>
    </div>
  );
};

export default LoginPage; 