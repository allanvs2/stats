export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>

          {/* Club cards skeleton */}
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6">
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-10 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}