const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: { type: String, unique: true },
  picture: String,
});

module.exports = mongoose.model('Users', usersSchema);
