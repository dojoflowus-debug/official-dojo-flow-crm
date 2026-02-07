import React, { useState, useEffect } from 'react';
import { SignatureCanvas } from './SignatureCanvas';

interface WaiverFormProps {
  leadId?: number;
  studentId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  phone: string;
  schoolName: string;
  onSubmit: (waiverData: WaiverSubmitData) => Promise<void>;
  isLoading?: boolean;
  onParentSignatureRequired?: (parentEmail: string) => void;
}

export interface WaiverSubmitData {
  participantName: string;
  dateOfBirth?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  medicalConditions?: string;
  signatureData: string;
  signerType: 'student' | 'guardian';
  signerName: string;
  signerEmail: string;
  mediaConsent: boolean;
  agreementAccepted: boolean;
}

const WAIVER_CONTENT = `MARTIAL ARTS SCHOOL WAIVER & RELEASE OF LIABILITY

1. PARTICIPANT INFORMATION
Participant Name: ____________________________
Date of Birth: ____________________________
Parent/Guardian Name (if minor):
Address: ____________________________
Phone: ____________________________
Email: ____________________________

2. ASSUMPTION OF RISK
I understand that martial arts training, fitness classes, and related activities involve physical contact and strenuous activity. These activities carry inherent risks including but not limited to:
- Cuts, bruises, sprains, and fractures
- Head or bodily injury
- Temporary or permanent disability
- Illness or medical complications
- Property damage
- Serious injury or death

I voluntarily choose to participate and fully accept all risks, known and unknown, even if caused by the negligence of the school or its staff.

3. RELEASE & WAIVER OF LIABILITY
I hereby release and discharge the school, its owners, instructors, employees, volunteers, and affiliates from any and all liability, claims, demands, or causes of action arising out of participation in any activities.

This includes, but is not limited to:
- Personal injury
- Property damage or loss
- Negligence
- Premises liability

4. MEDICAL ACKNOWLEDGMENT & CONSENT
I confirm that I (or my child) am physically able to participate.
I agree to inform staff of any medical conditions.
In the event of injury or emergency, I authorize the school to obtain medical treatment if necessary. I accept responsibility for all related costs.

Known medical conditions/allergies: ____________________________

5. RULES & CONDUCT
I agree to:
- Follow all instructions from staff
- Use equipment safely
- Treat others with respect
- Maintain appropriate behavior

The school reserves the right to suspend or dismiss any participant for unsafe or disruptive conduct.

6. MEDIA RELEASE
I grant permission for photographs or videos of me (or my child) to be used for:
- Promotional materials
- Social media
- Website content
- Advertising

7. MEMBERSHIP & PAYMENT TERMS
If I enroll:
- I agree to the school's tuition and billing policies
- I understand fees are non-refundable unless stated in writing
- I authorize recurring payments if applicable
- I agree to provide required notice for cancellations

8. ACKNOWLEDGMENT OF UNDERSTANDING
I have read this waiver and fully understand its terms.
I sign it voluntarily.`;

export function WaiverForm({
  leadId,
  studentId,
  firstName,
  lastName,
  dateOfBirth,
  email,
  phone,
  schoolName,
  onSubmit,
  isLoading = false,
  onParentSignatureRequired,
}: WaiverFormProps) {
  const [signatureData, setSignatureData] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [mediaConsent, setMediaConsent] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [error, setError] = useState('');
  const [showParentSection, setShowParentSection] = useState(false);

  // Calculate age from date of birth
  useEffect(() => {
    if (!dateOfBirth) return;

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      setIsMinor(age - 1 < 18);
    } else {
      setIsMinor(age < 18);
    }
  }, [dateOfBirth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!signatureData) {
      setError('Please sign the waiver');
      return;
    }

    if (!agreementAccepted) {
      setError('Please accept the waiver terms');
      return;
    }

    if (isMinor && !parentName) {
      setError('Parent/Guardian name is required for minors');
      return;
    }

    if (isMinor && !parentEmail) {
      setError('Parent/Guardian email is required for minors');
      return;
    }

    try {
      const waiverData: WaiverSubmitData = {
        participantName: `${firstName} ${lastName}`,
        dateOfBirth,
        parentName: isMinor ? parentName : undefined,
        parentEmail: isMinor ? parentEmail : undefined,
        parentPhone: isMinor ? parentPhone : undefined,
        medicalConditions: medicalConditions || undefined,
        signatureData,
        signerType: isMinor ? 'guardian' : 'student',
        signerName: isMinor ? parentName : `${firstName} ${lastName}`,
        signerEmail: isMinor ? parentEmail : email,
        mediaConsent,
        agreementAccepted,
      };

      await onSubmit(waiverData);

      // If minor, notify parent signature is required
      if (isMinor && onParentSignatureRequired) {
        onParentSignatureRequired(parentEmail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit waiver');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-2">Waiver & Release of Liability</h1>
      <p className="text-gray-600 mb-6">School: {schoolName}</p>

      {/* Waiver Content */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6 max-h-96 overflow-y-auto border border-gray-200">
        <pre className="whitespace-pre-wrap text-sm font-sans text-gray-700">
          {WAIVER_CONTENT}
        </pre>
      </div>

      {/* Participant Information */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Participant Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={`${firstName} ${lastName}`}
              disabled
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="text"
              value={dateOfBirth || 'Not provided'}
              disabled
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={phone}
              disabled
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Known Medical Conditions/Allergies
          </label>
          <textarea
            value={medicalConditions}
            onChange={(e) => setMedicalConditions(e.target.value)}
            placeholder="List any medical conditions or allergies..."
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>

      {/* Parent/Guardian Section (for minors) */}
      {isMinor && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900">Parent/Guardian Information</h2>
          <p className="text-sm text-yellow-800 mb-4">
            As a minor, a parent or legal guardian must also sign this waiver.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Parent/Guardian Name *</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Full name"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="Email"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="Phone"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-yellow-700 mt-4">
            A parent/guardian signature link will be sent to the email above.
          </p>
        </div>
      )}

      {/* Signature Section */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Your Signature</h2>
        <p className="text-sm text-gray-600 mb-4">
          Please sign below to acknowledge that you have read and agree to all terms.
        </p>
        <SignatureCanvas
          onSignatureChange={setSignatureData}
          width={500}
          height={150}
          disabled={isLoading}
        />
      </div>

      {/* Checkboxes */}
      <div className="mb-6 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mediaConsent}
            onChange={(e) => setMediaConsent(e.target.checked)}
            disabled={isLoading}
            className="mt-1"
          />
          <span className="text-sm text-gray-700">
            I grant permission for photographs or videos to be used for promotional materials, social media, website content, and advertising.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreementAccepted}
            onChange={(e) => setAgreementAccepted(e.target.checked)}
            disabled={isLoading}
            className="mt-1"
          />
          <span className="text-sm text-gray-700 font-semibold">
            I have read this waiver and fully understand its terms. I sign it voluntarily. *
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isLoading ? 'Submitting...' : isMinor ? 'Continue (Parent Signature Required)' : 'Sign & Continue'}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        By clicking the button above, you acknowledge that you have read and agree to all terms in this waiver.
      </p>
    </form>
  );
}
