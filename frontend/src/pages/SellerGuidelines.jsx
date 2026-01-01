import PageWrapper from "../components/PageWrapper";

function SellerGuidelines() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Seller Guidelines
        </h1>

        <p className="text-gray-600 mb-8">
          To keep Middleman safe and trusted, sellers must follow these rules.
        </p>

        <ul className="space-y-4 list-disc list-inside text-gray-700">
          <li>
            List only items you legally own or are authorized to sell.
          </li>
          <li>
            Provide accurate titles, prices, and descriptions.
          </li>
          <li>
            Upload clear and original images (no stolen photos).
          </li>
          <li>
            Deliver items promptly after payment confirmation.
          </li>
          <li>
            Do not request off-platform payments.
          </li>
          <li>
            Respond promptly to buyers and admins.
          </li>
        </ul>

        <div className="mt-10 p-5 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">
            ⚠️ Violations may lead to listing removal, suspension,
            or permanent account bans.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}

export default SellerGuidelines;
