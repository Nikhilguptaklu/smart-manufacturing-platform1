import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Factory,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email.trim() || !password) {
      toast('Please enter email and password', 'error');
      return;
    }

    setLoading(true);

    try {
      const signInResult = await signIn(
        email.trim(),
        password
      );

      const { error } = signInResult;

      if (error) {
        toast(error, 'error');
        return;
      }

      const nextRoute = signInResult?.user?.role === 'customer' ? '/customer' : '/dashboard';
      toast('Welcome back!', 'success');

      navigate(nextRoute, {
        replace: true,
      });
    } catch (error) {
      console.error('LOGIN PAGE ERROR:', error);

      toast(
        'Something went wrong. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // DEMO ACCOUNT FILL
  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex">

      {/* =====================================================
          LEFT SIDE
      ====================================================== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f172a] via-[#0f4c75] to-[#1b98e0] relative overflow-hidden">

        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">

          {/* Logo */}
          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Factory className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                SmartFactory
              </h1>

              <p className="text-xs text-blue-200 uppercase tracking-wider">
                Manufacturing Platform
              </p>
            </div>

          </div>

          {/* Hero Text */}
          <div>

            <h2 className="text-4xl font-bold leading-tight mb-4">
              AI-Powered Smart Manufacturing
              <br />
              Digital Transformation
            </h2>

            <p className="text-blue-100 text-lg max-w-md">
              Integrate business operations, production,
              inventory, and analytics into one centralized
              enterprise platform.
            </p>

          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">

            {[
              {
                label: 'Products',
                value: '12+',
              },
              {
                label: 'Production Lines',
                value: '5',
              },
              {
                label: 'Customers',
                value: '12+',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur rounded-xl p-4"
              >
                <p className="text-2xl font-bold">
                  {stat.value}
                </p>

                <p className="text-xs text-blue-200">
                  {stat.label}
                </p>
              </div>
            ))}

          </div>

        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE
      ====================================================== */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50">

        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" />
            </div>

            <h1 className="text-lg font-bold text-gray-900">
              SmartFactory
            </h1>

          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to your account
          </h2>

          <p className="text-sm text-gray-500 mb-8">
            Enter your credentials to access the platform
          </p>

          {/* =================================================
              LOGIN FORM
          ================================================== */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Email */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>

              <div className="relative">

                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="you@company.com"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>

              <div className="relative">

                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="••••••••"
                />

                {/* Show / Hide Password */}
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>

              </div>

            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >

              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}

            </button>

          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-500 mt-6">

            Don't have an account?{' '}

            <Link
              to="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Create one
            </Link>

          </p>

          {/* =================================================
              DEMO ACCOUNTS
          ================================================== */}
          <div className="mt-8 pt-6 border-t border-gray-200">

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Demo Accounts (click to fill)
            </p>

            <div className="grid grid-cols-2 gap-2">

              {[
                {
                  label: 'Admin',
                  email: 'admin@gmail.com',
                  pass: 'Sm@rtF@ct0ry!Adm1n',
                  color: 'text-red-600',
                },
                {
                  label: 'Manager',
                  email: 'manager@gmail.com',
                  pass: 'Sm@rtF@ctory!Mngr',
                  color: 'text-blue-600',
                },
                {
                  label: 'Engineer',
                  email: 'engineer@gmail.com',
                  pass: 'Engineer@123',
                  color: 'text-teal-600',
                },
                {
                  label: 'Employee',
                  email: 'employee@gmail.com',
                  pass: 'Sm@rtF@ct0ry!Empl',
                  color: 'text-slate-600',
                },
                {
                  label: 'Customer',
                  email: 'customer@gmail.com',
                  pass: 'Customer@123',
                  color: 'text-purple-600',
                },
              ].map((demo) => (

                <button
                  key={demo.label}
                  type="button"
                  onClick={() =>
                    fillDemo(
                      demo.email,
                      demo.pass
                    )
                  }
                  className="text-left p-2.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >

                  <p
                    className={`text-xs font-semibold ${demo.color}`}
                  >
                    {demo.label}
                  </p>

                  <p className="text-[10px] text-gray-400 truncate">
                    {demo.email}
                  </p>

                </button>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}