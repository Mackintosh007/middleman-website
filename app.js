const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cron = require("node-cron");

const autoReleaseEscrow = require("./jobs/autoReleaseEscrow");
const auditLogsRouter = require("./routes/adminAuditLogs");


// ⏱ Runs every 15 minutes
cron.schedule("*/15 * * * *", autoReleaseEscrow);

app.use(cors());
app.use(express.json());

/* ===============================
   CORE ROUTES
=============================== */
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/agents", require("./routes/agents"));
app.use("/api/properties", require("./routes/properties"));

/* ===============================
   PROPERTY DETAILS
=============================== */
app.use("/api/details/land", require("./routes/details/land"));
app.use("/api/details/house", require("./routes/details/house"));
app.use("/api/details/apartment", require("./routes/details/apartment"));
app.use("/api/details/car", require("./routes/details/car"));
app.use("/api/details/gadget", require("./routes/details/gadget"));
app.use("/api/details/others", require("./routes/details/others"));

/* ===============================
   MEDIA
=============================== */
app.use("/api/images", require("./routes/images"));
app.use("/uploads", express.static("uploads"));

/* ===============================
   USER FLOWS
=============================== */
app.use("/api/seller-requests", require("./routes/sellerRequests"));
app.use("/api/otp", require("./routes/otp"));
app.use("/api/ownership", require("./routes/ownership"));
app.use("/api/inquiries", require("./routes/inquiries"));
app.use("/api/reviews", require("./routes/reviews"));

/* ===============================
   MARKETPLACE
=============================== */
app.use("/api/orders", require("./routes/orders"));

/* ===============================
   WALLET & PAYMENTS
=============================== */
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/withdrawals", require("./routes/withdrawals"));
app.use("/api/bank", require("./routes/bankVerification"));
app.use("/api/kyc", require("./routes/kyc"));
app.use("/api/webhook", require("./routes/paystackWebhook"));


/* ===============================
   ADMIN (GROUPED CLEANLY)
=============================== */
app.use("/api/admin", require("./routes/admin"));          // dashboard / guards
app.use("/api/admin", require("./routes/adminStats"));     // stats
app.use("/api/admin", require("./routes/adminUsers"));     // user mgmt
app.use("/api/admin/withdrawals", require("./routes/adminWithdrawals"));
app.use("/api/admin/kyc", require("./routes/adminKyc"));
app.use("/api/admin/audit-logs", auditLogsRouter);

/* ===============================
   SERVER
=============================== */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
