const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware'); // We reuse your bouncer!

// @route   POST /api/projects
// @desc    Create a new project linked to the logged-in user
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, priority, budget, dueDate } = req.body;

    // 1. Create the new project object
    const newProject = new Project({
      client: req.user.id, // This pulls the ID securely from the JWT payload!
      title,
      description,
      status,
      priority,
      budget,
      dueDate
    });

    // 2. Save to the database
    const project = await newProject.save();

    // 3. Send the newly created project back to the frontend
    res.status(201).json(project);

  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

// @route   GET /api/projects
// @desc    Get all projects for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 1. Tell MongoDB to find only projects where the client ID matches the token ID
    // We also use .sort() to put the newest projects at the top of the list
    const projects = await Project.find({ client: req.user.id }).sort({ createdAt: -1 });
    
    // 2. Send the array of projects back
    res.json(projects);

  } catch (error) {
    console.error('Fetch Projects Error:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project (e.g., change status)
// @route   PUT /api/projects/:id
// @desc    Update a project and trigger a notification
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.client.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this project' });
    }

    // Capture the old status just to see if it changed
    const oldStatus = project.status;

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    // --- NEW AUTOMATION BLOCK ---
    // If the request included a status change, automatically generate a notification!
    if (req.body.status && req.body.status !== oldStatus) {
      const statusNotification = new Notification({
        user: project.client,
        project: project._id,
        message: `Your project "${project.title}" has been moved to: ${project.status}`,
        type: 'Project Update'
      });
      await statusNotification.save();
    }
    // ----------------------------

    res.json(project);
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // SECURITY CHECK: Make sure the logged-in user owns this project
    if (project.client.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this project' });
    }

    // Delete it from the database
    await project.deleteOne();
    res.json({ message: 'Project successfully removed' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

module.exports = router;