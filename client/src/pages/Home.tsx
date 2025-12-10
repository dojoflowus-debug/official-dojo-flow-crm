import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Home() {
  console.log('DojoFlow Kiosk - Home component rendering');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">DojoFlow Kiosk</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Button 
          onClick={() => navigate('/checkin')}
          className="h-32 text-xl bg-[#ED393D] hover:bg-[#D9292D] text-white"
        >
          Check In
        </Button>
        
        <Button 
          onClick={() => navigate('/new-visitor')}
          className="h-32 text-xl bg-[#ED393D] hover:bg-[#D9292D] text-white"
        >
          New Visitor
        </Button>
        
        <Button 
          onClick={() => navigate('/events')}
          className="h-32 text-xl bg-[#ED393D] hover:bg-[#D9292D] text-white"
        >
          Events
        </Button>
        
        <Button 
          onClick={() => navigate('/admin')}
          className="h-32 text-xl bg-[#ED393D] hover:bg-[#D9292D] text-white"
        >
          Admin
        </Button>
      </div>
    </div>
  );
}
