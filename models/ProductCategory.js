const mongoose = require('mongoose');

const productcategorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  size: String,
  image: String,
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductCategory', productcategorySchema);
