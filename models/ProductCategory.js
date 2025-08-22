const mongoose = require('mongoose');

const productcategorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  image: String,
  toplist: Boolean,
  topicon: String,
  topbanner: String,
  topbannerbottom: String,
}, {
  timestamps: true
});
module.exports = mongoose.model('ProductCategory', productcategorySchema);
