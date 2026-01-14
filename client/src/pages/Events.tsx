import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { APP_TITLE } from "@/const";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Search,
  Filter
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

/**
 * Events & Camps Registration Page
 */
export default function Events() {
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  // Registration form state
  const [studentId, setStudentId] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  useEffect(() => {
    loadEvents();
  }, [filterType]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Mock events data - will connect to backend API
      const mockEvents = [
        {
          id: 1,
          title: "Spring Break Camp",
          description: "Full-day martial arts camp with games, training, and fun activities!",
          event_type: "camp",
          event_date: "2025-03-24",
          start_time: "9:00 AM",
          end_time: "3:00 PM",
          location: "Main Dojo",
          price: 199,
          spots_available: 12,
          total_spots: 20,
          image_url: null,
          registration_deadline: "2025-03-20"
        },
        {
          id: 2,
          title: "Belt Testing Tournament",
          description: "Quarterly belt advancement testing and tournament",
          event_type: "tournament",
          event_date: "2025-03-15",
          start_time: "10:00 AM",
          end_time: "4:00 PM",
          location: "Competition Arena",
          price: 75,
          spots_available: 30,
          total_spots: 50,
          image_url: null,
          registration_deadline: "2025-03-10"
        },
        {
          id: 3,
          title: "Parents Night Out",
          description: "Drop off the kids for pizza, movies, and martial arts fun!",
          event_type: "parents_night_out",
          event_date: "2025-03-08",
          start_time: "6:00 PM",
          end_time: "9:00 PM",
          location: "Main Dojo",
          price: 35,
          spots_available: 8,
          total_spots: 15,
          image_url: null,
          registration_deadline: "2025-03-07"
        },
        {
          id: 4,
          title: "Self-Defense Workshop",
          description: "Learn practical self-defense techniques for real-world situations",
          event_type: "event",
          event_date: "2025-03-12",
          start_time: "7:00 PM",
          end_time: "9:00 PM",
          location: "Main Dojo",
          price: 45,
          spots_available: 15,
          total_spots: 25,
          image_url: null,
          registration_deadline: "2025-03-11"
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedEvent || !studentId || !parentName || !parentEmail || !parentPhone) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Will connect to backend API
      alert(`Successfully registered for ${selectedEvent.title}!`);
      setSelectedEvent(null);
      setStudentId("");
      setParentName("");
      setParentEmail("");
      setParentPhone("");
      loadEvents();
    } catch (error) {
      console.error("Error registering:", error);
      alert("Registration failed. Please try again.");
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || event.event_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "camp": return "bg-orange-600";
      case "tournament": return "bg-red-600";
      case "parents_night_out": return "bg-purple-600";
      case "event": return "bg-blue-600";
      default: return "bg-slate-600";
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "camp": return "Camp";
      case "tournament": return "Tournament";
      case "parents_night_out": return "Parents Night Out";
      case "event": return "Workshop";
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Events & Camps</h1>
              <p className="text-sm text-slate-400">Browse and register for upcoming events</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-800 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                className={filterType === "all" ? "bg-red-600 hover:bg-red-700" : "border-slate-700 text-white hover:bg-slate-800"}
              >
                All
              </Button>
              <Button
                variant={filterType === "camp" ? "default" : "outline"}
                onClick={() => setFilterType("camp")}
                className={filterType === "camp" ? "bg-red-600 hover:bg-red-700" : "border-slate-700 text-white hover:bg-slate-800"}
              >
                Camps
              </Button>
              <Button
                variant={filterType === "tournament" ? "default" : "outline"}
                onClick={() => setFilterType("tournament")}
                className={filterType === "tournament" ? "bg-red-600 hover:bg-red-700" : "border-slate-700 text-white hover:bg-slate-800"}
              >
                Tournaments
              </Button>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No events found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Badge className={`${getEventTypeColor(event.event_type)} text-white border-0 mb-2`}>
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                        <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                        <p className="text-slate-400 text-sm mb-4">{event.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span>{event.spots_available} / {event.total_spots} spots available</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <div className="text-2xl font-bold text-white">
                        ${event.price}
                      </div>
                      <Button
                        onClick={() => setSelectedEvent(event)}
                        disabled={event.spots_available <= 0}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                      >
                        {event.spots_available <= 0 ? "Full" : "Register"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Registration Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-2">Register for Event</h3>
              <p className="text-lg text-slate-300 mb-6">{selectedEvent.title}</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Student ID or Phone Number</label>
                  <Input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter student ID or phone"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Parent/Guardian Name</label>
                  <Input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Enter full name"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Email Address</label>
                  <Input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Phone Number</label>
                  <Input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Event Price:</span>
                    <span className="text-white font-semibold">${selectedEvent.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Processing Fee:</span>
                    <span className="text-white font-semibold">$0</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="text-white font-bold">Total:</span>
                    <span className="text-white font-bold text-lg">${selectedEvent.price}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegister}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  >
                    Complete Registration
                  </Button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Payment will be processed after registration confirmation
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

