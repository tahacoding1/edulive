const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room:    { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, required: true, trim: true },
  type:    { type: String, enum: ['text', 'system'], default: 'text' },
}, { timestamps: true });

messageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
