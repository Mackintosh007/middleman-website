/**
 * Normalize Nigerian phone numbers and generate contact links
 */

export function normalizePhone(phone) {
  if (!phone) return "";

  // remove spaces, +, dashes
  let cleaned = phone.replace(/[^\d]/g, "");

  // convert 080 / 070 / 090 → 234
  if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.slice(1);
  }

  return cleaned;
}

export function whatsappLink(phone, message = "") {
  const number = normalizePhone(phone);
  const text = encodeURIComponent(message);
  return `https://wa.me/${number}${text ? `?text=${text}` : ""}`;
}

export function callLink(phone) {
  return `tel:${phone}`;
}
