import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step0AvatarNameProps {
  onNext: (name: string) => void;
  onBack: () => void;
}

const SUGGESTED_NAMES = [
  "Kai",
  "Sensei",
  "Coach",
  "Master",
  "Mentor",
  "Guide",
];

export default function Step0AvatarName({ onNext, onBack }: Step0AvatarNameProps) {
  const [avatarName, setAvatarName] = useState("Kai");
  const [error, setError] = useState("");

  const validateName = (name: string): boolean => {
    if (name.length < 2) {
      setError("Name must be at least 2 characters");
      return false;
    }
    if (name.length > 20) {
      setError("Name must be 20 characters or less");
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      setError("Name can only contain letters and spaces");
      return false;
    }
    setError("");
    return true;
  };

  const handleNameChange = (value: string) => {
    setAvatarName(value);
    if (value.length > 0) {
      validateName(value);
    } else {
      setError("");
    }
  };

  const handleSuggestedName = (name: string) => {
    setAvatarName(name);
    setError("");
  };

  const handleNext = () => {
    if (validateName(avatarName)) {
      onNext(avatarName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && avatarName.trim()) {
      handleNext();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Name Your AI Assistant</h2>
        <p className="text-slate-600">
          Give your AI assistant a personal name. You can choose from suggestions or create your own.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="avatarName" className="text-base font-semibold">
            Assistant Name
          </Label>
          <div className="relative">
            <Input
              id="avatarName"
              type="text"
              value={avatarName}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a name..."
              className={`text-lg h-12 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              maxLength={20}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              {avatarName.length}/20
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 animate-in fade-in duration-200">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">Suggested Names</Label>
          <div className="grid grid-cols-3 gap-2">
            {SUGGESTED_NAMES.map((name) => (
              <Button
                key={name}
                variant={avatarName === name ? "default" : "outline"}
                onClick={() => handleSuggestedName(name)}
                className="h-12 text-base"
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-8"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!avatarName.trim() || !!error}
          className="px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
