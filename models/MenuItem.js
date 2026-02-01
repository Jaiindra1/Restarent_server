const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    description: {
      type: String
    },
    category: {
      type: String,
      required: true,
      enum: ["Appetizer", "Main Course", "Dessert", "Beverage"]
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    ingredients: [
      {
        type: String
      }
    ],
    isAvailable: {
      type: Boolean,
      default: true
    },
    preparationTime: {
      type: Number
    },
    imageUrl: {
      type: String
    },
    stock: {
      type: Number,
      default: 100,
      min: 0
    }
  },
  { timestamps: true }
);

// Text index for search
menuItemSchema.index({ name: "text", ingredients: "text" });

module.exports = mongoose.model("MenuItem", menuItemSchema);
