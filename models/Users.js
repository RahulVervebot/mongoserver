const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: { type: String, unique: true },
 usernmae: { type: String, unique: true },
  picture: String,
  password: String,
  resetPasswordToken: String,
  role: String,
  resetPasswordExpires: Date
});

module.exports = mongoose.model('Users', usersSchema);
