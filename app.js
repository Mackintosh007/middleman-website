const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const walletRoutes = require("./routes/wallet");
const withdrawalRoutes = require("./routes/withdrawals");


app.use(cors());
app.use(express.json());

// Load Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/agents", require("./routes/agents"));
app.use("/api/properties", require("./routes/properties"));
// special details
app.use("/api/details/land", require("./routes/details/land"));
app.use("/api/details/house", require("./routes/details/house"));
app.use("/api/details/apartment", require("./routes/details/apartment"));
app.use("/api/details/car", require("./routes/details/car"));
app.use("/api/details/gadget", require("./routes/details/gadget"));
app.use("/api/details/others", require("./routes/details/others"));
app.use("/api/images", require("./routes/images"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/ownership", require("./routes/ownership"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/seller-requests", require("./routes/sellerRequests"));
app.use("/api/inquiries", require("./routes/inquiries"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/otp", require("./routes/otp"));
app.use("/wallet", require("./routes/wallet"));
app.use("/api/admin", require("./routes/adminWithdrawals"));
app.use("/kyc", require("./routes/kyc"));
app.use("/admin", require("./routes/adminKyc"));
app.use("/bank", require("./routes/bankVerification"));
app.use("/api/wallet", walletRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/uploads", express.static("uploads"));



const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
