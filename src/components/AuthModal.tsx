
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onAuthSuccess?: () => void;
}

const AuthModal = ({ isOpen, onClose, initialMode = 'signin', onAuthSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, googleLogin: contextGoogleLogin } = useAuth();

  useEffect(() => {
    setMode(initialMode);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
      if (firstName.trim().length < 2) {
        toast.error('First name must be at least 2 characters.');
        return;
      }
      if (lastName.trim().length < 2) {
        toast.error('Last name must be at least 2 characters.');
        return;
      }
    }
    setIsLoading(true);
    try {
      if (mode === 'signup') {
        await register({ first_name: firstName, last_name: lastName, email, password });
        toast.success('Registration successful! Please sign in.');
        setMode('signin');
      } else {
        await login({ email, password });
        toast.success('Signed in successfully!');
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    if (tokenResponse.credential) {
      setIsLoading(true);
      try {
        await contextGoogleLogin(tokenResponse.credential);
        toast.success('Signed in with Google successfully!');
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      } catch (error: any) {
        toast.error(error.message || 'Google sign-in failed.');
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error('Google sign-in failed: No ID token received.');
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed.');
    toast.error('Google sign-in failed. Please try again.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-slate-800">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Social Authentication */}
          <div className="space-y-3">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              render={({ onClick, disabled }) => (
                <Button
                  variant="outline"
                  className="w-full h-12 text-sm font-medium border-slate-200 hover:bg-slate-50 text-slate-700"
                  onClick={onClick}
                  disabled={disabled || isLoading}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.02C43.41 37.26 47 31.45 47 24.55z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6.02c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span className="text-slate-700">Continue with Google</span>
                  </div>
                </Button>
              )}
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-3 text-sm text-slate-500">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-sm font-medium text-slate-700">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10 h-12 border-slate-200 focus:border-primary-300 focus:ring-primary-200 text-slate-800 bg-white placeholder:text-slate-400"
                      placeholder="Enter your first name"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-sm font-medium text-slate-700">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10 h-12 border-slate-200 focus:border-primary-300 focus:ring-primary-200 text-slate-800 bg-white placeholder:text-slate-400"
                      placeholder="Enter your last name"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-slate-200 focus:border-primary-300 focus:ring-primary-200 text-slate-800 bg-white placeholder:text-slate-400"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-slate-200 focus:border-primary-300 focus:ring-primary-200 text-slate-800 bg-white placeholder:text-slate-400"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-primary-300 focus:ring-primary-200 text-slate-800 bg-white placeholder:text-slate-400"
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-medium"
            >
              {isLoading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Mode Toggle */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
                disabled={isLoading}
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
