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
  }]
}, { timestamps: true }); 

module.exports = mongoose.model('Project', projectSchema);
