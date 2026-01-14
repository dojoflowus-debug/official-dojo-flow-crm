import { trpc } from "@/lib/trpc";

export default function TestData() {
  const dashboardStats = trpc.dashboard.stats.useQuery();
  const kioskCheckIns = trpc.kiosk.checkIns.useQuery();
  
  return (
    <div className="p-8 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">tRPC Data Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Dashboard Stats Query</h2>
        <div className="mb-2">
          <strong>Loading:</strong> {dashboardStats.isLoading ? 'Yes' : 'No'}
        </div>
        <div className="mb-2">
          <strong>Error:</strong> {dashboardStats.isError ? JSON.stringify(dashboardStats.error) : 'None'}
        </div>
        <div className="mb-2">
          <strong>Data:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
            {JSON.stringify(dashboardStats.data, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Kiosk Check-Ins Query</h2>
        <div className="mb-2">
          <strong>Loading:</strong> {kioskCheckIns.isLoading ? 'Yes' : 'No'}
        </div>
        <div className="mb-2">
          <strong>Error:</strong> {kioskCheckIns.isError ? JSON.stringify(kioskCheckIns.error) : 'None'}
        </div>
        <div className="mb-2">
          <strong>Data:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
            {JSON.stringify(kioskCheckIns.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
