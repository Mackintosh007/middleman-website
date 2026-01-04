import api from "../api/axios";

function EscrowModal({ property, onClose }) {
  const startEscrow = async () => {
    try {
      // 1️⃣ Create escrow order
      const orderRes = await api.post("/orders", {
        property_id: property.id,
      });

      const order = orderRes.data;

      // 2️⃣ Initiate Paystack payment
      const payRes = await api.post(
        `/orders/${order.id}/pay`
      );

      // 3️⃣ Redirect to Paystack
      window.location.href =
        payRes.data.authorization_url;
    } catch (err) {
      console.error(err);
      alert("Unable to start escrow payment");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Secure Escrow Checkout
        </h2>

        <p className="mb-2 font-semibold">
          {property.title}
        </p>
        <p className="mb-4">
          ₦{Number(property.price).toLocaleString()}
        </p>

        <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
          <li>Funds held securely</li>
          <li>Seller delivers item</li>
          <li>You confirm before release</li>
        </ul>

        <div className="flex gap-3">
          <button
            className="flex-1 bg-gray-300 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="flex-1 bg-green-600 text-white py-2 rounded"
            onClick={startEscrow}
          >
            Proceed to Escrow
          </button>
        </div>
      </div>
    </div>
  );
}

export default EscrowModal;
