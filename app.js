const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cron = require("node-cron");
const autoReleaseEscrow = require("./jobs/autoReleaseEscrow");

// ⏱ Runs every 15 minutes
cron.schedule("*/15 * * * *", autoReleaseEscrow);


app.use(cors());
app.use(express.json());

// Core Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/agents", require("./routes/agents"));
app.use("/api/properties", require("./routes/properties"));

// Property Details
app.use("/api/details/land", require("./routes/details/land"));
app.use("/api/details/house", require("./routes/details/house"));
app.use("/api/details/apartment", require("./routes/details/apartment"));
app.use("/api/details/car", require("./routes/details/car"));
app.use("/api/details/gadget", require("./routes/details/gadget"));
app.use("/api/details/others", require("./routes/details/others"));

// Media
app.use("/api/images", require("./routes/images"));
app.use("/uploads", express.static("uploads"));

// Auth & Users
app.use("/api/auth", require("./routes/auth"));
app.use("/api/seller-requests", require("./routes/sellerRequests"));
app.use("/api/otp", require("./routes/otp"));

// Marketplace
app.use("/api/orders", require("./routes/orders"));
app.use("/api/ownership", require("./routes/ownership"));
app.use("/api/inquiries", require("./routes/inquiries"));
app.use("/api/reviews", require("./routes/reviews"));

// Wallet & Payments
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/withdrawals", require("./routes/withdrawals"));
app.use("/api/bank", require("./routes/bankVerification"));
app.use("/api/kyc", require("./routes/kyc"));
app.use("/api/webhook", require("./routes/paystackWebhook"));


// Admin
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/withdrawals", require("./routes/adminWithdrawals"));
app.use("/api/admin/kyc", require("./routes/adminKyc"));
app.use("/api/admin/seller-requests", require("./routes/adminSellerRequests"));


const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
