const express = require("express");
const Order = require("../models/order");
const MenuItem = require("../models/MenuItem");
const router = express.Router();


// ✅ TOP ITEMS (place BEFORE /:id)/ 
// l
router.get("/top-items", async (req, res, next) => {
  try {
    const result = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItem",
          totalSold: { $sum: "$items.quantity" }
        }
      },
      {
        $lookup: {
          from: "menuitems",
          localField: "_id",
          foreignField: "_id",
          as: "menuItem"
        }
      },
      { $unwind: "$menuItem" },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET orders with pagination + status filter
router.get("/", async (req, res, next) => {
  try {
    const { status, page = 1, limit = 5 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("items.menuItem")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET single order (populate)
router.get("/:id", async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.menuItem");
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ✅ CREATE order (with validation + stock update)
router.post("/", async (req, res, next) => {
  try {
    const { items, customerName, tableNumber } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain items" });
    }

    let totalAmount = 0;

    for (let item of items) {
      const menu = await MenuItem.findById(item.menuItem);

      if (!menu) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      if (menu.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${menu.name}`
        });
      }

      item.price = menu.price; // set price automatically
      totalAmount += menu.price * item.quantity;

      menu.stock -= item.quantity;
      await menu.save();
    }

    const order = await Order.create({
      items,
      totalAmount,
      customerName,
      tableNumber,
      status: "Pending"
    });

    res.status(201).json(order);

  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: err.message });
  }
});



// ✅ UPDATE order status (with validation)
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowedStatus = ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
