function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-16 bg-white border rounded">
      <h3 className="text-lg font-semibold text-gray-800">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-gray-500 text-sm">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
