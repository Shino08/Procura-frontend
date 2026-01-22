import { Link } from "react-router-dom";

export const Breadcrumb = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center space-x-2 text-sm">
          {items.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && <span className="text-gray-400">/</span>}
              {item.to ? (
                <Link
                  to={item.to}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={item.active ? "text-gray-900 font-medium" : "text-gray-700"}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
