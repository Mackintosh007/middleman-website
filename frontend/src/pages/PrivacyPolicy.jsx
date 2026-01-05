import PageWrapper from "../components/PageWrapper";
import SEO from "../components/SEO";

function PrivacyPolicy() {
  return (
    <PageWrapper>
      <SEO
        title="Privacy Policy | Middleman"
        description="Learn how Middleman protects and uses your personal information."
        url="https://middlemanng.com/privacy"
      />

      <h1 className="text-3xl font-bold mb-6">
        Privacy Policy
      </h1>

      <p className="text-gray-700 mb-4">
        Middleman respects your privacy and protects your personal data.
      </p>

      <ul className="space-y-3 text-gray-700 list-disc list-inside">
        <li>We collect name, email, phone number and transaction data</li>
        <li>We do not sell or share your data</li>
        <li>Data is used for transactions, security and support</li>
      </ul>
    </PageWrapper>
  );
}

export default PrivacyPolicy;
