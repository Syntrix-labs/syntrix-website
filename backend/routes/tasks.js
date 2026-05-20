const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/tasks/:projectId
// @desc    Add a new task to a specific project
router.post('/:projectId', authMiddleware, async (req, res) => {
  try {
    // 1. Verify the project exists
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 2. SECURITY CHECK: Ensure the logged-in user actually owns this project
    if (project.client.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to modify this project' });
    }

    // 3. Create and save the new task
    const newTask = new Task({
      project: req.params.projectId,
      title: req.body.title,
      status: req.body.status || 'Pending'
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);

  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// @route   GET /api/tasks/:projectId
// @desc    Get all tasks for a specific project
router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    // 1. Verify project ownership first
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.client.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to view these tasks' });
    }

    // 2. Fetch all tasks linked to this project ID
    const tasks = await Task.find({ project: req.params.projectId }).sort({ createdAt: -1 });
    res.json(tasks);

  } catch (error) {
    console.error('Fetch Tasks Error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

module.exports = router;