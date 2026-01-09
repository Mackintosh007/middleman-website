import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function ServiceCard({ service }) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        const res = await api.get(`/service-images/${service.id}`);
        if (mounted && res.data.length > 0) {
          setImage(res.data[0].image_url);
        }
      } catch {}
    };

    loadImage();
    return () => (mounted = false);
  }, [service.id]);

  return (
    <Link
      to={`/services/${service.id}`}
      className="block border rounded-lg overflow-hidden bg-white hover:shadow-lg transition"
    >
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        <img
          src={image || "/no-image.png"}
          alt={service.category}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg">
          {service.category}
        </h3>

        <p className="text-sm text-gray-600">
          {service.location}
        </p>

        <p className="mt-2 text-sm text-gray-700 line-clamp-2">
          {service.description}
        </p>

        <p className="mt-3 text-xs text-gray-500">
          By {service.first_name}
        </p>
      </div>
    </Link>
  );
}

export default ServiceCard;
