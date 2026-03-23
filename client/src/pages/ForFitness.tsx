import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/MainLayout";
import { 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  Star, 
  TrendingUp, 
  Dumbbell,
  Zap,
  Monitor,
  LineChart,
  UserCheck,
} from "lucide-react";
import { useEffect } from "react";

export default function ForFitness() {
  useEffect(() => {
    // Reveal animations on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const challenges = [
    {
      problem: "Front desk overwhelmed during peak hours",
      solution: "Self-service kiosk handles check-ins, waivers, and member questions instantly"
    },
    {
      problem: "Leads going cold before follow-up",
      solution: "Kai AI responds to inquiries in seconds, books tours, and nurtures leads automatically"
    },
    {
      problem: "Class capacity issues and no-shows",
      solution: "Smart booking with waitlists, automatic reminders, and no-show tracking"
    },
    {
      problem: "Manual reporting takes hours",
      solution: "Real-time dashboards show attendance, revenue, and member metrics at a glance"
    },
    {
      problem: "Member churn without warning",
      solution: "Predictive analytics flag at-risk members before they cancel"
    },
    {
      problem: "Staff scheduling headaches",
      solution: "Automated shift management with availability tracking and swap requests"
    }
  ];

  const features = [
    {
      icon: Monitor,
      title: "Self-Service Kiosk",
      description: "Reduce front desk congestion with a sleek check-in kiosk. Members scan in, sign waivers, book classes, and update payment info—all without staff assistance.",
      benefits: ["QR code check-in", "Digital waiver signing", "Class booking", "Payment updates"],
      image: "/fitness-reception.jpg"
    },
    {
      icon: Zap,
      title: "Kai AI Lead Response",
      description: "Every lead gets an instant, personalized response. Kai answers questions, schedules tours, sends pricing, and follows up until they convert or opt out.",
      benefits: ["Instant response (< 30 seconds)", "Tour scheduling", "Pricing delivery", "Automated follow-up sequences"],
      image: "/fitness-personal-training.jpg"
    },
    {
      icon: Calendar,
      title: "Smart Class Management",
      description: "Create class schedules, manage capacity, handle waitlists, and reduce no-shows with automated reminders. Members book via app, kiosk, or web.",
      benefits: ["Capacity management", "Waitlist automation", "No-show tracking", "Multi-channel booking"],
      image: "/fitness-group-class.webp"
    },
    {
      icon: LineChart,
      title: "Real-Time Analytics",
      description: "See your gym's vital signs instantly: daily check-ins, class attendance, revenue trends, member growth, and retention rates—all in one dashboard.",
      benefits: ["Live attendance tracking", "Revenue dashboards", "Retention analytics", "Custom reports"],
      image: "/fitness-dashboard.jpg"
    },
    {
      icon: UserCheck,
      title: "Member Retention AI",
      description: "DojoFlow analyzes member behavior to predict who's at risk of canceling. Get alerts and automated re-engagement campaigns before it's too late.",
      benefits: ["Churn prediction", "Automated outreach", "Win-back campaigns", "Engagement scoring"],
      image: "/fitness-coach-class.jpeg"
    },
    {
      icon: CreditCard,
      title: "Automated Billing",
      description: "Handle memberships, class packs, personal training packages, and retail sales. Stripe integration manages recurring payments and failed card recovery.",
      benefits: ["Recurring billing", "Failed payment recovery", "Package management", "POS integration"],
      image: "/fitness-technology.jpg"
    }
  ];

  const workflows = [
    {
      title: "New Member Onboarding",
      steps: [
        "Lead submits inquiry via website or walk-in",
        "Kai AI responds instantly with tour options",
        "Tour booked and confirmation sent",
        "After tour, membership options presented",
        "Member signs up via kiosk or app",
        "Digital waiver and payment collected",
        "Welcome email with app download link",
        "First-week check-in scheduled automatically"
      ]
    },
    {
      title: "Peak Hour Management",
      steps: [
        "Members check in via kiosk (no front desk needed)",
        "Capacity displayed on screens in real-time",
        "Class bookings managed with waitlists",
        "Kai handles routine questions via chat",
        "Staff freed up for high-value interactions",
        "End-of-day reports generated automatically",
        "Peak hour patterns analyzed for staffing"
      ]
    },
    {
      title: "At-Risk Member Recovery",
      steps: [
        "System detects declining visit frequency",
        "Member flagged as at-risk in dashboard",
        "Kai sends personalized check-in message",
        "Special offer or free session extended",
        "If no response, escalates to staff call",
        "Member re-engages → celebration message",
        "Behavior tracked for future prediction improvement"
      ]
    }
  ];

  const testimonials = [
    {
      quote: "Our front desk used to be chaos during morning rush. Now members check themselves in, and our staff can actually help people instead of just scanning cards.",
      author: "Mike Thompson",
      role: "Owner, Iron Works Fitness",
      metric: "60% faster check-ins"
    },
    {
      quote: "Kai converted 40% more leads than our old system. It responds instantly, never forgets to follow up, and books tours while we sleep.",
      author: "Sarah Chen",
      role: "GM, FitLife 24/7",
      metric: "40% more conversions"
    },
    {
      quote: "The retention predictions are scary accurate. We saved 50+ members last quarter just by reaching out before they were about to cancel.",
      author: "James Rodriguez",
      role: "Owner, Peak Performance Gym",
      metric: "50+ members saved"
    }
  ];

  const stats = [
    { value: "60%", label: "Faster check-in times" },
    { value: "40%", label: "Higher lead conversion" },
    { value: "3x", label: "More efficient front desk" },
    { value: "25%", label: "Reduction in member churn" }
  ];

  const integrations = [
    "Stripe", "Square", "Google Calendar", "Mailchimp", "Twilio", "Zapier", "QuickBooks", "Mindbody"
  ];

  return (
    <MainLayout transparentHeader>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-[#bce8cc] to-[#b0e2c2] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/LdvGiMXAKXQpZGqZ.jpg" 
            alt="Modern fitness facility" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#bce8cc]/80 to-[#b0e2c2]/90" />
        </div>
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full text-sm font-medium text-gray-700 mb-8">
              <Dumbbell className="w-4 h-4 text-red-600" />
              Built for High-Volume Fitness Facilities
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Your Gym on <span className="text-red-600">Autopilot</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-10 max-w-3xl mx-auto">
              DojoFlow gives fitness facilities the AI-powered kiosk and automation layer to handle 
              check-ins, convert leads, manage classes, and retain members—without adding headcount.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/owner">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 h-auto">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="#demo">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white">
                  See It In Action
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-red-500 mb-2">{stat.value}</div>
                <div className="text-sm md:text-base text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 bg-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for Busy Gyms
            </h2>
            <p className="text-xl text-gray-600">
              High-volume facilities face unique challenges. DojoFlow is designed to handle 
              the scale and complexity of modern fitness operations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {challenges.map((item, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm line-through mb-2">{item.problem}</p>
                    <p className="text-gray-900 font-medium">{item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kiosk Highlight Section */}
      <section className="py-24 bg-gradient-to-b from-gray-900 to-gray-800 text-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 rounded-full text-sm font-medium text-red-400 mb-6">
                <Monitor className="w-4 h-4" />
                Self-Service Kiosk
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Your 24/7 Front Desk
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                The DojoFlow kiosk handles everything your front desk does—check-ins, waivers, 
                class bookings, payment updates—without the staffing costs or wait times.
              </p>
              <ul className="space-y-4">
                {[
                  "QR code or member ID check-in",
                  "Digital waiver signing for new members",
                  "Real-time class booking with capacity display",
                  "Payment method updates and billing inquiries",
                  "Kai AI chat for instant answers"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-red-500/30 shadow-2xl">
                <img 
                  src="/fitness-reception.jpg" 
                  alt="Modern gym reception and check-in area" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-white font-semibold text-lg">Self-Service Kiosk</p>
                  <p className="text-gray-300 text-sm">Streamlined member check-in</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Complete Facility Management
            </h2>
            <p className="text-xl text-gray-600">
              Every tool you need to run a high-volume fitness facility efficiently.
            </p>
          </div>
          <div className="space-y-16 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`grid md:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-lg text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className="aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Automation Section */}
      <section className="py-24 bg-gray-900 text-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Automation at <span className="text-red-500">Scale</span>
            </h2>
            <p className="text-xl text-gray-400">
              See how DojoFlow handles your busiest days without breaking a sweat.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {workflows.map((workflow, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl bg-gray-800 border border-gray-700"
              >
                <h3 className="text-xl font-bold text-white mb-6">{workflow.title}</h3>
                <ol className="space-y-4">
                  {workflow.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        {i + 1}
                      </div>
                      <span className="text-gray-300 text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 bg-gray-50 scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Connects With Your Stack
            </h2>
            <p className="text-gray-600">
              DojoFlow integrates with the tools you already use.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
            {integrations.map((integration, index) => (
              <div 
                key={index}
                className="px-6 py-3 bg-white rounded-full border border-gray-200 text-gray-700 font-medium"
              >
                {integration}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Fitness Leaders
            </h2>
            <p className="text-xl text-gray-600">
              Join gyms and fitness centers already scaling with DojoFlow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{testimonial.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-[#bce8cc] to-[#b0e2c2] scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Scale Your Facility?
            </h2>
            <p className="text-xl text-gray-700 mb-10">
              Start your free trial today. No credit card required. 
              See the difference in your first week.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/owner">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 h-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/#contact">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white">
                  Request Demo
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-sm text-gray-600">
              7-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
