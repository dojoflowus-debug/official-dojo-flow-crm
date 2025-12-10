import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, Calendar, Users } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CampaignCreate() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  
  // Campaign data
  const [name, setName] = useState("");
  const [type, setType] = useState<"sms" | "email">("sms");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState<"leads" | "students" | "both">("leads");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendNow, setSendNow] = useState(true);
  
  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Campaign created with ${data.recipientCount} recipients!`);
      setLocation("/campaigns");
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const leadStatuses = [
    "New Lead",
    "Attempting Contact",
    "Contact Made",
    "Intro Scheduled",
    "Offer Presented",
    "Enrolled",
    "Nurture",
    "Lost/Winback"
  ];

  const studentStatuses = ["Active", "Inactive", "On Hold"];

  const availableStatuses = audienceType === "students" ? studentStatuses : leadStatuses;

  const handleToggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleCreate = () => {
    if (!name || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      name,
      type,
      subject: type === "email" ? subject : undefined,
      message,
      audienceFilter: {
        type: audienceType,
        statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      },
      scheduledAt: !sendNow && scheduledAt ? scheduledAt : undefined,
    });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-white">Campaign Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Welcome New Leads"
          className="bg-zinc-800 border-zinc-700 text-white mt-2"
        />
      </div>

      <div>
        <Label className="text-white mb-3 block">Campaign Type *</Label>
        <RadioGroup value={type} onValueChange={(v) => setType(v as "sms" | "email")}>
          <div className="flex items-center space-x-2 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            <RadioGroupItem value="sms" id="sms" />
            <Label htmlFor="sms" className="text-white flex-1 cursor-pointer">
              <div className="font-semibold">SMS Message</div>
              <div className="text-sm text-gray-400">Send text messages to phone numbers</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            <RadioGroupItem value="email" id="email" />
            <Label htmlFor="email" className="text-white flex-1 cursor-pointer">
              <div className="font-semibold">Email</div>
              <div className="text-sm text-gray-400">Send emails to email addresses</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => setStep(2)}
          disabled={!name || !type}
          className="bg-red-600 hover:bg-red-700"
        >
          Next: Select Audience
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-white mb-3 block">Target Audience *</Label>
        <RadioGroup value={audienceType} onValueChange={(v) => {
          setAudienceType(v as any);
          setSelectedStatuses([]);
        }}>
          <div className="flex items-center space-x-2 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            <RadioGroupItem value="leads" id="leads" />
            <Label htmlFor="leads" className="text-white flex-1 cursor-pointer">
              <div className="font-semibold">Leads</div>
              <div className="text-sm text-gray-400">Send to potential students in your pipeline</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            <RadioGroupItem value="students" id="students" />
            <Label htmlFor="students" className="text-white flex-1 cursor-pointer">
              <div className="font-semibold">Students</div>
              <div className="text-sm text-gray-400">Send to current students</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            <RadioGroupItem value="both" id="both" />
            <Label htmlFor="both" className="text-white flex-1 cursor-pointer">
              <div className="font-semibold">Both</div>
              <div className="text-sm text-gray-400">Send to both leads and students</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-white mb-3 block">Filter by Status (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {availableStatuses.map((status) => (
            <div
              key={status}
              className="flex items-center space-x-2 bg-zinc-800 p-3 rounded-lg border border-zinc-700"
            >
              <Checkbox
                id={status}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={() => handleToggleStatus(status)}
              />
              <Label htmlFor={status} className="text-white cursor-pointer flex-1">
                {status}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Leave unchecked to send to all {audienceType}
        </p>
      </div>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(1)}
          className="text-gray-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => setStep(3)}
          className="bg-red-600 hover:bg-red-700"
        >
          Next: Write Message
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {type === "email" && (
        <div>
          <Label htmlFor="subject" className="text-white">Email Subject *</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Welcome to our dojo!"
            className="bg-zinc-800 border-zinc-700 text-white mt-2"
          />
        </div>
      )}

      <div>
        <Label htmlFor="message" className="text-white">Message *</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={type === "sms" 
            ? "Hi {{firstName}}, welcome to our dojo! We're excited to have you. Reply with any questions!"
            : "Write your email message here. You can use {{firstName}}, {{lastName}}, etc. as placeholders."
          }
          className="bg-zinc-800 border-zinc-700 text-white mt-2 min-h-[200px]"
        />
        <p className="text-sm text-gray-400 mt-2">
          Use placeholders like {"{"}{"{"} firstName {"}"}{"}"}  and {"{"}{"{"} lastName {"}"}{"}"}  to personalize messages
        </p>
        {type === "sms" && (
          <p className="text-sm text-gray-400 mt-1">
            Character count: {message.length} / 160 (1 SMS)
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(2)}
          className="text-gray-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => setStep(4)}
          disabled={!message || (type === "email" && !subject)}
          className="bg-red-600 hover:bg-red-700"
        >
          Next: Schedule
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-white mb-3 block">When to Send</Label>
        <RadioGroup value={sendNow ? "now" : "later"} onValueChange={(v) => setSendNow(v === "now")}>
          <div className="flex items-center space-x-2 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            <RadioGroupItem value="now" id="now" />
            <Label htmlFor="now" className="text-white flex-1 cursor-pointer">
              <div className="font-semibold">Send Now</div>
              <div className="text-sm text-gray-400">Campaign will be sent immediately</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
            <RadioGroupItem value="later" id="later" />
            <Label htmlFor="later" className="text-white flex-1 cursor-pointer">
              <div className="font-semibold">Schedule for Later</div>
              <div className="text-sm text-gray-400">Choose a specific date and time</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {!sendNow && (
        <div>
          <Label htmlFor="scheduledAt" className="text-white">Schedule Date & Time</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white mt-2"
          />
        </div>
      )}

      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Campaign Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Name:</span>
            <span className="text-white">{name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white uppercase">{type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Audience:</span>
            <span className="text-white capitalize">{audienceType}</span>
          </div>
          {selectedStatuses.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Statuses:</span>
              <span className="text-white">{selectedStatuses.length} selected</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(3)}
          className="text-gray-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleCreate}
          disabled={createMutation.isPending || (!sendNow && !scheduledAt)}
          className="bg-red-600 hover:bg-red-700"
        >
          {createMutation.isPending ? (
            "Creating..."
          ) : sendNow ? (
            <>
              <Send className="w-4 h-4 mr-2" />
              Create & Send
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/campaigns")}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
          <h1 className="text-4xl font-bold mb-2">Create Campaign</h1>
          <p className="text-gray-400">Follow the steps to create and send your campaign</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: "Details" },
            { num: 2, label: "Audience" },
            { num: 3, label: "Message" },
            { num: 4, label: "Schedule" },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s.num
                      ? "bg-red-600 text-white"
                      : "bg-zinc-800 text-gray-400"
                  }`}
                >
                  {s.num}
                </div>
                <span className={`text-sm mt-2 ${step >= s.num ? "text-white" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`flex-1 h-1 mx-4 ${step > s.num ? "bg-red-600" : "bg-zinc-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">
              {step === 1 && "Campaign Details"}
              {step === 2 && "Select Audience"}
              {step === 3 && "Write Message"}
              {step === 4 && "Schedule & Review"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === 1 && "Give your campaign a name and choose the type"}
              {step === 2 && "Choose who will receive this campaign"}
              {step === 3 && "Compose your message"}
              {step === 4 && "Review and schedule your campaign"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
