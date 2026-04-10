import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Shield, Users, BarChart3, Calendar } from "lucide-react";

/**
 * Staff Authentication Page
 * Handles staff/instructor login with organization resolution
 */
export default function StaffAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.staffAuth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Login successful!");

      // If staff must change their temporary password, redirect immediately
      if (data.mustChangePassword) {
        toast.info("Please set a new password to continue.", { duration: 4000 });
        navigate("/staff/change-password");
        return;
      }

      // If user belongs to multiple organizations, show selector
      if (data.organizations && data.organizations.length > 1) {
        navigate("/select-organization", { state: { organizations: data.organizations } });
      } else if (data.organizations && data.organizations.length === 1) {
        navigate("/dashboard");
      } else {
        toast.error("You are not associated with any school. Please contact your administrator.");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0d0d1a" }}>
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(13,13,26,0.92) 0%, rgba(26,26,46,0.88) 50%, rgba(22,33,62,0.92) 100%), url('/hero-martial-arts.jpg') center/cover no-repeat`,
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(230,57,70,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(230,57,70,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <img
            src="/Lightdojoflow.png"
            alt="DojoFlow"
            style={{ height: "48px", objectFit: "contain" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo-light.png";
            }}
          />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(230,57,70,0.15)",
              border: "1px solid rgba(230,57,70,0.3)",
              borderRadius: "100px",
              padding: "6px 16px",
              marginBottom: "24px",
              width: "fit-content",
            }}
          >
            <Shield size={14} style={{ color: "#e63946" }} />
            <span style={{ color: "#e63946", fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px" }}>
              STAFF PORTAL
            </span>
          </div>

          <h1
            style={{
              color: "#ffffff",
              fontSize: "42px",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "16px",
              letterSpacing: "-0.5px",
            }}
          >
            Your dojo,
            <br />
            <span style={{ color: "#e63946" }}>fully in control.</span>
          </h1>

          <p style={{ color: "#8892a4", fontSize: "16px", lineHeight: 1.6, maxWidth: "380px" }}>
            Manage students, track attendance, view schedules, and collaborate with your team — all from one place.
          </p>

          {/* Feature highlights */}
          <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { icon: Users, label: "Student management & progress tracking" },
              { icon: Calendar, label: "Class schedules & attendance" },
              { icon: BarChart3, label: "Performance insights & reports" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "rgba(230,57,70,0.12)",
                    border: "1px solid rgba(230,57,70,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} style={{ color: "#e63946" }} />
                </div>
                <span style={{ color: "#b0bac8", fontSize: "14px" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p style={{ color: "#4a5568", fontSize: "13px" }}>
            © {new Date().getFullYear()} DojoFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div
        style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 48px", background: "#111827" }}
        className="lg:max-w-[50%]"
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <img
            src="/Lightdojoflow.png"
            alt="DojoFlow"
            style={{ height: "40px", objectFit: "contain" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo-light.png";
            }}
          />
        </div>

        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Header */}
          <div style={{ marginBottom: "36px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "rgba(230,57,70,0.15)",
                border: "1px solid rgba(230,57,70,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <Shield size={24} style={{ color: "#e63946" }} />
            </div>
            <h2
              style={{
                color: "#f1f5f9",
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "8px",
                letterSpacing: "-0.3px",
              }}
            >
              Staff Sign In
            </h2>
            <p style={{ color: "#64748b", fontSize: "15px" }}>
              Access your school dashboard
            </p>
          </div>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <Label
                htmlFor="email"
                style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500, letterSpacing: "0.3px", marginBottom: "8px", display: "block" }}
              >
                EMAIL ADDRESS
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="instructor@yourschool.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                  background: "#1e293b",
                  border: "1px solid #2d3748",
                  color: "#f1f5f9",
                  borderRadius: "10px",
                  height: "48px",
                  fontSize: "15px",
                  padding: "0 16px",
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <Label
                  htmlFor="password"
                  style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500, letterSpacing: "0.3px" }}
                >
                  PASSWORD
                </Label>
                <Link
                  to="/forgot-password"
                  style={{ color: "#e63946", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                  background: "#1e293b",
                  border: "1px solid #2d3748",
                  color: "#f1f5f9",
                  borderRadius: "10px",
                  height: "48px",
                  fontSize: "15px",
                  padding: "0 16px",
                }}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              style={{
                width: "100%",
                height: "50px",
                background: loginMutation.isPending
                  ? "rgba(230,57,70,0.5)"
                  : "linear-gradient(135deg, #e63946 0%, #c1121f 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loginMutation.isPending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                letterSpacing: "0.3px",
                marginTop: "4px",
                transition: "opacity 0.2s",
              }}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </div>

          {/* Footer note */}
          <p
            style={{
              color: "#4a5568",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "32px",
              lineHeight: 1.6,
            }}
          >
            Don't have an account?{" "}
            <span style={{ color: "#64748b" }}>Contact your school administrator.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
