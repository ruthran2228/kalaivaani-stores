// Supabase configuration (public anon key — safe to share, RLS protects writes)
const SUPABASE_URL = "https://fslmgjqumvfsicmjwgmx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbG1nanF1bXZmc2ljbWp3Z214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NDg2NTcsImV4cCI6MjEwMjQyNDY1N30.PrLd5maKys7nm8Kf3vovdjjMLBazmWML5XETVJS7uNs";

// UPI payment (public — shown in the order confirmation QR)
// Replace with the UPI VPA linked to the shop's bank account, e.g. 7667771101@ybl
const UPI_ID = "sskrohit143-3@oksbi";                        // ← your UPI VPA
const STORE_UPI_NAME = "Kalaivani Stores";

// Your own "Receive money" QR image (guaranteed to work).
// Upload the screenshot as upi-qr.png next to these files, then:
const UPI_QR_IMAGE = "";        // ← leave as upi-qr.png (or "" to disabled and use UPI_ID)
const UPI_QR_AMOUNT_NOTE = "Show this QR at any UPI app to pay the order amount.";
