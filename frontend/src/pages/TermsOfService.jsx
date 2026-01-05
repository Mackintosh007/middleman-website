import PageWrapper from "../components/PageWrapper";
import SEO from "../components/SEO";

function TermsOfService() {
  return (
    <PageWrapper>
      <SEO
        title="Terms of Service | Middleman"
        description="Read Middleman's terms of service and usage agreement."
        url="https://middlemanng.com/terms"
      />

      <h1 className="text-3xl font-bold mb-6">
        Terms of Service
      </h1>

      <p className="text-gray-700 mb-4">
        Middleman acts as an escrow intermediary between buyers and sellers.
      </p>

      <ul className="space-y-3 text-gray-700 list-disc list-inside">
        <li>Users are responsible for their transactions</li>
        <li>Escrow decisions are final after release</li>
        <li>Fraud or abuse may result in account termination</li>
        <li>By using Middleman, you agree to these terms</li>
      </ul>
    </PageWrapper>
  );
}

export default TermsOfService;
