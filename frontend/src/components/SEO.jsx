import { Helmet } from "react-helmet-async";

function SEO({
  title = "Middleman | Secure Marketplace with Escrow",
  description = "Buy, sell and trade securely on Middleman with escrow protection across Omoku and ONELGA.",
  url = "https://middlemanng.com",
}) {
  return (
    <Helmet>
      {/* Primary Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph (Facebook, WhatsApp) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}

export default SEO;
