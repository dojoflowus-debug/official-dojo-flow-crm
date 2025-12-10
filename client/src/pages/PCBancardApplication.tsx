import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface DocumentUpload {
  type: "drivers_license" | "voided_check" | "state_ein" | "address_verification" | "bank_letter";
  label: string;
  description: string;
  file: File | null;
  uploaded: boolean;
}

export default function PCBancardApplication() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [dbaName, setDbaName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerCell, setOwnerCell] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerCell, setManagerCell] = useState("");
  const [hoursOfOperation, setHoursOfOperation] = useState("");
  const [daysOfOperation, setDaysOfOperation] = useState("");
  const [estimatedMonthlyVolume, setEstimatedMonthlyVolume] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Document uploads
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      type: "drivers_license",
      label: "Driver's License",
      description: "Copy of business owner's driver's license",
      file: null,
      uploaded: false,
    },
    {
      type: "voided_check",
      label: "Voided Check",
      description: "Must match bank account on application",
      file: null,
      uploaded: false,
    },
    {
      type: "state_ein",
      label: "State EIN #",
      description: "Copy of state Employer Identification Number",
      file: null,
      uploaded: false,
    },
    {
      type: "address_verification",
      label: "Business Address Verification",
      description: "Document proving business address matches application",
      file: null,
      uploaded: false,
    },
    {
      type: "bank_letter",
      label: "Bank Letter",
      description: "Letter stating account in good standing with account # and routing #",
      file: null,
      uploaded: false,
    },
  ]);

  const createApplication = trpc.billing.createPCBancardApplication.useMutation();
  const uploadDocument = trpc.billing.uploadDocument.useMutation();

  const handleFileSelect = (index: number, file: File | null) => {
    const newDocuments = [...documents];
    newDocuments[index].file = file;
    setDocuments(newDocuments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all documents are uploaded
    const missingDocs = documents.filter(doc => !doc.file);
    if (missingDocs.length > 0) {
      toast.error(`Please upload all required documents: ${missingDocs.map(d => d.label).join(", ")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create application
      const application = await createApplication.mutateAsync({
        provider: "pcbancard",
        businessName,
        dbaName,
        businessAddress,
        businessPhone,
        ownerName,
        ownerCell,
        managerName,
        managerCell,
        hoursOfOperation,
        daysOfOperation,
        estimatedMonthlyVolume: estimatedMonthlyVolume ? parseInt(estimatedMonthlyVolume) : undefined,
        specialInstructions,
      });

      // Upload all documents
      for (const doc of documents) {
        if (doc.file) {
          const formData = new FormData();
          formData.append("file", doc.file);
          formData.append("applicationId", application.id.toString());
          formData.append("documentType", doc.type);

          await uploadDocument.mutateAsync({
            applicationId: application.id,
            documentType: doc.type,
            file: doc.file,
          });
        }
      }

      toast.success("Application submitted successfully! Processing time: 2-3 business days");
      navigate("/billing/applications");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <img src="/logos/pcbancard.jpg" alt="PC Bancard" className="h-12" />
          <div>
            <h1 className="text-3xl font-bold">PC Bancard Application</h1>
            <p className="text-muted-foreground">Complete the form below to apply for merchant services</p>
          </div>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Processing Time:</strong> 2-3 business days after submission. All documents must be uploaded before submitting.
          </AlertDescription>
        </Alert>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>PC Bancard Representative</CardTitle>
            <CardDescription>Your dedicated account representative</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Representative Name</Label>
                <Input value="Randy Sinclair" disabled />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value="682-218-1669" disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Enter your business details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dbaName">DBA Name</Label>
                <Input
                  id="dbaName"
                  value={dbaName}
                  onChange={(e) => setDbaName(e.target.value)}
                  placeholder="Doing Business As"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Input
                id="businessAddress"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Full business address"
                required
              />
            </div>

            <div>
              <Label htmlFor="businessPhone">Business Phone *</Label>
              <Input
                id="businessPhone"
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Owner and manager contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ownerCell">Owner Cell Phone *</Label>
                <Input
                  id="ownerCell"
                  type="tel"
                  value={ownerCell}
                  onChange={(e) => setOwnerCell(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="managerName">Manager Name</Label>
                <Input
                  id="managerName"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="managerCell">Manager Cell Phone</Label>
                <Input
                  id="managerCell"
                  type="tel"
                  value={managerCell}
                  onChange={(e) => setManagerCell(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Details */}
        <Card>
          <CardHeader>
            <CardTitle>Operational Details</CardTitle>
            <CardDescription>Business hours and transaction volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hoursOfOperation">Hours of Operation *</Label>
                <Input
                  id="hoursOfOperation"
                  value={hoursOfOperation}
                  onChange={(e) => setHoursOfOperation(e.target.value)}
                  placeholder="e.g., 9 AM - 6 PM"
                  required
                />
              </div>
              <div>
                <Label htmlFor="daysOfOperation">Days of Operation *</Label>
                <Input
                  id="daysOfOperation"
                  value={daysOfOperation}
                  onChange={(e) => setDaysOfOperation(e.target.value)}
                  placeholder="e.g., Monday - Friday"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimatedMonthlyVolume">Estimated Monthly Volume ($) *</Label>
              <Input
                id="estimatedMonthlyVolume"
                type="number"
                value={estimatedMonthlyVolume}
                onChange={(e) => setEstimatedMonthlyVolume(e.target.value)}
                placeholder="Estimated monthly transaction volume"
                required
              />
            </div>

            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special notes or requirements"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              Upload all required documents. All documents must match the information provided in this application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.map((doc, index) => (
              <div key={doc.type} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-base font-semibold">{doc.label} *</Label>
                      {doc.file && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {doc.file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {doc.file.name} ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/billing")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
