export default function SectionLoader() {
  return (
    <div className="bg-gray-50 p-6 rounded-lg animate-pulse">
      <div className="h-6 bg-gray-300 rounded mb-6 w-1/3"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-10 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-10 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-20 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}