const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  size: String,
  image: String,
  price: { type: Number, required: true },
  sale: { type: Boolean, default: false },
  category: String,
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
