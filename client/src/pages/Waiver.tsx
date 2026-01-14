import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft,
  CheckCircle2,
  FileSignature,
  Trash2
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Waiver() {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [parentName, setParentName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing style
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSignature) {
      alert("Please sign the waiver");
      return;
    }
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-slate-800 bg-slate-900/50 backdrop-blur-sm p-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg">
                <CheckCircle2 className="h-20 w-20 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Waiver Signed!
              </h2>
              <p className="text-xl text-slate-300">
                Your digital waiver has been saved
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => setLocation("/")}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              Done
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Digital Waiver</h1>
            <p className="text-sm text-slate-400">Read and sign the liability waiver</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Waiver Text */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700">
                  <FileSignature className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Liability Waiver & Release</h2>
              </div>

              <ScrollArea className="h-64 rounded-lg bg-slate-800/50 p-4">
                <div className="text-slate-300 space-y-4 text-sm">
                  <p className="font-semibold">ASSUMPTION OF RISK AND WAIVER OF LIABILITY</p>
                  
                  <p>
                    I acknowledge that martial arts training involves physical contact and carries inherent risks including, but not limited to, bruises, sprains, broken bones, and other injuries. I understand these risks and voluntarily choose to participate.
                  </p>

                  <p>
                    I hereby release, waive, discharge, and covenant not to sue the martial arts school, its owners, instructors, employees, and agents from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury that may be sustained by me or my child while participating in activities at this facility.
                  </p>

                  <p>
                    I understand that this waiver is intended to be as broad and inclusive as permitted by law. I agree that if any portion is held invalid, the balance shall continue in full legal force and effect.
                  </p>

                  <p>
                    I grant permission for emergency medical treatment if necessary and agree to be financially responsible for any medical bills incurred.
                  </p>

                  <p>
                    I give permission for photographs and videos taken during classes to be used for promotional purposes.
                  </p>

                  <p className="font-semibold mt-4">
                    By signing below, I acknowledge that I have read and fully understand this waiver and release.
                  </p>
                </div>
              </ScrollArea>
            </Card>

            {/* Student/Parent Info */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentName" className="text-white text-lg mb-2 block">
                    Student Name *
                  </Label>
                  <Input
                    id="studentName"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="h-12 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="parentName" className="text-white text-lg mb-2 block">
                    Parent/Guardian Name (if minor) *
                  </Label>
                  <Input
                    id="parentName"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="h-12 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </Card>

            {/* Signature Pad */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-white text-lg">
                  Signature *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  className="border-slate-700 text-slate-300 hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-48 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/50 cursor-crosshair touch-none"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-slate-500 text-lg">Sign here with your finger or mouse</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Agreement Checkbox */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="agree" className="text-white text-lg cursor-pointer">
                  I have read and agree to the terms of this waiver and release. I understand that by signing this document, I am giving up legal rights.
                </Label>
              </div>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={!agreed || !hasSignature || !studentName || !parentName}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-14 text-lg disabled:opacity-50"
            >
              Submit Waiver
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

