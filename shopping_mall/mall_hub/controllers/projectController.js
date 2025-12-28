const processManager = require('../services/processManager');
const projectsConfig = require('../config/projects.config');

class ProjectController {
    getProjects(req, res) {
        try {
            const projects = projectsConfig.projects.map(project => ({
                id: project.id,
                name: project.name,
                port: project.port,
                description: project.description,
                path: project.path,
                color: project.color,
                icon: project.icon
            }));
            
            res.json({
                success: true,
                count: projects.length,
                projects
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    getStatus(req, res) {
        try {
            const status = processManager.getStatus();
            
            const projectsStatus = Object.values(status);
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                projects: status
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async startProject(req, res) {
        try {
            const { projectId } = req.params;
            const result = await processManager.startProject(projectId);
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async stopProject(req, res) {
        try {
            const { projectId } = req.params;
            const result = await processManager.stopProject(projectId);
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async restartProject(req, res) {
        try {
            const { projectId } = req.params;
            const result = await processManager.restartProject(projectId);
            
            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async startAll(req, res) {
        try {
            const results = await processManager.startAll();
            
            res.json({
                success: true,
                message: 'Запуск всех проектов выполнен',
                results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async stopAll(req, res) {
        try {
            const results = await processManager.stopAll();
            
            res.json({
                success: true,
                message: 'Остановка всех проектов выполнена',
                results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    healthCheck(req, res) {
        try {
            const status = processManager.getStatus();
            const totalProjects = projectsConfig.projects.length;
            const runningProjects = Object.values(status).filter(p => p.status === 'running').length;
            
            res.json({
                success: true,
                status: 'healthy',
                timestamp: new Date().toISOString(),
                stats: {
                    totalProjects,
                    runningProjects,
                    stoppedProjects: totalProjects - runningProjects
                },
                hub: {
                    port: process.env.PORT || 3000,
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                status: 'unhealthy',
                error: error.message
            });
        }
    }
}
module.exports = new ProjectController();