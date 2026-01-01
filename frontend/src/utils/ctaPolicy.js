export function getCtaType(propertyType) {
  /**
   * WhatsApp-based negotiation listings
   */
  const whatsappCategories = [
    "land",
    "house",
    "apartment",
    "car" // Automobile
  ];

  /**
   * Escrow-based fixed-price listings
   */
  const escrowCategories = [
    "gadget_equipment",
    "others"
  ];

  if (whatsappCategories.includes(propertyType)) {
    return "whatsapp";
  }

  if (escrowCategories.includes(propertyType)) {
    return "escrow";
  }

  return null;
}
