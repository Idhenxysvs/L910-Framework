const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.get('/projects', projectController.getProjects);
router.get('/status', projectController.getStatus);
router.get('/health', projectController.healthCheck);

router.post('/projects/start-all', projectController.startAll);
router.post('/projects/stop-all', projectController.stopAll);
router.post('/projects/:projectId/start', projectController.startProject);
router.post('/projects/:projectId/stop', projectController.stopProject);
router.post('/projects/:projectId/restart', projectController.restartProject);

module.exports = router;