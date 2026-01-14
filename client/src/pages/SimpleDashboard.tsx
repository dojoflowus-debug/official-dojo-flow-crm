import { trpc } from "@/lib/trpc";

export default function SimpleDashboard() {
  const statsQuery = trpc.dashboard.stats.useQuery();
  const checkInsQuery = trpc.kiosk.checkIns.useQuery();

  console.log("=== SimpleDashboard Debug ===");
  console.log("Stats Query:", {
    status: statsQuery.status,
    isLoading: statsQuery.isLoading,
    isError: statsQuery.isError,
    error: statsQuery.error,
    data: statsQuery.data,
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Simple Dashboard (tRPC Debug)
        </h1>

        {/* Query Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">tRPC Query Status</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {statsQuery.status}</p>
            <p><strong>Loading:</strong> {statsQuery.isLoading ? "Yes" : "No"}</p>
            <p><strong>Error:</strong> {statsQuery.isError ? statsQuery.error?.message : "None"}</p>
            <p><strong>Has Data:</strong> {statsQuery.data ? "Yes" : "No"}</p>
          </div>
        </div>

        {/* Raw Data Display */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Raw Query Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(statsQuery.data, null, 2)}
          </pre>
        </div>

        {/* Stats Display */}
        {statsQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Total Students
              </h3>
              <p className="text-4xl font-bold text-blue-600">
                {statsQuery.data.studentCount}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Monthly Revenue
              </h3>
              <p className="text-4xl font-bold text-green-600">
                ${statsQuery.data.revenue}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Active Leads
              </h3>
              <p className="text-4xl font-bold text-purple-600">
                {statsQuery.data.leadCount}
              </p>
            </div>
          </div>
        )}

        {/* Check-ins Display */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Check-Ins Today</h2>
          <p className="text-3xl font-bold text-blue-600">
            {checkInsQuery.data?.length ?? 0}
          </p>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-4">
            {JSON.stringify(checkInsQuery.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
