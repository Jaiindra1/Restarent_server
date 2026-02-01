const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true
        },
        quantity: {
          type: Number,
          required: true
        },
        price: {
          type: Number,
          required: true
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"],
      default: "Pending"
    },
    customerName: String,
    tableNumber: Number
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    this.orderNumber = "ORD-" + Date.now();
  }
});

module.exports = mongoose.model("Order", orderSchema);
