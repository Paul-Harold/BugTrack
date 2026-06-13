const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const bugSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    seq: { type: Number, required: true },
    code: { type: String, required: true }, // e.g. WEB-BUG7
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '' },
    stepsToReproduce: { type: String, default: '' },
    severity: { type: String, enum: ['minor', 'major', 'critical', 'blocker'], default: 'major' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'reopened'],
      default: 'open',
      index: true,
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    testCase: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', default: null },
    resolvedAt: { type: Date, default: null },
    comments: [commentSchema],
  },
  { timestamps: true }
);

bugSchema.index({ project: 1, seq: 1 }, { unique: true });

module.exports = mongoose.model('Bug', bugSchema);
