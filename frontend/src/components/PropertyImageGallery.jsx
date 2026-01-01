import { useState } from "react";

function PropertyImageGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded mb-6">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Main Image */}
      <div className="w-full h-80 mb-4 rounded overflow-hidden bg-gray-100">
        <img
          src={images[activeIndex].image_url}
          alt="Property"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-3 overflow-x-auto">
        {images.map((img, index) => (
          <button
            key={img.id}
            onClick={() => setActiveIndex(index)}
            className={`w-24 h-16 rounded overflow-hidden border-2 ${
              index === activeIndex
                ? "border-blue-600"
                : "border-transparent"
            }`}
          >
            <img
              src={img.image_url}
              alt="Thumbnail"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default PropertyImageGallery;
