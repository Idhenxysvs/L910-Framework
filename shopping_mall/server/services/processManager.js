const { spawn } = require('child_process');
const treeKill = require('tree-kill');
const projectsConfig = require('../config/projects.config');

class ProcessManager {
    constructor() {
        this.processes = new Map();
        this.projectStatus = new Map();
        this.init();
    }

    init() {
        projectsConfig.projects.forEach(project => {
            this.projectStatus.set(project.id, {
                pid: null,
                status: 'stopped',
                port: project.port,
                uptime: null,
                error: null
            });
        });
    }

    async startProject(projectId) {
        const project = projectsConfig.projects.find(p => p.id === projectId);
        if (!project) {
            throw new Error(`Проект ${projectId} не найден`);
        }
        if (this.projectStatus.get(projectId).status === 'running') {
            return { success: true, message: 'Проект уже запущен' };
        }
        try {
            console.log(`ЗАПУСК: ${project.name} на порту ${project.port}`);
            const childProcess = spawn('node', ['server.js'], {
                cwd: project.path,
                stdio: 'pipe',
                shell: true,
                env: { ...process.env, PORT: project.port }
            });

            this.processes.set(projectId, childProcess);
            this.projectStatus.set(projectId, {
                pid: childProcess.pid,
                status: 'starting',
                port: project.port,
                uptime: new Date(),
                error: null
            });

            childProcess.stdout.on('data', (data) => {
                console.log(`[${project.name}] ${data.toString().trim()}`);
            });

            childProcess.stderr.on('data', (data) => {
                console.error(`[${project.name} ERROR] ${data.toString().trim()}`);
                this.projectStatus.get(projectId).error = data.toString().trim();
            });

            childProcess.on('close', (code) => {
                console.log(`[${project.name}] Процесс завершен с кодом: ${code}`);
                this.projectStatus.set(projectId, {
                    ...this.projectStatus.get(projectId),
                    status: code === 0 ? 'stopped' : 'error',
                    pid: null
                });
                this.processes.delete(projectId);
            });

            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.projectStatus.get(projectId).status = 'running';
            
            return {
                success: true,
                message: `Проект ${project.name} запущен на порту ${project.port}`,
                pid: childProcess.pid,
                port: project.port
            };

        } catch (error) {
            console.error(`❌ Ошибка запуска ${project.name}:`, error);
            this.projectStatus.set(projectId, {
                ...this.projectStatus.get(projectId),
                status: 'error',
                error: error.message
            });
            
            throw error;
        }
    }

    async stopProject(projectId) {
        const project = projectsConfig.projects.find(p => p.id === projectId);
        const process = this.processes.get(projectId);
        
        if (!process) {
            return { success: true, message: 'Проект не запущен' };
        }

        try {
            console.log(`🛑 Остановка проекта: ${project.name}`);
            treeKill(process.pid, 'SIGTERM', (err) => {
                if (err) {
                    console.error(`Ошибка остановки ${project.name}:`, err);
                } else {
                    console.log(`✅ ${project.name} остановлен`);
                }
            });

            this.projectStatus.set(projectId, {
                ...this.projectStatus.get(projectId),
                status: 'stopped',
                pid: null
            });
            this.processes.delete(projectId);
            
            return {
                success: true,
                message: `Проект ${project.name} остановлен`
            };
        } catch (error) {
            console.error(`❌ Ошибка остановки ${project.name}:`, error);
            throw error;
        }
    }

    async restartProject(projectId) {
        await this.stopProject(projectId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.startProject(projectId);
    }

    getStatus() {
        const status = {};
        projectsConfig.projects.forEach(project => {
            const projectStatus = this.projectStatus.get(project.id);
            status[project.id] = {
                id: project.id,
                name: project.name,
                port: project.port,
                status: projectStatus.status,
                pid: projectStatus.pid,
                uptime: projectStatus.uptime,
                error: projectStatus.error,
                url: `http://localhost:${project.port}`,
                description: project.description,
                color: project.color,
                icon: project.icon
            };
        });
        return status;
    }

    async startAll() {
        const results = {};
        for (const project of projectsConfig.projects) {
            try {
                results[project.id] = await this.startProject(project.id);
            } catch (error) {
                results[project.id] = {
                    success: false,
                    error: error.message
                };
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return results;
    }

    async stopAll() {
        const results = {};
        for (const project of projectsConfig.projects) {
            try {
                results[project.id] = await this.stopProject(project.id);
            } catch (error) {
                results[project.id] = {
                    success: false,
                    error: error.message
                };
            }
        }
        return results;
    }
}
module.exports = new ProcessManager();