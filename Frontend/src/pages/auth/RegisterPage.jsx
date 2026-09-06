import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Factory,
    Mail,
    Lock,
    User,
    ArrowRight,
    Phone,
    Building
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

export default function RegisterPage() {
    const { signUp } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fullName || !email || !phone || !department || !password) {
            toast('Please fill all fields', 'error');
            return;
        }

        if (password.length < 8) {
            toast('Password must be at least 8 characters', 'error');
            return;
        }

        setLoading(true);

        try {
            const { error } = await signUp(
                email.trim(),
                password,
                fullName.trim(),
                phone.trim(),
                department
            );

            if (error) {
                toast(error, 'error');
                return;
            }

            toast('Account created. Please sign in.', 'success');
            navigate('/login', { replace: true });
        } catch (error) {
            toast('Registration failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">

            {/* LEFT SIDE */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-cyan-500 items-center justify-center p-12">
                <div className="text-white max-w-md">

                    <div className="flex items-center gap-3 mb-8">
                        <Factory className="w-12 h-12" />

                        <h1 className="text-3xl font-bold">
                            SmartFactory
                        </h1>
                    </div>

                    <h2 className="text-4xl font-bold mb-4">
                        Join SmartFactory
                    </h2>

                    <p className="text-blue-100 text-lg">
                        Access your manufacturing digital transformation
                        platform.
                    </p>

                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">

                <div className="w-full max-w-md">

                    <div className="bg-white rounded-2xl shadow-xl p-8">

                        {/* Mobile Logo */}
                        <div className="flex items-center gap-3 mb-8 lg:hidden">
                            <Factory className="w-9 h-9 text-blue-600" />

                            <h1 className="text-xl font-bold">
                                SmartFactory
                            </h1>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Create account
                        </h2>

                        <p className="text-gray-500 mb-6">
                            Register for the manufacturing platform
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>

                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) =>
                                            setFullName(e.target.value)
                                        }
                                        placeholder="John Smith"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        placeholder="you@company.com"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>

                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        placeholder="+91 9876543210"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department
                                </label>

                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                                    <select
                                        required
                                        value={department}
                                        onChange={(e) =>
                                            setDepartment(e.target.value)
                                        }
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                    >
                                        <option value="">
                                            Select Department
                                        </option>

                                        <option value="Production">
                                            Production
                                        </option>

                                        <option value="Engineering">
                                            Engineering
                                        </option>

                                        <option value="IT">
                                            IT
                                        </option>

                                        <option value="Quality">
                                            Quality
                                        </option>

                                        <option value="Sales">
                                            Sales
                                        </option>

                                        <option value="Procurement">
                                            Procurement
                                        </option>

                                        <option value="Finance">
                                            Finance
                                        </option>

                                        <option value="Human Resources">
                                            Human Resources
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>

                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-60"
                            >
                                {loading
                                    ? 'Creating account...'
                                    : 'Create Account'}

                                {!loading && (
                                    <ArrowRight className="w-4 h-4" />
                                )}
                            </button>

                        </form>

                        <p className="text-center text-sm text-gray-500 mt-6">
                            Already have an account?{' '}

                            <Link
                                to="/login"
                                className="text-blue-600 font-medium hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}