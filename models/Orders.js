const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  size: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
});

const ordersSchema = new mongoose.Schema({
  orderId: { type: String, unique: true }, // You can generate something like ORD12345
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // customer reference
  items: [orderItemSchema], // multiple products per order
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"], 
    default: "pending" 
  },
  paymentMethod: { type: String, enum: ["cash", "card", "upi"], default: "cod" },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Orders', ordersSchema);
