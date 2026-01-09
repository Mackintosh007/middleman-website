import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import SEO from "../components/SEO";
import { whatsappLink, callLink } from "../utils/contactLinks";
import { useAuth } from "../context/AuthContext"; // ✅ ADD

function ServiceProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ ADD

  const [service, setService] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ⭐ rating state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchService = async () => {
      try {
        const res = await api.get(`/services/${id}`);

        if (!mounted) return;

        setService(res.data);
        setImages(res.data.images || []);
      } catch (err) {
        console.error(err);

        if (err.response?.status === 404) {
          navigate("/services", { replace: true });
          return;
        }

        setError("Failed to load service");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchService();
    return () => (mounted = false);
  }, [id, navigate]);

  if (loading) {
    return (
      <PageWrapper>
        <p>Loading service...</p>
      </PageWrapper>
    );
  }

  if (error || !service) {
    return (
      <PageWrapper>
        <p className="text-red-600">{error || "Service not found"}</p>
      </PageWrapper>
    );
  }

  const whatsappUrl = whatsappLink(
    service.whatsapp,
    `Hello, I found your service on Middleman`
  );
  const callUrl = callLink(service.phone);

  // ⭐ rating helpers
  const avgRating = service.rating?.average_rating;
  const totalReviews = service.rating?.total_reviews || 0;

  const isVerifiedProvider =
    service.status === "active" && totalReviews >= 3;

  // 🚫 PREVENT SELF-REVIEW
  const isOwner =
    user && Number(user.id) === Number(service.user_id);

  const submitReview = async () => {
    try {
      setReviewSubmitting(true);
      setReviewError("");

      await api.post(`/services/${service.id}/review`, {
        rating,
        comment
      });

      setReviewSuccess(true);

      const res = await api.get(`/services/${id}`);
      setService(res.data);
    } catch (err) {
      setReviewError(
        err.response?.data?.error || "Failed to submit review"
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <SEO
        title={`${service.category} in ${service.location} | Middleman`}
        description={service.description?.slice(0, 150)}
        url={`https://middlemanng.com/services/${service.id}`}
      />

      <div className="max-w-4xl mx-auto">
        {/* IMAGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {images.length === 0 && (
            <div className="h-64 bg-gray-100 flex items-center justify-center rounded">
              <span className="text-gray-400">
                No images available
              </span>
            </div>
          )}

          {images.map((img, idx) => (
            <div
              key={idx}
              className="h-64 bg-gray-100 flex items-center justify-center rounded overflow-hidden"
            >
              <img
                src={img.image_url}
                alt={service.category}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* DETAILS */}
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {service.category}

          {isVerifiedProvider && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              ✔ Verified Provider
            </span>
          )}
        </h1>

        <p className="mt-2 text-gray-600">
          📍 {service.location}
        </p>

        <div className="mt-2 text-sm text-gray-700">
          {totalReviews > 0 ? (
            <>
              ⭐ {avgRating} / 5 · {totalReviews} review
              {totalReviews > 1 ? "s" : ""}
            </>
          ) : (
            <span className="text-gray-400">
              No reviews yet
            </span>
          )}
        </div>

        <p className="mt-4 text-gray-700">
          {service.description}
        </p>

        <div className="mt-6 space-y-2">
          <p>
            <strong>Provider:</strong>{" "}
            {service.first_name || "Verified Provider"}
          </p>

          <p>
            <strong>Email:</strong> {service.email}
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-8 flex gap-4">
          <a
            href={callUrl}
            className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
          >
            📞 Call
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded"
          >
            💬 WhatsApp
          </a>
        </div>

        {/* ⭐ LEAVE REVIEW (HIDDEN FOR OWNER) */}
        {!isOwner && (
          <div className="mt-10 border-t pt-6">
            <h3 className="font-semibold mb-2">
              Rate this service
            </h3>

            {reviewError && (
              <p className="text-red-600 mb-2">
                {reviewError}
              </p>
            )}

            {reviewSuccess ? (
              <p className="text-green-600">
                Thank you for your review!
              </p>
            ) : (
              <>
                <select
                  className="input mb-2"
                  value={rating}
                  onChange={(e) =>
                    setRating(Number(e.target.value))
                  }
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} Stars
                    </option>
                  ))}
                </select>

                <textarea
                  className="input mb-3"
                  placeholder="Optional comment"
                  value={comment}
                  onChange={(e) =>
                    setComment(e.target.value)
                  }
                />

                <button
                  onClick={submitReview}
                  disabled={reviewSubmitting}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {reviewSubmitting
                    ? "Submitting..."
                    : "Submit Review"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default ServiceProfile;
