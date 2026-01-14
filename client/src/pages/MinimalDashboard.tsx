import { useState, useEffect } from "react";

export default function MinimalDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/trpc/dashboard.stats");
        const json = await res.json();
        console.log("Fetched data:", json);
        setData(json.result?.data || null);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "36px", marginBottom: "20px" }}>DojoFlow Dashboard</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Students</div>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2563eb" }}>
            {data?.studentCount || 0}
          </div>
        </div>

        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Monthly Revenue</div>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#16a34a" }}>
            ${data?.revenue?.toLocaleString() || 0}
          </div>
        </div>

        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Active Leads</div>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#9333ea" }}>
            {data?.leadCount || 0}
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>Today's Schedule</h2>
        {data?.classes && data.classes.length > 0 ? (
          <div>
            {data.classes.map((cls: any) => (
              <div key={cls.id} style={{ padding: "16px", marginBottom: "12px", backgroundColor: "#f9fafb", borderLeft: "4px solid #2563eb", borderRadius: "4px" }}>
                <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "4px" }}>{cls.name}</div>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  {cls.time} | Instructor: {cls.instructor}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#999", textAlign: "center", padding: "20px" }}>No classes scheduled</div>
        )}
      </div>

      <div style={{ fontSize: "12px", color: "#999", marginTop: "40px" }}>
        Debug: {data ? "Data loaded successfully" : "No data"}
      </div>
    </div>
  );
}
