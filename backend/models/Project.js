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
    enum: ['Planning', 'In Progress', 'In Review', 'Completed'],
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
  }
}, { timestamps: true }); 

module.exports = mongoose.model('Project', projectSchema);