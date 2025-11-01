"use client";

interface LoadingSkeletonProps {
  type?: "card" | "list" | "table" | "text" | "custom";
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ 
  type = "card", 
  count = 1,
  className = "" 
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i}>
      {type === "card" && (
        <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 animate-pulse ${className}`}>
          <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          <div className="mt-6 h-10 bg-gray-200 rounded-lg w-1/3"></div>
        </div>
      )}
      {type === "list" && (
        <div className={`bg-white rounded-lg p-4 border border-gray-200 animate-pulse ${className}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}
      {type === "table" && (
        <div className={`bg-white rounded-lg p-4 border border-gray-200 animate-pulse ${className}`}>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      )}
      {type === "text" && (
        <div className={`space-y-2 animate-pulse ${className}`}>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      )}
      {type === "custom" && (
        <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`}></div>
      )}
    </div>
  ));

  if (type === "custom") {
    return <>{skeletons}</>;
  }

  return (
    <div className={type === "list" || type === "table" ? "space-y-3" : "space-y-6"}>
      {skeletons}
    </div>
  );
}

