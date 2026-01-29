import React, { useState, useEffect, useRef } from 'react';
import { trpc } from '../../lib/trpc';
import { toast } from 'sonner';
import { 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Image, 
  Clock, 
  DollarSign,
  Save,
  X,
  Upload,
  Trash2,
  RefreshCw
} from 'lucide-react';

// Card wrapper component
const SettingsCard = ({ 
  title, 
  subtitle,
  icon: Icon, 
  children 
}: { 
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div style={{
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
  }}>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px',
      marginBottom: subtitle ? '4px' : '20px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={20} color="#ef4444" />
      </div>
      <span style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{title}</span>
    </div>
    {subtitle && (
      <p style={{ 
        fontSize: '13px', 
        color: 'rgba(255, 255, 255, 0.5)', 
        marginBottom: '20px',
        marginLeft: '52px',
      }}>
        {subtitle}
      </p>
    )}
    {children}
  </div>
);

// Input field component
const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
}) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ 
      display: 'block', 
      fontSize: '14px', 
      color: 'rgba(255, 255, 255, 0.7)', 
      marginBottom: '8px',
    }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 200ms ease',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = error ? '#ef4444' : 'rgba(255, 255, 255, 0.15)';
      }}
    />
    {error && (
      <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{error}</p>
    )}
  </div>
);

// Textarea component
const TextareaField = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ 
      display: 'block', 
      fontSize: '14px', 
      color: 'rgba(255, 255, 255, 0.7)', 
      marginBottom: '8px',
    }}>
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
        resize: 'vertical',
        transition: 'border-color 200ms ease',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      }}
    />
  </div>
);

// Select dropdown component
const SelectField = ({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ 
      display: 'block', 
      fontSize: '14px', 
      color: 'rgba(255, 255, 255, 0.7)', 
      marginBottom: '8px',
    }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(30, 30, 30, 1)',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Logo upload component
const LogoUpload = ({
  label,
  currentUrl,
  onUpload,
  onRemove,
  uploading,
}: {
  label: string;
  currentUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '14px', 
        color: 'rgba(255, 255, 255, 0.7)', 
        marginBottom: '8px',
      }}>
        {label}
      </label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Preview */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '12px',
          border: '1px dashed rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {currentUrl ? (
            <img 
              src={currentUrl} 
              alt="Logo preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain' 
              }} 
            />
          ) : (
            <Image size={32} color="rgba(255, 255, 255, 0.3)" />
          )}
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: '13px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {currentUrl && (
            <button
              onClick={onRemove}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backgroundColor: 'transparent',
                color: '#ef4444',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px' }}>
        PNG, JPG, or WebP. Max 5MB. Recommended: 256×256 or larger.
      </p>
    </div>
  );
};

export function SchoolProfileSettingsTab() {
  // Form state
  const [schoolName, setSchoolName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPostal, setAddressPostal] = useState('');
  const [addressCountry, setAddressCountry] = useState('');
  const [logoLightUrl, setLogoLightUrl] = useState<string | null>(null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingLight, setUploadingLight] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Original data for cancel/reset
  const [originalData, setOriginalData] = useState<any>(null);
  
  // Queries
  const profileQuery = trpc.schoolProfile.get.useQuery();
  const timezonesQuery = trpc.schoolProfile.getTimezones.useQuery();
  
  // Mutations
  const upsertMutation = trpc.schoolProfile.upsert.useMutation();
  const updateLogoMutation = trpc.schoolProfile.updateLogo.useMutation();
  const uploadMutation = trpc.upload.uploadAttachment.useMutation();
  
  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'MXN', label: 'MXN - Mexican Peso' },
    { value: 'BRL', label: 'BRL - Brazilian Real' },
  ];
  
  // Load profile data
  useEffect(() => {
    if (profileQuery.data) {
      const data = profileQuery.data;
      setSchoolName(data.schoolName || '');
      setDisplayName(data.displayName || '');
      setTagline(data.tagline || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setWebsite(data.website || '');
      setAddressStreet(data.addressStreet || '');
      setAddressCity(data.addressCity || '');
      setAddressState(data.addressState || '');
      setAddressPostal(data.addressPostal || '');
      setAddressCountry(data.addressCountry || '');
      setLogoLightUrl(data.logoLightUrl || null);
      setLogoDarkUrl(data.logoDarkUrl || null);
      setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      setCurrency(data.currency || 'USD');
      setOriginalData(data);
      setHasChanges(false);
    }
  }, [profileQuery.data]);
  
  // Track changes
  useEffect(() => {
    if (originalData) {
      const changed = 
        schoolName !== (originalData.schoolName || '') ||
        displayName !== (originalData.displayName || '') ||
        tagline !== (originalData.tagline || '') ||
        phone !== (originalData.phone || '') ||
        email !== (originalData.email || '') ||
        website !== (originalData.website || '') ||
        addressStreet !== (originalData.addressStreet || '') ||
        addressCity !== (originalData.addressCity || '') ||
        addressState !== (originalData.addressState || '') ||
        addressPostal !== (originalData.addressPostal || '') ||
        addressCountry !== (originalData.addressCountry || '') ||
        timezone !== (originalData.timezone || '') ||
        currency !== (originalData.currency || '');
      setHasChanges(changed);
    }
  }, [schoolName, displayName, tagline, phone, email, website, addressStreet, addressCity, addressState, addressPostal, addressCountry, timezone, currency, originalData]);
  
  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (website && !/^https?:\/\/.+/.test(website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Save handler
  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }
    
    setSaving(true);
    try {
      await upsertMutation.mutateAsync({
        schoolName,
        displayName: displayName || null,
        tagline: tagline || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        addressStreet: addressStreet || null,
        addressCity: addressCity || null,
        addressState: addressState || null,
        addressPostal: addressPostal || null,
        addressCountry: addressCountry || null,
        logoLightUrl,
        logoDarkUrl,
        timezone: timezone || null,
        currency: currency || null,
      });
      
      toast.success('School profile saved');
      profileQuery.refetch();
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };
  
  // Cancel handler
  const handleCancel = () => {
    if (originalData) {
      setSchoolName(originalData.schoolName || '');
      setDisplayName(originalData.displayName || '');
      setTagline(originalData.tagline || '');
      setPhone(originalData.phone || '');
      setEmail(originalData.email || '');
      setWebsite(originalData.website || '');
      setAddressStreet(originalData.addressStreet || '');
      setAddressCity(originalData.addressCity || '');
      setAddressState(originalData.addressState || '');
      setAddressPostal(originalData.addressPostal || '');
      setAddressCountry(originalData.addressCountry || '');
      setTimezone(originalData.timezone || '');
      setCurrency(originalData.currency || '');
      setErrors({});
      setHasChanges(false);
    }
  };
  
  // Logo upload handler
  const handleLogoUpload = async (file: File, type: 'light' | 'dark') => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    const setUploading = type === 'light' ? setUploadingLight : setUploadingDark;
    const setUrl = type === 'light' ? setLogoLightUrl : setLogoDarkUrl;
    
    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileData = reader.result as string;
          const result = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileData: fileData,
            fileType: file.type,
            fileSize: file.size,
            context: 'general' as const,
          });
          
          // Update logo URL
          await updateLogoMutation.mutateAsync({
            type,
            url: result.url,
          });
          
          setUrl(result.url);
          toast.success(`${type === 'light' ? 'Light' : 'Dark'} logo uploaded`);
          profileQuery.refetch();
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload logo');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error('Failed to read file');
      setUploading(false);
    }
  };
  
  // Logo remove handler
  const handleLogoRemove = async (type: 'light' | 'dark') => {
    const setUrl = type === 'light' ? setLogoLightUrl : setLogoDarkUrl;
    
    try {
      await updateLogoMutation.mutateAsync({
        type,
        url: null,
      });
      
      setUrl(null);
      toast.success(`${type === 'light' ? 'Light' : 'Dark'} logo removed`);
      profileQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove logo');
    }
  };
  
  // Loading state
  if (profileQuery.isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '60px',
        color: 'rgba(255, 255, 255, 0.5)',
      }}>
        <RefreshCw size={24} className="animate-spin" style={{ marginRight: '12px' }} />
        Loading school profile...
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '32px',
      }}>
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: 'white',
            marginBottom: '4px',
          }}>
            School Profile
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Manage your dojo identity and contact information
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {hasChanges && (
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <X size={16} />
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: hasChanges ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving || !hasChanges ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {/* Two-column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '24px',
      }}>
        {/* Identity Card */}
        <SettingsCard title="Identity" icon={Building2}>
          <InputField
            label="School Name"
            value={schoolName}
            onChange={setSchoolName}
            placeholder="My Martial Arts Academy"
            required
            error={errors.schoolName}
          />
          <InputField
            label="Display Name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Optional short name"
          />
          <TextareaField
            label="Tagline"
            value={tagline}
            onChange={setTagline}
            placeholder="Your school's motto or tagline"
            maxLength={500}
          />
        </SettingsCard>
        
        {/* Contact Card */}
        <SettingsCard title="Contact" icon={Phone}>
          <InputField
            label="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="(555) 123-4567"
            type="tel"
          />
          <InputField
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="info@mydojo.com"
            type="email"
            error={errors.email}
          />
          <InputField
            label="Website"
            value={website}
            onChange={setWebsite}
            placeholder="https://mydojo.com"
            error={errors.website}
          />
        </SettingsCard>
        
        {/* Address Card */}
        <SettingsCard title="Address" icon={MapPin}>
          <InputField
            label="Street Address"
            value={addressStreet}
            onChange={setAddressStreet}
            placeholder="123 Main Street"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <InputField
              label="City"
              value={addressCity}
              onChange={setAddressCity}
              placeholder="City"
            />
            <InputField
              label="State/Region"
              value={addressState}
              onChange={setAddressState}
              placeholder="State"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <InputField
              label="Postal Code"
              value={addressPostal}
              onChange={setAddressPostal}
              placeholder="12345"
            />
            <InputField
              label="Country"
              value={addressCountry}
              onChange={setAddressCountry}
              placeholder="United States"
            />
          </div>
        </SettingsCard>
        
        {/* Branding Card */}
        <SettingsCard 
          title="Branding" 
          subtitle="Upload logos for light and dark themes"
          icon={Image}
        >
          <LogoUpload
            label="Logo (Light Background)"
            currentUrl={logoLightUrl}
            onUpload={(file) => handleLogoUpload(file, 'light')}
            onRemove={() => handleLogoRemove('light')}
            uploading={uploadingLight}
          />
          <LogoUpload
            label="Logo (Dark Background)"
            currentUrl={logoDarkUrl}
            onUpload={(file) => handleLogoUpload(file, 'dark')}
            onRemove={() => handleLogoRemove('dark')}
            uploading={uploadingDark}
          />
        </SettingsCard>
        
        {/* Preferences Card */}
        <SettingsCard title="Preferences" icon={Clock}>
          <SelectField
            label="Timezone"
            value={timezone}
            onChange={setTimezone}
            options={timezonesQuery.data || []}
            required
          />
          <SelectField
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={currencyOptions}
          />
        </SettingsCard>
      </div>
      
      {/* Unsaved changes warning */}
      {hasChanges && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          borderRadius: '12px',
          backgroundColor: 'rgba(245, 158, 11, 0.9)',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          zIndex: 100,
        }}>
          You have unsaved changes
        </div>
      )}
    </div>
  );
}
