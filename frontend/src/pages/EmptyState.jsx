import { Link } from "react-router-dom";

function EmptyState({ title, message, actionText, actionLink }) {
  return (
    <div className="text-center py-20">
      <h3 className="text-xl font-semibold mb-2">
        {title}
      </h3>

      <p className="text-gray-500 mb-6">
        {message}
      </p>

      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}

export default EmptyState;
