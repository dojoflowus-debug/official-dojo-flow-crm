import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Zap, 
  Star, 
  TrendingUp, 
  Clock, 
  Bell, 
  Sparkles,
  ChevronLeft,
  Heart,
  Music,
  Palette,
  Gift,
  Repeat,
  UserPlus,
  Smartphone,
  Mail,
  Timer,
  Award
} from "lucide-react";
import { useEffect, useState } from "react";

export default function ForStudios() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      problem: "Managing class packs and memberships manually",
      solution: "Flexible billing handles unlimited memberships, class packs, drop-ins, and private sessions"
    },
    {
      problem: "Clients forgetting to book or showing up late",
      solution: "Automated reminders, easy rebooking, and late cancellation policies enforced automatically"
    },
    {
      problem: "Instructor scheduling conflicts",
      solution: "Staff availability tracking, sub requests, and automatic schedule updates"
    },
    {
      problem: "Building community and client relationships",
      solution: "Personalized communication, milestone celebrations, and engagement tracking"
    },
    {
      problem: "No time for marketing or follow-up",
      solution: "Kai AI handles lead nurturing, class recommendations, and re-engagement campaigns"
    },
    {
      problem: "Clunky booking experience driving clients away",
      solution: "Beautiful, mobile-first booking that clients actually enjoy using"
    }
  ];

  const features = [
    {
      icon: Calendar,
      title: "Elegant Class Booking",
      description: "A booking experience as refined as your studio. Clients browse schedules, book classes, and manage their packs from any device with a clean, intuitive interface.",
      benefits: ["Mobile-first design", "Real-time availability", "Waitlist management", "Easy rescheduling"]
    },
    {
      icon: CreditCard,
      title: "Flexible Memberships & Packs",
      description: "Unlimited memberships, 10-class packs, drop-in rates, private sessions—DojoFlow handles any pricing model with automatic renewals and expiration tracking.",
      benefits: ["Class pack tracking", "Auto-renewals", "Expiration alerts", "Family accounts"]
    },
    {
      icon: Users,
      title: "Instructor Management",
      description: "Track instructor availability, handle sub requests, manage payroll hours, and keep your schedule running smoothly even when life happens.",
      benefits: ["Availability calendars", "Sub request system", "Hour tracking", "Performance insights"]
    },
    {
      icon: MessageSquare,
      title: "Kai AI Concierge",
      description: "Your always-on studio assistant answers questions, recommends classes, sends reminders, and keeps clients engaged with personalized communication.",
      benefits: ["Instant responses", "Class recommendations", "Reminder sequences", "Re-engagement campaigns"]
    },
    {
      icon: Heart,
      title: "Client Relationship Tools",
      description: "Track client preferences, celebrate milestones, send birthday messages, and build the kind of relationships that keep clients coming back for years.",
      benefits: ["Preference tracking", "Milestone celebrations", "Birthday automation", "Attendance history"]
    },
    {
      icon: BarChart3,
      title: "Studio Analytics",
      description: "Understand your business with clear insights: class popularity, instructor performance, revenue trends, and client retention—all in one dashboard.",
      benefits: ["Class popularity", "Revenue tracking", "Retention metrics", "Instructor analytics"]
    }
  ];

  const workflows = [
    {
      title: "New Client Journey",
      steps: [
        "Client discovers studio via website or referral",
        "Kai AI greets them, answers questions instantly",
        "First-class offer presented with easy booking",
        "Reminder sent 24 hours before class",
        "Post-class follow-up with pack/membership options",
        "Client purchases → welcome sequence begins",
        "Preferences noted for personalized recommendations",
        "Milestone tracking starts (10th class, 1 year, etc.)"
      ]
    },
    {
      title: "Class Pack Management",
      steps: [
        "Client purchases 10-class pack online",
        "Pack balance visible in app and at check-in",
        "Automatic reminder at 3 classes remaining",
        "Renewal offer sent at 1 class remaining",
        "If pack expires, grace period + special offer",
        "Easy upgrade path to unlimited membership",
        "All history tracked for client insights"
      ]
    },
    {
      title: "Instructor Substitution",
      steps: [
        "Instructor marks unavailable for specific class",
        "System notifies qualified subs automatically",
        "First available sub claims the class",
        "Schedule updates in real-time",
        "Clients notified of instructor change",
        "Sub's hours tracked for payroll",
        "Original instructor sees confirmation"
      ]
    }
  ];

  const testimonials = [
    {
      quote: "DojoFlow understands boutique studios. The booking experience is beautiful, the automation is thoughtful, and my clients actually compliment how easy it is to use.",
      author: "Emma Chen",
      role: "Owner, Flow Yoga Studio",
      metric: "95% client satisfaction"
    },
    {
      quote: "Managing class packs used to be a nightmare. Now it's completely automatic—clients get reminders, renewals happen seamlessly, and I never lose track of anyone.",
      author: "Marcus Williams",
      role: "Owner, Urban Dance Collective",
      metric: "30% more renewals"
    },
    {
      quote: "The instructor management alone is worth it. Sub requests, availability, hour tracking—it used to take me hours. Now it's just... handled.",
      author: "Sofia Rodriguez",
      role: "Owner, Pilates Plus Studio",
      metric: "5 hours saved weekly"
    }
  ];

  const stats = [
    { value: "95%", label: "Client satisfaction rate" },
    { value: "30%", label: "Increase in pack renewals" },
    { value: "2x", label: "Faster booking experience" },
    { value: "40%", label: "Less admin time" }
  ];

  const studioTypes = [
    { name: "Yoga Studios", icon: Heart },
    { name: "Dance Studios", icon: Music },
    { name: "Pilates Studios", icon: Users },
    { name: "Barre Studios", icon: Award },
    { name: "Meditation Centers", icon: Sparkles },
    { name: "Art & Craft Studios", icon: Palette }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <Link href="/auth">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-[#b0e2c2] to-[#a4dcb8]">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full text-sm font-medium text-gray-700 mb-8">
              <Heart className="w-4 h-4 text-red-600" />
              Built for Boutique Studios
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Studio Operations, <span className="text-red-600">Elevated</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-10 max-w-3xl mx-auto">
              DojoFlow gives yoga, dance, pilates, and boutique training studios the elegant 
              automation they deserve—beautiful booking, flexible memberships, and AI-powered 
              client relationships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 h-auto">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white">
                  See It In Action
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Types */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
            {studioTypes.map((type, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-600">
                <type.icon className="w-5 h-5 text-red-500" />
                <span className="font-medium">{type.name}</span>
              </div>
            ))}
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
              We Understand Boutique
            </h2>
            <p className="text-xl text-gray-600">
              Boutique studios need tools that match their attention to detail. 
              DojoFlow delivers enterprise features with boutique elegance.
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

      {/* Booking Experience Highlight */}
      <section className="py-24 bg-gradient-to-b from-gray-900 to-gray-800 text-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 rounded-full text-sm font-medium text-red-400 mb-6">
                <Smartphone className="w-4 h-4" />
                Beautiful Booking
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Booking Your Clients Will Love
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                First impressions matter. DojoFlow's booking experience is as polished as your studio—
                clean, intuitive, and delightful to use on any device.
              </p>
              <ul className="space-y-4">
                {[
                  "Mobile-first design that works beautifully everywhere",
                  "Real-time class availability and waitlists",
                  "Easy rescheduling and cancellation",
                  "Class pack balance always visible",
                  "Personalized class recommendations"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[3/4] rounded-3xl bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/30 flex items-center justify-center">
                <div className="text-center">
                  <Smartphone className="w-32 h-32 text-red-400/50 mx-auto mb-4" />
                  <p className="text-gray-400">Mobile Booking Preview</p>
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
              Everything Your Studio Needs
            </h2>
            <p className="text-xl text-gray-600">
              Purpose-built features for boutique studios, designed with the same attention to detail you bring to your craft.
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
                  <div className="aspect-video rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 flex items-center justify-center">
                    <feature.icon className="w-24 h-24 text-red-200" />
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
              Thoughtful <span className="text-red-500">Automation</span>
            </h2>
            <p className="text-xl text-gray-400">
              See how DojoFlow handles the details so you can focus on your clients.
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

      {/* Client Relationship Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Build Relationships That Last
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Boutique studios thrive on personal connections. DojoFlow helps you remember 
                  every detail and celebrate every milestone.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Milestone Celebrations</h3>
                      <p className="text-gray-600">Automatic messages for 10th class, 1-year anniversary, and custom milestones.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Preference Tracking</h3>
                      <p className="text-gray-600">Remember favorite instructors, class times, and special requests.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Personalized Communication</h3>
                      <p className="text-gray-600">Kai AI sends messages that feel personal, not automated.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-3xl font-bold text-red-600 mb-2">100+</div>
                  <div className="text-sm text-gray-600">Classes attended</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-3xl font-bold text-red-600 mb-2">2 yrs</div>
                  <div className="text-sm text-gray-600">Member since</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-3xl font-bold text-red-600 mb-2">Sarah</div>
                  <div className="text-sm text-gray-600">Favorite instructor</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-3xl font-bold text-red-600 mb-2">6pm</div>
                  <div className="text-sm text-gray-600">Preferred time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by Studio Owners
            </h2>
            <p className="text-xl text-gray-600">
              Join boutique studios already elevating their operations with DojoFlow.
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
      <section className="py-24 bg-gradient-to-b from-[#b0e2c2] to-[#a4dcb8] scroll-reveal">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Elevate Your Studio?
            </h2>
            <p className="text-xl text-gray-700 mb-10">
              Start your free trial today. No credit card required. 
              Experience the difference in your first week.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 h-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/#contact">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white">
                  Talk to Sales
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-sm text-gray-600">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/dojoflow-icon.svg" alt="DojoFlow" className="w-8 h-8" />
              <span className="text-xl font-bold">DojoFlow</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/schools" className="hover:text-white transition-colors">For Schools</Link>
              <Link href="/fitness" className="hover:text-white transition-colors">For Fitness</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} DojoFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
