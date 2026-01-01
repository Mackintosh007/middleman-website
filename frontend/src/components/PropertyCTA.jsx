import WhatsAppInterestButton from "./WhatsAppCTA";
import EscrowBuyButton from "./EscrowBuyButton";
import { getCtaType } from "../utils/ctaPolicy";

function PropertyCTA({ property }) {
  const ctaType = getCtaType(property.property_type);

  if (ctaType === "whatsapp") {
    return <WhatsAppInterestButton property={property} />;
  }

  if (ctaType === "escrow") {
    return <EscrowBuyButton property={property} />;
  }

  return null;
}

export default PropertyCTA;
