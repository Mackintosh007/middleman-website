import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* ===============================
            BRAND
        =============================== */}
        <div>
          <h2 className="text-white text-xl font-bold mb-3">
            Middleman
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            A trusted marketplace for buying and selling properties,
            automobiles, gadgets, and equipment — with escrow protection
            and secure payments.
          </p>
        </div>

        {/* ===============================
            MARKETPLACE
        =============================== */}
        <div>
          <h3 className="text-white font-semibold mb-3">
            Marketplace
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/properties" className="hover:text-white">
                Browse Listings
              </Link>
            </li>
            <li>
              <Link to="/create-property" className="hover:text-white">
                Sell an Item
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-white">
                Seller Dashboard
              </Link>
            </li>
            <li>
              <Link to="/wallet" className="hover:text-white">
                Wallet & Withdrawals
              </Link>
            </li>
          </ul>
        </div>

        {/* ===============================
            TRUST & SUPPORT
        =============================== */}
        <div>
          <h3 className="text-white font-semibold mb-3">
            Trust & Support
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/how-escrow-works" className="hover:text-white">
                How Escrow Works
              </Link>
            </li>
            <li>
              <Link to="/seller-guidelines" className="hover:text-white">
                Seller Guidelines
              </Link>
            </li>
            <li>
              <Link to="/trust-support" className="hover:text-white">
                Trust & Support
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-white">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* ===============================
            CONTACT
        =============================== */}
        <div>
          <h3 className="text-white font-semibold mb-3">
            Contact
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/contact" className="hover:text-white">
                📧 support@middleman.com
              </Link>
            </li>
            <li>
              📞 +234 9036997745
            </li>
            <li>
              <Link to="/contact" className="hover:text-white">
                💬 WhatsApp Support
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* ===============================
          BOTTOM BAR
      =============================== */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} Middleman. All rights reserved.
          </p>

          <p className="mt-2 md:mt-0">
            Built with security, escrow & trust in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
