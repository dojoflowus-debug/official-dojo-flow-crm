import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  DollarSign,
  Calendar,
  Shield,
  AlertCircle,
} from "lucide-react";

interface EnrollStudentModalProps {
  open: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  onSuccess?: () => void;
}

type Step = "plan" | "card" | "confirm" | "done";

const frequencyLabel: Record<string, string> = {
  monthly: "/ month",
  weekly: "/ week",
  biweekly: "/ 2 weeks",
  quarterly: "/ quarter",
  annual: "/ year",
  one_time: "one-time",
};

// Declare global Tokenizer from FluidPay CDN
declare global {
  interface Window {
    Tokenizer: any;
  }
}

export default function EnrollStudentModal({
  open,
  onClose,
  studentId,
  studentName,
  onSuccess,
}: EnrollStudentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [cardLast4, setCardLast4] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const [tokenizerError, setTokenizerError] = useState<string | null>(null);
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
  const tokenizerInstanceRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("plan");
      setSelectedPlanId(null);
      setEnrollmentId(null);
      setCardToken(null);
      setCardLast4(null);
      setCardBrand(null);
      setTokenizerReady(false);
      setTokenizerError(null);
      setIsSubmittingCard(false);
      tokenizerInstanceRef.current = null;
    }
  }, [open]);

  // Fetch tuition plans
  const { data: plans, isLoading: plansLoading } = trpc.tuitionBilling.listTuitionPlans.useQuery(
    undefined,
    { enabled: open }
  );

  // Fetch tokenizer public key when on card step
  const { data: tokenizerData, isLoading: tokenizerKeyLoading } = trpc.tuitionBilling.getTokenizerKey.useQuery(
    undefined,
    { enabled: open && step === "card" }
  );

  // Enroll student mutation
  const enrollMutation = trpc.tuitionBilling.enrollStudentInPlan.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setEnrollmentId(data.enrollmentId || null);
        setStep("card");
      } else {
        toast({ title: "Enrollment Error", description: data.error || "Failed to enroll", variant: "destructive" });
      }
    },
    onError: (err) => {
      toast({ title: "Enrollment Failed", description: err.message, variant: "destructive" });
    },
  });

  // Save card mutation
  const saveCardMutation = trpc.tuitionBilling.saveStudentCard.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setStep("done");
        toast({ title: "Card Saved!", description: "Student enrolled and card saved successfully." });
        onSuccess?.();
      } else {
        toast({ title: "Card Save Error", description: data.error || "Failed to save card", variant: "destructive" });
      }
    },
    onError: (err) => {
      toast({ title: "Card Save Failed", description: err.message, variant: "destructive" });
    },
  });

  // Store toast in a ref to avoid stale closure issues
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // Custom window message listener to handle FluidPay's double-serialized postMessage
  // Only depends on [step] to avoid rapid re-registration due to toast reference changes
  useEffect(() => {
    if (step !== "card") return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes("fluidpay.com")) return;
      try {
        // FluidPay sends JSON: parse once or twice depending on serialization
        let parsed: any = event.data;
        if (typeof parsed === "string") parsed = JSON.parse(parsed);
        if (typeof parsed === "string") parsed = JSON.parse(parsed);

        if (parsed?.event !== "submission") return;
        const resp = parsed.data;

        setIsSubmittingCard(false);
        if (resp?.status === "success") {
          const token = resp.token;
          const last4 = resp.card?.last_four || resp.last_four || null;
          const brand = resp.card?.card_type || resp.card_type || null;
          setCardToken(token);
          setCardLast4(last4);
          setCardBrand(brand);
          setStep("confirm");
        } else if (resp?.status === "validation") {
          toastRef.current({
            title: "Invalid Card",
            description: "Please check your card details and try again.",
            variant: "destructive",
          });
        } else {
          toastRef.current({
            title: "Card Error",
            description: resp?.msg || "Failed to process card. Please try again.",
            variant: "destructive",
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Initialize FluidPay Tokenizer.js when public key is available and we're on the card step
  useEffect(() => {
    if (step !== "card" || !tokenizerData?.tokenizerKey || tokenizerKeyLoading) return;
    if (tokenizerData.error) {
      setTokenizerError(tokenizerData.error);
      return;
    }

    const publicKey = tokenizerData.tokenizerKey;

    const initTokenizer = () => {
      if (!containerRef.current) return;
      // Clear any previous tokenizer content
      containerRef.current.innerHTML = "";
      setTokenizerReady(false);
      setTokenizerError(null);

      try {
        const t = new window.Tokenizer({
          apikey: publicKey,
          container: "#fp-tokenizer-container",
          submission: (resp: any) => {
            setIsSubmittingCard(false);
            if (resp.status === "success") {
              const token = resp.token;
              // Extract card info from response
              const last4 = resp.card?.last_four || resp.last_four || null;
              const brand = resp.card?.card_type || resp.card_type || null;
              setCardToken(token);
              setCardLast4(last4);
              setCardBrand(brand);
              setStep("confirm");
            } else if (resp.status === "validation") {
              toast({
                title: "Invalid Card",
                description: "Please check your card details and try again.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Card Error",
                description: resp.msg || "Failed to process card. Please try again.",
                variant: "destructive",
              });
            }
          },
          onLoad: () => {
            setTokenizerReady(true);
          },
          settings: {
            payment: {
              types: ["card"],
              card: {
                requireCVV: true,
                mask_number: true,
              },
            },
            styles: {
              body: {
                "font-family": "system-ui, -apple-system, sans-serif",
                "background": "transparent",
                "color": "#ffffff",
                "padding": "0",
                "margin": "0",
              },
              input: {
                "background": "rgba(255,255,255,0.08)",
                "border": "1px solid rgba(255,255,255,0.15)",
                "border-radius": "8px",
                "color": "#ffffff",
                "padding": "10px 12px",
                "font-size": "14px",
                "width": "100%",
                "box-sizing": "border-box",
              },
              "input:focus": {
                "border-color": "#3b82f6",
                "outline": "none",
                "box-shadow": "0 0 0 2px rgba(59,130,246,0.3)",
              },
              label: {
                "color": "rgba(255,255,255,0.6)",
                "font-size": "12px",
                "margin-bottom": "4px",
              },
              // Hide the default submit button — we use our own
              ".submit-btn": {
                "display": "none",
              },
              button: {
                "display": "none",
              },
            },
          },
        });
        tokenizerInstanceRef.current = t;
        (window as any).__fpTokenizerInstance = t;
      } catch (err: any) {
        setTokenizerError(err.message || "Failed to initialize card form");
      }
    };

    // Load tokenizer.js from FluidPay CDN if not already loaded
    const scriptId = "fluidpay-tokenizer-script";
    const existingScript = document.getElementById(scriptId);

    if (existingScript && window.Tokenizer) {
      // Already loaded — initialize directly
      // Small delay to ensure the container div is rendered
      setTimeout(initTokenizer, 100);
    } else if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
      script.async = true;
      script.onload = () => {
        setTimeout(initTokenizer, 100);
      };
      script.onerror = () => {
        setTokenizerError("Failed to load FluidPay card form. Check your internet connection.");
      };
      document.head.appendChild(script);
    } else {
      // Script tag exists but Tokenizer not yet available — wait
      const poll = setInterval(() => {
        if (window.Tokenizer) {
          clearInterval(poll);
          setTimeout(initTokenizer, 100);
        }
      }, 100);
      return () => clearInterval(poll);
    }
  }, [step, tokenizerData, tokenizerKeyLoading]);

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId);

  const handlePlanSelect = (planId: number) => {
    setSelectedPlanId(planId);
  };

  const handlePlanNext = () => {
    if (!selectedPlanId) return;
    enrollMutation.mutate({ studentId, planId: selectedPlanId });
  };

  const handleSubmitCard = () => {
    const instance = tokenizerInstanceRef.current || (window as any).__fpTokenizerInstance;
    if (!instance) {
      toast({ title: "Card form not ready", description: "Please wait for the card form to load.", variant: "destructive" });
      return;
    }
    setIsSubmittingCard(true);
    instance.submit();
  };

  const handleSaveCard = () => {
    if (!cardToken) return;
    saveCardMutation.mutate({
      studentId,
      enrollmentId: enrollmentId || undefined,
      cardToken,
    });
  };

  const handleSkipCard = () => {
    setStep("done");
    toast({
      title: "Enrolled (no card)",
      description: "Student enrolled. Add a card later to enable auto-billing.",
    });
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg bg-gray-950 border border-white/10 text-white p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">Enroll Student</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm mt-0.5">
                {studentName}
              </DialogDescription>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {(["plan", "card", "confirm", "done"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? "bg-blue-500 text-white" :
                  (["plan", "card", "confirm", "done"].indexOf(step) > i) ? "bg-green-500 text-white" :
                  "bg-white/10 text-gray-500"
                }`}>
                  {(["plan", "card", "confirm", "done"].indexOf(step) > i) ? "✓" : i + 1}
                </div>
                <span className={`text-xs capitalize ${step === s ? "text-white" : "text-gray-500"}`}>
                  {s === "plan" ? "Plan" : s === "card" ? "Card" : s === "confirm" ? "Confirm" : "Done"}
                </span>
                {i < 3 && <ChevronRight className="w-3 h-3 text-gray-600" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Step: Plan Selection */}
        {step === "plan" && (
          <div className="px-6 py-5">
            <p className="text-sm text-gray-400 mb-4">Select a tuition plan for this student.</p>
            {plansLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : !plans?.length ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tuition plans found.</p>
                <p className="text-xs mt-1">Go to Payments → Tuition Plans to create one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedPlanId === plan.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white text-sm">{plan.name}</p>
                        {plan.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          ${plan.amountDollars.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {frequencyLabel[plan.frequency] || plan.frequency}
                        </p>
                      </div>
                    </div>
                    {selectedPlanId === plan.id && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs text-blue-400">Selected</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={onClose} className="flex-1 border-white/20 text-gray-300 hover:bg-white/10">
                Cancel
              </Button>
              <Button
                onClick={handlePlanNext}
                disabled={!selectedPlanId || enrollMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {enrollMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enrolling...</>
                ) : (
                  <>Next: Add Card <ChevronRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Card Capture */}
        {step === "card" && (
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-medium text-white">Add Payment Card</p>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs ml-auto">
                <Shield className="w-3 h-3 mr-1" />Secure
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Card data is encrypted and stored securely in FluidPay's vault. We never see your full card number.
            </p>

            {/* Plan summary */}
            {selectedPlan && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Enrolling in</p>
                  <p className="text-sm font-medium text-white">{selectedPlan.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-white">${selectedPlan.amountDollars.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{frequencyLabel[selectedPlan.frequency]}</p>
                </div>
              </div>
            )}

            {/* FluidPay Tokenizer.js container */}
            {tokenizerKeyLoading ? (
              <div className="flex items-center justify-center py-12 bg-white/5 rounded-xl border border-white/10">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Loading secure card form...</p>
                </div>
              </div>
            ) : tokenizerError ? (
              <div className="py-6 px-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">Card form unavailable</p>
                  <p className="text-xs text-gray-500 mt-1">{tokenizerError}</p>
                  <p className="text-xs text-gray-500 mt-1">Check FluidPay connection in Settings.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 overflow-hidden bg-gray-900 p-4">
                {/* Loading overlay until tokenizer is ready */}
                {!tokenizerReady && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Initializing secure form...</p>
                    </div>
                  </div>
                )}
                {/* FluidPay injects the iframe here */}
                <div
                  id="fp-tokenizer-container"
                  ref={containerRef}
                  style={{ minHeight: tokenizerReady ? "auto" : "0px" }}
                />
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setStep("plan")}
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />Back
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipCard}
                className="border-white/20 text-gray-400 hover:bg-white/10 text-sm"
              >
                Skip (add card later)
              </Button>
              <Button
                onClick={handleSubmitCard}
                disabled={!tokenizerReady || isSubmittingCard || !!tokenizerError}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmittingCard ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
                ) : (
                  <><CreditCard className="w-4 h-4 mr-2" />Save Card</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="px-6 py-5">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-white font-semibold">Card Captured</p>
              <p className="text-gray-400 text-sm mt-1">
                {cardBrand && <span className="capitalize">{cardBrand} </span>}
                {cardLast4 ? `ending in ${cardLast4}` : "Card ready to save"}
              </p>
            </div>

            {selectedPlan && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Student</span>
                  <span className="text-white font-medium">{studentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-bold">${selectedPlan.amountDollars.toFixed(2)} {frequencyLabel[selectedPlan.frequency]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Card</span>
                  <span className="text-white">
                    {cardBrand ? <span className="capitalize">{cardBrand} </span> : ""}
                    {cardLast4 ? `•••• ${cardLast4}` : "Captured"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">First charge</span>
                  <span className="text-white">
                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                    Next billing date
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("card")}
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />Back
              </Button>
              <Button
                onClick={handleSaveCard}
                disabled={saveCardMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {saveCardMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
                ) : (
                  <>Confirm Enrollment</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-xl font-bold text-white mb-2">Enrollment Complete!</p>
            <p className="text-gray-400 text-sm mb-2">
              <span className="text-white font-medium">{studentName}</span> is now enrolled
              {selectedPlan && (
                <> in <span className="text-white font-medium">{selectedPlan.name}</span></>
              )}.
            </p>
            {cardLast4 && (
              <p className="text-gray-500 text-xs mb-6">
                Card {cardBrand ? `${cardBrand} ` : ""}•••• {cardLast4} saved to vault.
              </p>
            )}
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
