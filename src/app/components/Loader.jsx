import React from "react";

const Loader = ({ text, size = "md", overlay = true, className = "" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute w-full h-full border-4 border-gray-200 rounded-full animate-spin"></div>
        <div className="absolute w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
      </div>
      {text && (
        <p
          className={`mt-4 ${
            overlay ? "text-white" : "text-gray-700"
          } text-sm font-medium`}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default Loader;
