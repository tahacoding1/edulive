const mongoose = require('mongoose');

function genRoomId() {
  const s = () => Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${s()}-${s()}`;
}
function genPassword() {
  const ch = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789@#$!';
  return Array.from({ length: 10 }, () => ch[Math.floor(Math.random() * ch.length)]).join('');
}

const roomSchema = new mongoose.Schema({
  roomId:    { type: String, unique: true, default: genRoomId },
  password:  { type: String, default: genPassword },
  name:      { type: String, required: true, trim: true },
  teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive:  { type: Boolean, default: true },
  settings: {
    allowChat:       { type: Boolean, default: true },
    allowRaiseHand:  { type: Boolean, default: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
