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
        <li>📧 Email: support@middleman.com</li>
        <li>📞 Phone: +234 903 699 7745</li>
        <li>💬 WhatsApp Support available during business hours</li>
      </ul>
    </PageWrapper>
  );
}

export default Contact;
