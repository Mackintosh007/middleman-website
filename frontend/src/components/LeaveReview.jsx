import { useState } from "react";
import api from "../api/axios";

function LeaveReview({ orderId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      await api.post("/reviews", {
        order_id: orderId,
        rating,
        comment
      });
      onSuccess();
    } catch (err) {
      setError("Failed to submit review");
    }
  };

  return (
    <div className="border p-4 rounded mt-4">
      <h3 className="font-semibold mb-2">Leave a Review</h3>

      {error && <p className="text-red-600">{error}</p>}

      <select
        className="input mb-2"
        value={rating}
        onChange={e => setRating(Number(e.target.value))}
      >
        {[5,4,3,2,1].map(n => (
          <option key={n} value={n}>{n} Stars</option>
        ))}
      </select>

      <textarea
        className="input mb-3"
        placeholder="Optional comment"
        onChange={e => setComment(e.target.value)}
      />

      <button
        onClick={submit}
        className="btn-primary"
      >
        Submit Review
      </button>
    </div>
  );
}

export default LeaveReview;
