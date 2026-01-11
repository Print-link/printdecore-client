import { useNavigate } from 'react-router-dom';
import { LogIn, User, X } from 'lucide-react';

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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-[#fbbf24] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-[#fbbf24]" />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#fbbf24] text-white font-semibold rounded-lg hover:bg-[#f59e0b] transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          
          <button
            onClick={handleSignUp}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4" />
            Create Account
          </button>
        </div>

        {/* Skip for now */}
        <button
          onClick={onClose}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};