import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/MainLayout";
import { 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  BarChart3, 
  GraduationCap,
} from "lucide-react";
import { useEffect } from "react";

export default function ForSchools() {
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
      problem: "Spending hours on admin instead of teaching",
      solution: "Kai AI handles 80% of routine inquiries, scheduling, and follow-ups automatically"
    },
    {
      problem: "Students falling through the cracks",
      solution: "Automated attendance tracking and at-risk student alerts before they quit"
    },
    {
      problem: "Chasing payments and managing billing",
      solution: "Automated recurring billing with failed payment recovery—get paid on time, every time"
    },
    {
      problem: "Inconsistent communication with parents",
      solution: "Multi-channel messaging (SMS, email, in-app) keeps everyone informed instantly"
    },
    {
      problem: "No visibility into school health metrics",
      solution: "Real-time dashboards show retention, revenue, attendance, and growth trends"
    },
    {
      problem: "Onboarding new students is chaotic",
      solution: "Streamlined enrollment flow with digital waivers, automatic class placement, and welcome sequences"
    }
  ];

  const features = [
    {
      icon: Users,
      title: "Complete Student Profiles",
      description: "Track belt ranks, attendance history, achievements, emergency contacts, and custom notes. Every student's journey documented in one place.",
      benefits: ["Belt progression tracking", "Photo ID management", "Emergency contact access", "Custom notes & tags"],
      image: "/schools/student-profiles.jpg"
    },
    {
      icon: Calendar,
      title: "Smart Class Scheduling",
      description: "Create recurring class schedules, manage belt testing events, and handle private lessons. Students can self-book available slots.",
      benefits: ["Drag-and-drop scheduling", "Capacity management", "Waitlist automation", "Google Calendar sync"],
      image: "/schools/class-scheduling.jpg"
    },
    {
      icon: GraduationCap,
      title: "Belt Testing & Promotions",
      description: "Organize belt tests, track eligibility requirements, and celebrate promotions. Automated notifications keep families informed.",
      benefits: ["Eligibility tracking", "Test scheduling", "Parent notifications", "Achievement certificates"],
      image: "/schools/belt-ceremony.jpg"
    },
    {
      icon: CreditCard,
      title: "Automated Billing",
      description: "Set up monthly memberships, class packs, or drop-in rates. Stripe integration handles payments, failed card recovery, and invoicing.",
      benefits: ["Recurring payments", "Failed payment recovery", "Family discounts", "Instant invoicing"],
      image: "/schools/automated-billing.jpg"
    },
    {
      icon: MessageSquare,
      title: "Kai AI Assistant",
      description: "Your 24/7 front desk assistant answers parent questions, schedules trial classes, sends reminders, and handles routine communication.",
      benefits: ["Instant responses", "Trial class booking", "Absence follow-up", "FAQ handling"],
      image: "/schools/kai-ai-assistant.jpg"
    },
    {
      icon: BarChart3,
      title: "School Health Dashboard",
      description: "See your school's vital signs at a glance: retention rates, revenue trends, attendance patterns, and student progress metrics.",
      benefits: ["Retention analytics", "Revenue forecasting", "Attendance reports", "Growth tracking"],
      image: "/schools/analytics-dashboard.jpg"
    }
  ];

  const workflows = [
    {
      title: "New Student Enrollment",
      steps: [
        "Parent fills out online inquiry form",
        "Kai AI responds instantly with trial class options",
        "Parent books trial via self-service calendar",
        "Automated reminder sent 24 hours before",
        "After trial, enrollment link sent automatically",
        "Digital waiver and payment collected online",
        "Student added to appropriate classes",
        "Welcome sequence begins (intro email, first-week tips)"
      ]
    },
    {
      title: "At-Risk Student Recovery",
      steps: [
        "System detects 2+ missed classes in a row",
        "Alert sent to school owner/manager",
        "Kai sends personalized check-in message to parent",
        "If no response, escalates to phone call task",
        "Re-engagement offer sent (makeup class, special event)",
        "Student returns → celebration message sent",
        "Retention saved, relationship strengthened"
      ]
    },
    {
      title: "Belt Testing Cycle",
      steps: [
        "System identifies eligible students based on criteria",
        "Invitation sent to qualified families",
        "Registration and payment collected online",
        "Pre-test reminders sent automatically",
        "Test day check-in via kiosk",
        "Results entered, promotions recorded",
        "Congratulations message + certificate sent",
        "New belt rank updated in student profile"
      ]
    }
  ];

  const testimonials = [
    {
      quote: "Before DojoFlow, I was drowning in spreadsheets and sticky notes. Now I actually have time to teach. My retention rate jumped 35% in the first 6 months.",
      author: "Master Kim",
      role: "Owner, Phoenix Taekwondo Academy",
      metric: "35% retention increase"
    },
    {
      quote: "Kai handles most parent questions before I even see them. It's like having a full-time receptionist who never sleeps and never makes mistakes.",
      author: "Sensei Rodriguez",
      role: "Head Instructor, Bushido Martial Arts",
      metric: "80% fewer admin calls"
    },
    {
      quote: "The billing automation alone is worth the price. I used to spend 5 hours a week chasing payments. Now it's zero.",
      author: "Sifu Chen",
      role: "Owner, Dragon Kung Fu",
      metric: "5 hours saved weekly"
    }
  ];

  const stats = [
    { value: "35%", label: "Average retention increase" },
    { value: "80%", label: "Reduction in admin time" },
    { value: "2x", label: "Faster student enrollment" },
    { value: "99%", label: "On-time payment rate" }
  ];

  return (
    <MainLayout transparentHeader>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-[#c8eed5] to-[#bce8cc] relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/schools/martial-arts-class-hero.jpg" 
            alt="Martial arts class in action" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#c8eed5]/80 to-[#bce8cc]/90" />
        </div>
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full text-sm font-medium text-gray-700 mb-8">
              <GraduationCap className="w-4 h-4 text-red-600" />
              Built for Martial Arts Schools
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Run Your School Like a <span className="text-red-600">Black Belt</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-10 max-w-3xl mx-auto">
              DojoFlow gives martial arts school owners the AI-powered tools to automate enrollment, 
              boost retention, streamline billing, and focus on what matters most—teaching.
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
                  Watch Demo
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
              We Know Your Challenges
            </h2>
            <p className="text-xl text-gray-600">
              Running a martial arts school means wearing a dozen hats. DojoFlow takes the admin burden off your shoulders.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {challenges.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="text-red-600 font-semibold mb-3">The Problem</div>
                <p className="text-gray-900 font-medium mb-4">{item.problem}</p>
                <div className="text-green-600 font-semibold mb-3">Our Solution</div>
                <p className="text-gray-600">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Grow
            </h2>
            <p className="text-xl text-gray-600">
              Purpose-built features for martial arts schools, from white belt to black belt operations.
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

      {/* Workflows Section */}
      <section className="py-24 bg-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Automated Workflows That Work
            </h2>
            <p className="text-xl text-gray-600">
              Set it and forget it. DojoFlow handles the routine so you can focus on students.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {workflows.map((workflow, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{workflow.title}</h3>
                <ol className="space-y-4">
                  {workflow.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-sm font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-gray-600 text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-900 text-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by School Owners
            </h2>
            <p className="text-xl text-gray-400">
              Join hundreds of martial arts schools already using DojoFlow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-800 rounded-2xl p-8">
                <div className="text-red-500 font-bold text-2xl mb-4">{testimonial.metric}</div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.author}</div>
                  <div className="text-gray-500 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-[#c8eed5] to-[#bce8cc]">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Transform Your School?
            </h2>
            <p className="text-xl text-gray-700 mb-10">
              Join the martial arts schools that are growing faster, retaining more students, and spending less time on admin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/owner">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 h-auto">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
