import { useNavigate } from 'react-router-dom';
import { SignIn, User, X } from '@phosphor-icons/react';

interface AuthPromptProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  title?: string;
}

export const AuthPrompt = ({ 
  isOpen, 
  onClose, 
  message = "Sign in to place orders and access exclusive features",
  title = "Authentication Required"
}: AuthPromptProps) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    onClose();
    navigate('/login');
  };

  const handleSignUp = () => {
    onClose();
    navigate('/register');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X size={20} weight="bold" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-[#fbbf24] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
          <SignIn size={32} weight="duotone" className="text-[#fbbf24]" />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#fbbf24] text-white font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors"
          >
            <SignIn size={16} weight="bold" />
            Sign In
          </button>
          
          <button
            onClick={handleSignUp}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
          >
            <User size={16} weight="duotone" />
            Create Account
          </button>
        </div>

        {/* Skip for now */}
        <button
          onClick={onClose}
          className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};