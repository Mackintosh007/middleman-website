import PageWrapper from "../components/PageWrapper";

function HowEscrowWorks() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          How Escrow Works
        </h1>

        <p className="text-gray-600 mb-8">
          Escrow protects both buyers and sellers by ensuring
          that money is only released when delivery is confirmed.
        </p>

        <div className="space-y-6">
          <Step
            number="1"
            title="Buyer Makes Payment"
            desc="The buyer pays securely through Middleman. Funds are held safely in escrow."
          />

          <Step
            number="2"
            title="Seller Ships or Delivers"
            desc="The seller delivers the item or property as agreed."
          />

          <Step
            number="3"
            title="Buyer Confirms Delivery"
            desc="Once the buyer confirms everything is okay, the transaction proceeds."
          />

          <Step
            number="4"
            title="Funds Released to Seller"
            desc="Money is released to the seller’s wallet, minus platform fees."
          />
        </div>

        <div className="mt-10 p-5 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 text-sm">
            ✅ Escrow prevents fraud, fake sellers, and payment disputes.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}

function Step({ number, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-gray-600 text-sm">{desc}</p>
      </div>
    </div>
  );
}

export default HowEscrowWorks;
