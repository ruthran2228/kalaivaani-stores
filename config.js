// Supabase configuration (public anon key — safe to share, RLS protects writes)
const SUPABASE_URL = "https://fslmgjqumvfsicmjwgmx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbG1nanF1bXZmc2ljbWp3Z214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NDg2NTcsImV4cCI6MjEwMjQyNDY1N30.PrLd5maKys7nm8Kf3vovdjjMLBazmWML5XETVJS7uNs";

// UPI payment (public — shown in the order confirmation QR)
// PREFERRED (guaranteed to work): use the shop's own "Receive money" QR.
//  1. Open any UPI app → tap "Receive money" / "My QR"
//  2. Screenshot the QR and save it as  upi-qr.png  (in the same folder as index.html)
//  3. Upload upi-qr.png when you upload the site
const UPI_QR_IMAGE = "upi-qr.png";   // ← set to the shop's own QR image file
const UPI_QR_AMOUNT_NOTE = "Open any UPI app and scan this QR to pay the exact order amount.";

// Fallback when UPI_QR_IMAGE is unavailable — a generated QR from this VPA.
// If payments from this VPA fail (e.g. "limit" errors), leave UPI_QR_IMAGE
// pointing at the shop's own QR screenshot above instead of relying on this.
const UPI_ID = "sskrohit143-3@oksbi";                        // ← your UPI VPA
const STORE_UPI_NAME = "Kalaivani Stores";
