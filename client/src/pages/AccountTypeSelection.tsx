import { useNavigate } from "react-router-dom";
import { Building2, Users, GraduationCap } from "lucide-react";

/**
 * Account Type Selection - Entry point for multi-tenant authentication
 * Users select their role before proceeding to role-specific login
 */
export default function AccountTypeSelection() {
  const navigate = useNavigate();

  const accountTypes = [
    {
      id: "owner",
      title: "School Owner",
      description: "Manage your martial arts school, staff, and students",
      icon: Building2,
      route: "/owner",
      gradient: "from-red-500 to-orange-500",
    },
    {
      id: "staff",
      title: "Staff / Instructor",
      description: "Access your school's dashboard and student management",
      icon: Users,
      route: "/staff/login",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "student",
      title: "Parent / Student",
      description: "View your student portal, schedule, and progress",
      icon: GraduationCap,
      route: "/student-login",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/kai-avatar.png"
              alt="DojoFlow"
              className="h-16 w-16"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Welcome to DojoFlow
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Select your account type to continue
          </p>
        </div>

        {/* Account Type Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {accountTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => navigate(type.route)}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-left border border-slate-200 dark:border-slate-700"
              >
                {/* Gradient Icon Background */}
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${type.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  {type.title}
                </h2>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {type.description}
                </p>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-slate-600 dark:text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            DojoFlow - AI-Powered Martial Arts Management
          </p>
        </div>
      </div>
    </div>
  );
}
