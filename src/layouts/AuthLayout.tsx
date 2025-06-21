import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Kelas Guru</h1>
          <p className="text-gray-500 mt-2">Platform manajemen pembelajaran</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {children}
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Kelas Guru. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 