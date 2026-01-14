import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileDropzone from './FileDropzone';
import ColumnMappingDialog from './ColumnMappingDialog';

// Step 1: Basics
export function BasicsStep({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="businessName">Business Name</Label>
        <Input
          id="businessName"
          placeholder="e.g., Elite Karate Academy"
          value={data.businessName || ''}
          onChange={(e) =>
            onChange({ ...data, businessName: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Select
          value={data.timezone || 'America/New_York'}
          onValueChange={(value) =>
            onChange({ ...data, timezone: value })
          }
        >
          <SelectTrigger id="timezone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="America/New_York">Eastern Time</SelectItem>
            <SelectItem value="America/Chicago">Central Time</SelectItem>
            <SelectItem value="America/Denver">Mountain Time</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
            <SelectItem value="America/Anchorage">Alaska Time</SelectItem>
            <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="estimatedStudents">Estimated Students</Label>
        <Input
          id="estimatedStudents"
          type="number"
          placeholder="e.g., 150"
          value={data.estimatedStudents || ''}
          onChange={(e) =>
            onChange({ ...data, estimatedStudents: parseInt(e.target.value) })
          }
        />
      </div>
    </div>
  );
}

// Step 2: Branding
export function BrandingStep({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Logo</Label>
        <FileDropzone
          acceptedTypes={['image/png', 'image/jpeg']}
          onFileSelected={(file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              onChange({ ...data, logoUrl: e.target?.result });
            };
            reader.readAsDataURL(file);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex gap-2">
            <input
              id="primaryColor"
              type="color"
              value={data.primaryColor || '#3b82f6'}
              onChange={(e) =>
                onChange({ ...data, primaryColor: e.target.value })
              }
              className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
            />
            <Input
              type="text"
              value={data.primaryColor || '#3b82f6'}
              onChange={(e) =>
                onChange({ ...data, primaryColor: e.target.value })
              }
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <div className="flex gap-2">
            <input
              id="secondaryColor"
              type="color"
              value={data.secondaryColor || '#8b5cf6'}
              onChange={(e) =>
                onChange({ ...data, secondaryColor: e.target.value })
              }
              className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
            />
            <Input
              type="text"
              value={data.secondaryColor || '#8b5cf6'}
              onChange={(e) =>
                onChange({ ...data, secondaryColor: e.target.value })
              }
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Programs
export function ProgramsStep({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You can add programs manually or upload a spreadsheet with multiple
          programs.
        </AlertDescription>
      </Alert>

      {!showUpload ? (
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowUpload(true)}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Programs Spreadsheet
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or add manually</span>
            </div>
          </div>

          <div>
            <Label htmlFor="programName">Program Name</Label>
            <Input
              id="programName"
              placeholder="e.g., Karate Fundamentals"
              value={data.manualProgram?.name || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  manualProgram: {
                    ...data.manualProgram,
                    name: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="programType">Program Type</Label>
            <Select
              value={data.manualProgram?.type || ''}
              onValueChange={(value) =>
                onChange({
                  ...data,
                  manualProgram: { ...data.manualProgram, type: value },
                })
              }
            >
              <SelectTrigger id="programType">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="membership">Membership</SelectItem>
                <SelectItem value="class_pack">Class Pack</SelectItem>
                <SelectItem value="drop_in">Drop-In</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div>
          <Button
            variant="outline"
            onClick={() => setShowUpload(false)}
            className="mb-4"
          >
            Back to Manual Entry
          </Button>
          <FileDropzone
            acceptedTypes={[
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-excel',
              'text/csv',
            ]}
            onFileSelected={(file) => {
              onChange({ ...data, programsFile: file });
            }}
          />
        </div>
      )}
    </div>
  );
}

// Step 4: Schedule
export function ScheduleStep({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Upload a spreadsheet with your class schedule. Columns should include:
          Class Name, Program, Day, Time, Instructor, Capacity
        </AlertDescription>
      </Alert>

      <FileDropzone
        acceptedTypes={[
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ]}
        onFileSelected={(file) => {
          onChange({ ...data, scheduleFile: file });
        }}
      />
    </div>
  );
}

// Step 5: Pricing
export function PricingStep({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Set up your pricing plans. You can add them manually or upload a
          spreadsheet.
        </AlertDescription>
      </Alert>

      <FileDropzone
        acceptedTypes={[
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ]}
        onFileSelected={(file) => {
          onChange({ ...data, pricingFile: file });
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="planName">Plan Name</Label>
          <Input
            id="planName"
            placeholder="e.g., Monthly Unlimited"
            value={data.manualPlan?.name || ''}
            onChange={(e) =>
              onChange({
                ...data,
                manualPlan: { ...data.manualPlan, name: e.target.value },
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="planPrice">Price ($)</Label>
          <Input
            id="planPrice"
            type="number"
            placeholder="99.99"
            value={data.manualPlan?.price || ''}
            onChange={(e) =>
              onChange({
                ...data,
                manualPlan: {
                  ...data.manualPlan,
                  price: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

// Step 6: Staff
export function StaffStep({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Add your instructors and staff members. You can upload a spreadsheet
          or add them manually.
        </AlertDescription>
      </Alert>

      <FileDropzone
        acceptedTypes={[
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ]}
        onFileSelected={(file) => {
          onChange({ ...data, staffFile: file });
        }}
      />
    </div>
  );
}

// Step 7: Locations
export function LocationsStep({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Add your dojo location(s). Include address, city, state, and zip code.
        </AlertDescription>
      </Alert>

      <FileDropzone
        acceptedTypes={[
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ]}
        onFileSelected={(file) => {
          onChange({ ...data, locationsFile: file });
        }}
      />

      <div className="space-y-4">
        <div>
          <Label htmlFor="locationName">Location Name</Label>
          <Input
            id="locationName"
            placeholder="e.g., Main Studio"
            value={data.manualLocation?.name || ''}
            onChange={(e) =>
              onChange({
                ...data,
                manualLocation: {
                  ...data.manualLocation,
                  name: e.target.value,
                },
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Street address"
            value={data.manualLocation?.address || ''}
            onChange={(e) =>
              onChange({
                ...data,
                manualLocation: {
                  ...data.manualLocation,
                  address: e.target.value,
                },
              })
            }
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="City"
              value={data.manualLocation?.city || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  manualLocation: {
                    ...data.manualLocation,
                    city: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="State"
              value={data.manualLocation?.state || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  manualLocation: {
                    ...data.manualLocation,
                    state: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input
              id="zipCode"
              placeholder="Zip"
              value={data.manualLocation?.zipCode || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  manualLocation: {
                    ...data.manualLocation,
                    zipCode: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 8: Review
export function ReviewStep({
  data,
}: {
  data: any;
}) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Review your setup before publishing. You can edit any section by
          clicking the back button.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2">Business Info</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Name:</dt>
              <dd className="font-medium">{data.businessName || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Timezone:</dt>
              <dd className="font-medium">{data.timezone || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Est. Students:</dt>
              <dd className="font-medium">{data.estimatedStudents || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2">Branding</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Primary Color:</dt>
              <dd className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-slate-300"
                  style={{ backgroundColor: data.primaryColor }}
                />
                <span className="font-medium">{data.primaryColor}</span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Secondary Color:</dt>
              <dd className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-slate-300"
                  style={{ backgroundColor: data.secondaryColor }}
                />
                <span className="font-medium">{data.secondaryColor}</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            ✓ All required information has been provided. You're ready to
            publish!
          </p>
        </div>
      </div>
    </div>
  );
}
