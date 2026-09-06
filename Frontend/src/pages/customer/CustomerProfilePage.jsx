import { useEffect, useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { customerApi, normalizeObjectResponse } from '@/services/api';

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await customerApi.getProfile();
        setProfile(normalizeObjectResponse(response));
      } catch (err) {
        setError(err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your customer account details." />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {profile ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Full name</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{profile.full_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{profile.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{profile.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{profile.role || 'customer'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No profile data available.</p>
        )}
      </div>
    </div>
  );
}
