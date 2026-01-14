import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertCircle, Package } from "lucide-react";
import { APP_LOGO } from "@/const";

export default function ConfirmReceipt() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"idle" | "confirming" | "disputing" | "success" | "error">("idle");
  const [disputeReason, setDisputeReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Mutations
  const confirmReceipt = trpc.merchandise.confirmReceipt.useMutation({
    onSuccess: () => {
      setStatus("success");
    },
    onError: (error) => {
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  const markDisputed = trpc.merchandise.markDisputed.useMutation({
    onSuccess: () => {
      setStatus("success");
    },
    onError: (error) => {
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  const handleConfirm = () => {
    if (!token) return;
    setStatus("confirming");
    confirmReceipt.mutate({ token });
  };

  const handleDispute = () => {
    if (!token) return;
    if (!disputeReason.trim()) {
      setErrorMessage("Please provide a reason for the dispute");
      return;
    }
    setStatus("disputing");
    markDisputed.mutate({ token, reason: disputeReason });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
            <CardDescription>This confirmation link is invalid or incomplete.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              {confirmReceipt.isSuccess ? "Receipt Confirmed!" : "Issue Reported"}
            </CardTitle>
            <CardDescription>
              {confirmReceipt.isSuccess
                ? "Thank you for confirming receipt of your merchandise."
                : "Thank you for reporting the issue. Our staff will follow up with you shortly."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">You can close this window now.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Error</CardTitle>
            <CardDescription>{errorMessage || "An error occurred. Please try again or contact us."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt="Dojo Logo" className="w-20 h-20 object-contain" />
          </div>
          <CardTitle className="text-2xl">Confirm Merchandise Receipt</CardTitle>
          <CardDescription>
            Please confirm that you have received your merchandise item.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-medium text-sm">Merchandise Item</p>
              <p className="text-xs text-muted-foreground">Please confirm receipt or report an issue below</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={handleConfirm}
              disabled={status === "confirming"}
            >
              {status === "confirming" ? (
                "Confirming..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Yes, I Received This Item
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-3">
              <Textarea
                placeholder="Please describe the issue (e.g., 'I did not receive this item' or 'Wrong size was given')"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                size="lg"
                onClick={handleDispute}
                disabled={status === "disputing" || !disputeReason.trim()}
              >
                {status === "disputing" ? (
                  "Reporting..."
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Report an Issue
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>If you have questions, please contact us directly.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
