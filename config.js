// Supabase configuration (public anon key — safe to share, RLS protects writes)
const SUPABASE_URL = "https://fslmgjqumvfsicmjwgmx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzbG1nanF1bXZmc2ljbWp3Z214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NDg2NTcsImV4cCI6MjEwMjQyNDY1N30.PrLd5maKys7nm8Kf3vovdjjMLBazmWML5XETVJS7uNs";

// UPI payment (public — shown in the order confirmation QR)
// Replace with the UPI VPA linked to the shop's bank account, e.g. 7667771101@ybl
const UPI_ID = "sskrohit143-2@okicici";                        // ← fill this with your UPI VPA
const STORE_UPI_NAME = "Kalaivani Stores";
