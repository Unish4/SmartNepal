import { Link } from "react-router-dom";
import { MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

const HomePage = () => {
  return (
    <div className="flex flex-col items-center text-center py-20 gap-6">
      {/* Icon */}
      <div className="bg-green-50 p-4 rounded-2xl">
        <MapPin size={40} className="text-green-600" />
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-3">
          SmartNepal
        </h1>
        <p className="text-gray-500 text-lg max-w-md">
          Report civic issues in your community. Help your municipality fix what
          matters most.
        </p>
      </div>

      {/* Feature pills — just visual, not functional yet */}
      <div className="flex gap-3 flex-wrap justify-center">
        <span className="flex items-center gap-1.5 text-sm bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full">
          <AlertCircle size={14} />
          Report issues
        </span>
        <span className="flex items-center gap-1.5 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
          <CheckCircle2 size={14} />
          Track progress
        </span>
      </div>

      {/* CTAs */}
      <div className="flex gap-3">
        <Link
          to="/issues/new"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Report an issue
        </Link>
        <Link
          to="/issues"
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View issues
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
