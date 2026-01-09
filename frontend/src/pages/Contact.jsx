import PageWrapper from "../components/PageWrapper";
import SEO from "../components/SEO";

function Contact() {
  return (
    <PageWrapper>
      <SEO
        title="Contact Us | Middleman"
        description="Contact Middleman support via email, phone or WhatsApp."
        url="https://middlemanng.com/contact"
      />

      <h1 className="text-3xl font-bold mb-6">
        Contact Us
      </h1>

      <p className="text-gray-700 mb-4">
        Need help or have questions? Reach out to us.
      </p>

      <ul className="space-y-3 text-gray-700">
        <li>
          📧 Email:{" "}
          <a
            href="mailto:support@middleman.com"
            className="text-blue-600 underline"
          >
            support@middleman.com
          </a>
        </li>

        <li>
          📞 Phone:{" "}
          <a
            href="tel:+2349036997745"
            className="text-blue-600 underline"
          >
            +234 903 699 7745
          </a>
        </li>

        <li>
          💬 WhatsApp:{" "}
          <a
            href="https://wa.me/2349036997745?text=Hello%20Middleman%20Support,%20I%20need%20help"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 underline font-semibold"
          >
            Chat with us on WhatsApp
          </a>
        </li>
      </ul>
    </PageWrapper>
  );
}

export default Contact;
