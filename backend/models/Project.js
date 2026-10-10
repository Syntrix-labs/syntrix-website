const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // The relational link to the specific client
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Planning', 'In Progress', 'In Review', 'Completed'],
    default: 'Planning'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  budget: {
    type: Number,
  },
  dueDate: {
    type: Date
  },
  trackingStage: {
    type: String,
    enum: ['Created', 'Coding Starting', 'Frontend Review', 'Test', 'Final Review', 'Publish'],
    default: 'Created'
  },
  documentLinks: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // The team member doing the work (one at a time). Their details are copied
  // in so the project still reads right if the member is later removed.
  assignee: {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    name: String,
    role: String,
    email: String,
    assignedAt: Date
  },
  // Previous assignees — internal only, never shown to the client.
  assignmentHistory: [{
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    name: String,
    role: String,
    email: String,
    assignedAt: Date,
    endedAt: Date,
    outcome: { type: String, enum: ['reassigned', 'disapproved'] },
    reason: String
  }],
  // Finish-job flow: the assignee hands over, the client approves or asks for changes.
  handover: {
    status: { type: String, enum: ['none', 'submitted', 'approved', 'changes'], default: 'none' },
    by: String,
    note: String,
    submittedAt: Date,
    respondedAt: Date,
    clientNote: String
  },
  completedAt: Date,
  // When the "deadline in 24 hours" reminder went to the assignee (reset when the deadline or assignee changes).
  deadlineReminderSentAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
