import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";

function SellerProfile() {
  const { id } = useParams();

  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Seller info + listings
        const sellerRes = await api.get(`/users/seller/${id}`);
        setSeller(sellerRes.data.seller);
        setListings(sellerRes.data.listings);

        // Reviews + stats
        const reviewsRes = await api.get(`/reviews/${id}`);
        setReviews(reviewsRes.data.reviews);
        setStats(reviewsRes.data.stats);
      } catch (err) {
        console.error("Failed to load seller profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  if (loading) {
    return <PageWrapper>Loading seller profile...</PageWrapper>;
  }

  if (!seller) {
    return <PageWrapper>Seller not found.</PageWrapper>;
  }

  return (
    <PageWrapper>
      {/* ===============================
          SELLER INFO
      =============================== */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">
          {seller.first_name} {seller.last_name}
        </h1>

        {seller.verified && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
            ✅ Verified Seller
          </span>
        )}
      </div>

      <p className="text-gray-600 capitalize mt-1">
        {seller.role.replace("_", " ")}
      </p>

      {seller.location && (
        <p className="text-gray-500">{seller.location}</p>
      )}

      {/* ===============================
          RATINGS & TRUST
      =============================== */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <p className="font-semibold">
          ⭐ {stats?.average_rating || "No rating yet"}
        </p>
        <span className="text-gray-500">
          ({stats?.total_reviews || 0} reviews)
        </span>
      </div>

      <div className="mt-2 flex gap-2 flex-wrap">
        {stats?.average_rating >= 4.5 && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
            Top Rated
          </span>
        )}

        {stats?.total_reviews >= 5 && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
            Trusted Seller
          </span>
        )}

        {seller.role === "agent" && (
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
            Verified Agent
          </span>
        )}

        {!seller.verified && (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
            Unverified
          </span>
        )}
      </div>

      {/* ===============================
          LISTINGS
      =============================== */}
      <h2 className="text-xl font-semibold mt-8 mb-4">
        Listings by this seller
      </h2>

      {listings.length === 0 ? (
        <p className="text-gray-600">No active listings.</p>
      ) : (
        <div className="space-y-4">
          {listings.map(property => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="block border p-4 rounded hover:bg-gray-50"
            >
              <h3 className="font-semibold">{property.title}</h3>
              <p className="text-gray-600">{property.location}</p>
              <p className="font-semibold mt-1">
                ₦{Number(property.price).toLocaleString()}
              </p>
              <p className="text-sm capitalize text-gray-500">
                {property.property_type}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* ===============================
          REVIEWS
      =============================== */}
      <h2 className="text-xl font-semibold mt-10 mb-4">
        Customer Reviews
      </h2>

      {reviews.length === 0 ? (
        <p className="text-gray-600">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="border p-4 rounded">
              <p className="font-semibold">{r.first_name}</p>
              <p>⭐ {r.rating}</p>
              {r.comment && (
                <p className="text-gray-600 mt-1">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export default SellerProfile;
