import { trpc } from '@/lib/trpc';

export default function TestBrand() {
  const { data, isLoading, error } = trpc.setupWizard.getBrand.useQuery();

  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-bold mb-4">Test Brand Query</h1>
      
      <div className="space-y-4">
        <div>
          <strong>isLoading:</strong> {String(isLoading)}
        </div>
        
        <div>
          <strong>error:</strong> {error ? JSON.stringify(error, null, 2) : 'null'}
        </div>
        
        <div>
          <strong>data:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
