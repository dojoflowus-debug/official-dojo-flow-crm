import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  CheckCircle2,
  UserPlus
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function NewVisitor() {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    age: "",
    interest: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
              <div className="p-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <CheckCircle2 className="h-20 w-20 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Welcome to Our Dojo!
              </h2>
              <p className="text-xl text-slate-300 mb-4">
                Your trial class has been scheduled
              </p>
              <p className="text-slate-400">
                Check your phone for a confirmation text with class details
              </p>
            </div>

            <div className="p-6 rounded-lg bg-slate-800/50 text-left">
              <h3 className="text-lg font-semibold text-white mb-3">Next Steps:</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>You'll receive an SMS confirmation shortly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Arrive 15 minutes early for your first class</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Wear comfortable athletic clothing</span>
                </li>
              </ul>
            </div>

            <Button
              size="lg"
              onClick={() => setLocation("/")}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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
            <h1 className="text-2xl font-bold text-white">New Visitor Sign-Up</h1>
            <p className="text-sm text-slate-400">Schedule your free trial class</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Let's Get Started!</h2>
                <p className="text-slate-400">Fill out the form below to schedule your trial</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white text-lg mb-2 block">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-white text-lg mb-2 block">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-white text-lg mb-2 block">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-white text-lg mb-2 block">
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age" className="text-white text-lg mb-2 block">
                    Student Age *
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    required
                    placeholder="Age"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="h-12 bg-slate-800 border-slate-700 text-white text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="interest" className="text-white text-lg mb-2 block">
                    Class Interest *
                  </Label>
                  <Select
                    value={formData.interest}
                    onValueChange={(value) => setFormData({...formData, interest: value})}
                  >
                    <SelectTrigger className="h-12 bg-slate-800 border-slate-700 text-white text-lg">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="karate">Karate</SelectItem>
                      <SelectItem value="jiu-jitsu">Jiu-Jitsu</SelectItem>
                      <SelectItem value="taekwondo">Taekwondo</SelectItem>
                      <SelectItem value="kickboxing">Kickboxing</SelectItem>
                      <SelectItem value="kids">Kids Classes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-14 text-lg"
              >
                Schedule My Free Trial
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

