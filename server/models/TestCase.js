const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    expected: { type: String, default: '' },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    suite: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite', default: null, index: true },
    seq: { type: Number, required: true },
    code: { type: String, required: true }, // e.g. WEB-TC12
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '' },
    preconditions: { type: String, default: '' },
    steps: [stepSchema],
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['draft', 'active', 'deprecated'], default: 'active' },
    tags: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

testCaseSchema.index({ project: 1, seq: 1 }, { unique: true });

module.exports = mongoose.model('TestCase', testCaseSchema);
