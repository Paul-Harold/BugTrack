const mongoose = require('mongoose');

const EXECUTION_STATUSES = ['untested', 'passed', 'failed', 'blocked', 'skipped'];

const executionSchema = new mongoose.Schema(
  {
    testCase: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', required: true },
    status: { type: String, enum: EXECUTION_STATUSES, default: 'untested' },
    notes: { type: String, default: '' },
    executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    executedAt: { type: Date, default: null },
  },
  { _id: false }
);

const testRunSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: [true, 'Run name is required'], trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    executions: [executionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

testRunSchema.statics.EXECUTION_STATUSES = EXECUTION_STATUSES;

module.exports = mongoose.model('TestRun', testRunSchema);
