import { Link } from "react-router-dom";

function PaymentSuccess() {
  return (
    <div className="max-w-xl mx-auto mt-20 text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        Payment Successful 🎉
      </h1>

      <p className="text-gray-600 mb-6">
        Your payment has been received and is securely held in escrow.
        The seller will now proceed with delivery.
      </p>

      <div className="flex justify-center gap-4">
        <Link
          to="/dashboard"
          className="bg-green-600 text-white px-6 py-3 rounded"
        >
          Go to Dashboard
        </Link>

        <Link
          to="/listings"
          className="bg-gray-200 px-6 py-3 rounded"
        >
          Browse Listings
        </Link>
      </div>
    </div>
  );
}

export default PaymentSuccess;
