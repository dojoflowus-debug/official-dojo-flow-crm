import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { APP_LOGO } from "@/const";

export default function PrintFulfillmentSheet() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") as "pending" | "handed_out" | undefined;

  const { data: fulfillments, isLoading } = trpc.merchandise.getPendingFulfillments.useQuery({
    status: status || "pending",
  });

  const { data: settings } = trpc.auth.getKioskSettings.useQuery();

  useEffect(() => {
    // Auto-print when data is loaded
    if (!isLoading && fulfillments) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isLoading, fulfillments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading fulfillment sheet...</div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="print-container">
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
        }
        
        .print-container {
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #000;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }
        
        .header-title h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        
        .header-title p {
          font-size: 14px;
          color: #666;
          margin: 5px 0 0 0;
        }
        
        .header-right {
          text-align: right;
        }
        
        .header-right p {
          margin: 3px 0;
          font-size: 14px;
        }
        
        .fulfillment-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .fulfillment-table th {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          font-size: 13px;
        }
        
        .fulfillment-table td {
          border: 1px solid #ddd;
          padding: 12px 8px;
          font-size: 13px;
        }
        
        .fulfillment-table tr:nth-child(even) {
          background-color: #fafafa;
        }
        
        .checkbox-col {
          width: 50px;
          text-align: center;
        }
        
        .signature-col {
          width: 200px;
        }
        
        .checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #333;
          display: inline-block;
        }
        
        .signature-line {
          border-bottom: 1px solid #333;
          height: 30px;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        
        .instructions {
          margin-top: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-left: 4px solid #333;
        }
        
        .instructions h3 {
          margin-top: 0;
          font-size: 14px;
        }
        
        .instructions ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .instructions li {
          margin: 5px 0;
          font-size: 12px;
        }
      `}</style>

      <div className="header">
        <div className="header-left">
          <img src={APP_LOGO} alt="Dojo Logo" className="logo" />
          <div className="header-title">
            <h1>Merchandise Fulfillment Sheet</h1>
            <p>{settings?.businessName || "Martial Arts Academy"}</p>
          </div>
        </div>
        <div className="header-right">
          <p><strong>Date:</strong> {today}</p>
          <p><strong>Location:</strong> {settings?.locationAddress || "Main Location"}</p>
          <p><strong>Status:</strong> {status === "pending" ? "Pending Items" : "All Items"}</p>
        </div>
      </div>

      {!fulfillments || fulfillments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", fontSize: "16px", color: "#666" }}>
          No items to display for the selected status.
        </div>
      ) : (
        <>
          <table className="fulfillment-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Program</th>
                <th>Belt</th>
                <th>Item</th>
                <th>Size</th>
                <th className="checkbox-col">✓</th>
                <th className="signature-col">Signature</th>
              </tr>
            </thead>
            <tbody>
              {fulfillments.map((item, index) => (
                <tr key={index}>
                  <td>{item.studentFullName}</td>
                  <td>{item.program || "—"}</td>
                  <td>{item.beltRank || "—"}</td>
                  <td>{item.itemName}</td>
                  <td>{item.size || "—"}</td>
                  <td className="checkbox-col">
                    <span className="checkbox"></span>
                  </td>
                  <td className="signature-col">
                    <div className="signature-line"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>Check the box (✓) when item is physically handed to the student or parent</li>
              <li>Obtain signature from parent/guardian in the signature column</li>
              <li>After distribution, mark items as "Handed Out" in the system to send confirmation requests</li>
              <li>File this sheet for record-keeping and audit purposes</li>
            </ul>
          </div>

          <div className="footer">
            <p>Total Items: {fulfillments.length}</p>
            <p>Printed on {new Date().toLocaleString()}</p>
          </div>
        </>
      )}
    </div>
  );
}
