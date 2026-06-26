const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  isUser: { type: Boolean, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  messages: [chatMessageSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);
