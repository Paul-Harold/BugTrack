const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Project name is required'], trim: true },
    key: {
      type: String,
      required: [true, 'Project key is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z][A-Z0-9]{1,9}$/, 'Key must be 2-10 letters/numbers, starting with a letter'],
    },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // per-project sequence counters used to generate human-readable ids (e.g. WEB-TC12, WEB-BUG3)
    counters: {
      testCase: { type: Number, default: 0 },
      bug: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Atomically claim the next sequence number for a counter ('testCase' | 'bug')
projectSchema.statics.nextSeq = async function (projectId, counter) {
  const project = await this.findByIdAndUpdate(
    projectId,
    { $inc: { [`counters.${counter}`]: 1 } },
    { new: true }
  );
  if (!project) throw new Error('Project not found');
  return { seq: project.counters[counter], key: project.key };
};

module.exports = mongoose.model('Project', projectSchema);
