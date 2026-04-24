'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';

interface NotificationPrefs {
  emailOnMessage: boolean;
  emailOnConnection: boolean;
  emailOnJob: boolean;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    emailOnMessage: true,
    emailOnConnection: true,
    emailOnJob: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((data) => {
        const p = data.data?.notificationPreferences || data.notificationPreferences;
        if (p) setPrefs({ emailOnMessage: p.emailOnMessage ?? true, emailOnConnection: p.emailOnConnection ?? true, emailOnJob: p.emailOnJob ?? true });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/user/me/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-sm text-gray-500 mt-0.5">Choose which email notifications you receive</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="w-5 h-5 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[
              { key: 'emailOnMessage' as const, label: 'Messages', desc: 'Email when you receive a new message and are offline' },
              { key: 'emailOnConnection' as const, label: 'Connections', desc: 'Email for connection requests and acceptances' },
              { key: 'emailOnJob' as const, label: 'Jobs', desc: 'Email when new job opportunities are posted' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs[key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  role="switch"
                  aria-checked={prefs[key]}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          {saved && <p className="text-sm text-green-600">Preferences saved!</p>}
          <div className="ml-auto">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
