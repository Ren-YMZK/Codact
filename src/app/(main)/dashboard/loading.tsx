export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="mt-2 h-4 w-56 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="mt-8 flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="mt-1.5 h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-8 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="mt-4 h-2.5 w-full bg-gray-100 rounded-full animate-pulse" />
              <div className="mt-1.5 h-3 w-8 ml-auto bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
