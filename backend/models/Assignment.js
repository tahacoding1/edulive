const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName:    { type: String, required: true },
  filePath:    { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

const assignmentSchema = new mongoose.Schema({
  room:        { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  deadline:    { type: Date },
  submissions: [submissionSchema],
}, { timestamps: true });

assignmentSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
