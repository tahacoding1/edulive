const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  section: { type: String, required: true, unique: true }, // 'hero','about','services','faq','contact'
  data:    { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
