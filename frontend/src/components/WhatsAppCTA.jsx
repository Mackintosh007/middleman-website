function WhatsAppCTA({ property }) {
  const phone = "2349036997745"; // no +, no spaces

  const message = encodeURIComponent(
    `Hello, I'm interested in this property:

${property.title}
📍 ${property.location}
💰 ₦${Number(property.price).toLocaleString()}

View link:
${window.location.href}
`
  );

  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center w-full mt-6 px-4 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
    >
      Contact on WhatsApp
    </a>
  );
}

export default WhatsAppCTA;
