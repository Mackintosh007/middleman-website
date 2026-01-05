import PageWrapper from "../components/PageWrapper";
import SEO from "../components/SEO";

function TrustAndSupport() {
  return (
    <PageWrapper>
      <SEO
        title="Trust & Support | Middleman"
        description="Learn how Middleman protects users with escrow, verification and support."
        url="https://middlemanng.com/trust-support"
      />

      <h1 className="text-3xl font-bold mb-6">
        Trust & Support
      </h1>

      <ul className="space-y-4 text-gray-700 list-disc list-inside">
        <li>Escrow-protected payments</li>
        <li>Verified sellers</li>
        <li>Admin dispute support</li>
        <li>Auto-release protection</li>
        <li>Wallet-based payouts</li>
      </ul>

      <p className="mt-6 text-gray-700">
        Our support team is always available to assist you
        with any issues or questions.
      </p>
    </PageWrapper>
  );
}

export default TrustAndSupport;
