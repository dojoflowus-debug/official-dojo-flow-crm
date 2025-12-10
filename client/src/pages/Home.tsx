import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Home() {
  console.log('DojoFlow Kiosk - Home component rendering');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">DojoFlow Kiosk</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Button 
          onClick={() => navigate('/checkin')}
          className="h-32 text-xl"
        >
          Check In
        </Button>
        
        <Button 
          onClick={() => navigate('/new-visitor')}
          className="h-32 text-xl"
        >
          New Visitor
        </Button>
        
        <Button 
          onClick={() => navigate('/events')}
          className="h-32 text-xl"
        >
          Events
        </Button>
        
        <Button 
          onClick={() => navigate('/admin')}
          className="h-32 text-xl"
        >
          Admin
        </Button>
      </div>
    </div>
  );
}
