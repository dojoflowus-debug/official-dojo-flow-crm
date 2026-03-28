import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { trpc } from '../utils/trpc';

/**
 * Payment Settings Page
 * Allows location owners to configure Fluid Pay payment processing
 */

export default function PaymentSettings() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    publicKey: '',
    privateKey: '',
    merchantId: '',
    environment: 'SANDBOX' as const,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch existing payment provider configuration
  const { data: provider } = trpc.fluidPay.getPaymentProvider.useQuery();

  // Setup payment provider mutation
  const setupPaymentMutation = trpc.fluidPay.setupPaymentProvider.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Payment provider configured successfully!' });
      setFormData({ publicKey: '', privateKey: '', merchantId: '', environment: 'SANDBOX' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message || 'Failed to configure payment provider' });
    },
  });

  useEffect(() => {
    if (provider) {
      setFormData((prev) => ({
        ...prev,
        environment: provider.environment,
        merchantId: provider.merchantId || '',
      }));
    }
  }, [provider]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await setupPaymentMutation.mutateAsync({
        publicKey: formData.publicKey,
        privateKey: formData.privateKey,
        merchantId: formData.merchantId || undefined,
        environment: formData.environment,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`min-h-screen flex flex-col ${
          isDark ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-8 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Payment Settings
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure Fluid Pay payment processing for your location
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 py-8 max-w-2xl">
          {/* Status Card */}
          {provider && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                provider.status === 'connected'
                  ? isDark
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-green-50 border-green-200'
                  : isDark
                  ? 'bg-yellow-900/20 border-yellow-500/30'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    provider.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <div>
                  <p
                    className={`font-semibold ${
                      provider.status === 'connected'
                        ? isDark
                          ? 'text-green-200'
                          : 'text-green-900'
                        : isDark
                        ? 'text-yellow-200'
                        : 'text-yellow-900'
                    }`}
                  >
                    {provider.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </p>
                  <p
                    className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Environment: {provider.environment}
                    {provider.lastVerifiedAt && ` • Last verified: ${new Date(provider.lastVerifiedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message Alert */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                message.type === 'success'
                  ? isDark
                    ? 'bg-green-900/20 border-green-500/30 text-green-200'
                    : 'bg-green-50 border-green-200 text-green-900'
                  : isDark
                  ? 'bg-red-900/20 border-red-500/30 text-red-200'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Public Key */}
            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                Public Key
              </label>
              <input
                type="text"
                name="publicKey"
                value={formData.publicKey}
                onChange={handleInputChange}
                placeholder="pub_..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                required
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Your Fluid Pay public API key
              </p>
            </div>

            {/* Private Key */}
            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                Private Key
              </label>
              <input
                type="password"
                name="privateKey"
                value={formData.privateKey}
                onChange={handleInputChange}
                placeholder="api_..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
                required
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Your Fluid Pay private API key (encrypted)
              </p>
            </div>

            {/* Merchant ID */}
            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                Merchant ID (Optional)
              </label>
              <input
                type="text"
                name="merchantId"
                value={formData.merchantId}
                onChange={handleInputChange}
                placeholder="Your merchant ID"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
              />
            </div>

            {/* Environment */}
            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                Environment
              </label>
              <select
                name="environment"
                value={formData.environment}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
              >
                <option value="SANDBOX">Sandbox (Testing)</option>
                <option value="PRODUCTION">Production (Live)</option>
              </select>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Use Sandbox for testing, Production for live payments
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || setupPaymentMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading || setupPaymentMutation.isPending ? 'Saving...' : 'Save Payment Settings'}
            </button>
          </form>

          {/* Info Box */}
          <div
            className={`mt-8 p-4 rounded-lg border ${
              isDark ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            }`}
          >
            <h3
              className={`font-semibold mb-2 ${
                isDark ? 'text-blue-200' : 'text-blue-900'
              }`}
            >
              How to get your Fluid Pay credentials:
            </h3>
            <ol
              className={`text-sm space-y-1 list-decimal list-inside ${
                isDark ? 'text-blue-100' : 'text-blue-800'
              }`}
            >
              <li>Log in to your Fluid Pay merchant dashboard</li>
              <li>Navigate to API Keys or Developer Settings</li>
              <li>Copy your Public Key and Private Key</li>
              <li>Paste them here and select your environment</li>
              <li>Click Save to enable payment processing</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
