// Módulo de gestión de tareas
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentTaskId = null;
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.renderTasks();
    }

    setupEventListeners() {
        // Agregar tarea
        const addTaskBtn = document.getElementById('add-task');
        const newTaskInput = document.getElementById('new-task');
        
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.addTask());
        }
        
        if (newTaskInput) {
            newTaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTask();
                }
            });
        }

        // Filtros
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });
    }

    addTask() {
        const newTaskInput = document.getElementById('new-task');
        const taskCategory = document.getElementById('task-category');
        
        if (!newTaskInput || !taskCategory) return;
        
        const taskText = newTaskInput.value.trim();
        if (!taskText) {
            window.notifications.warning('Por favor, ingresa el texto de la tarea');
            return;
        }

        const task = {
            id: Helpers.generateId(),
            text: taskText,
            category: taskCategory.value,
            completed: false,
            timeSpent: 0,
            createdAt: new Date().toISOString(),
            completedAt: null,
            priority: 'normal',
            notes: ''
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        
        // Limpiar input
        newTaskInput.value = '';
        
        window.notifications.success('Tarea agregada correctamente');
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        const message = task.completed ? 'Tarea completada' : 'Tarea marcada como pendiente';
        window.notifications.success(message);
    }

    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Mostrar modal de confirmación
        this.showConfirmModal(
            'Eliminar Tarea',
            `¿Estás seguro de que quieres eliminar la tarea "${task.text}"?`,
            () => {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                window.notifications.success('Tarea eliminada');
            }
        );
    }

    startTaskTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Cambiar a la pestaña del cronómetro
        if (window.app) {
            window.app.showTab('cronometro');
        }

        // Establecer tarea actual
        this.currentTaskId = taskId;
        
        // Actualizar info en cronómetro
        const currentTaskInfo = document.getElementById('current-task-info');
        if (currentTaskInfo) {
            currentTaskInfo.textContent = `Cronometrando: ${task.text}`;
        }

        // Iniciar cronómetro si no está corriendo
        if (window.timerManager && !window.timerManager.isStopwatchRunning) {
            window.timerManager.startStopwatch();
        }

        window.notifications.info(`Cronómetro iniciado para: ${task.text}`);
    }

    stopTaskTimer() {
        if (this.currentTaskId) {
            const task = this.tasks.find(t => t.id === this.currentTaskId);
            if (task && window.timerManager) {
                // Agregar tiempo transcurrido
                task.timeSpent += window.timerManager.stopwatchTime;
                this.saveTasks();
                this.renderTasks();
                
                // Limpiar tarea actual
                this.currentTaskId = null;
                
                // Actualizar info en cronómetro
                const currentTaskInfo = document.getElementById('current-task-info');
                if (currentTaskInfo) {
                    currentTaskInfo.textContent = 'Sin tarea seleccionada';
                }
                
                window.notifications.success(`Tiempo guardado para: ${task.text}`);
            }
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Actualizar botones de filtro
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'personal':
            case 'trabajo':
            case 'estudio':
            case 'salud':
                return this.tasks.filter(task => task.category === this.currentFilter);
            default:
                return this.tasks;
        }
    }

    renderTasks() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <li class="no-tasks">
                    <p>No hay tareas para mostrar</p>
                    <small>Agrega una nueva tarea para comenzar</small>
                </li>
            `;
            return;
        }

        taskList.innerHTML = '';
        
        // Ordenar tareas: pendientes primero, luego por fecha de creación
        const sortedTasks = filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.taskId = task.id;
            
            li.innerHTML = `
                <div class="task-content">
                    <div class="task-text">${Helpers.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <small class="task-time">⏱️ ${Helpers.formatTime(task.timeSpent)}</small>
                        <span class="task-category ${task.category}">${this.getCategoryLabel(task.category)}</span>
                        <small class="task-date">📅 ${Helpers.formatDate(task.createdAt)}</small>
                    </div>
                </div>
                <div class="task-controls-item">
                    <button class="btn-success" onclick="window.taskManager.toggleTask('${task.id}')" title="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">
                        ${task.completed ? '↩️' : '✅'}
                    </button>
                    <button class="btn-primary" onclick="window.taskManager.startTaskTimer('${task.id}')" title="Cronometrar tarea" ${task.completed ? 'disabled' : ''}>
                        ⏱️
                    </button>
                    <button class="btn-danger" onclick="window.taskManager.deleteTask('${task.id}')" title="Eliminar tarea">
                        🗑️
                    </button>
                </div>
            `;
            
            taskList.appendChild(li);
        });
    }

    getCategoryLabel(category) {
        const labels = {
            'personal': 'Personal',
            'trabajo': 'Trabajo',
            'estudio': 'Estudio',
            'salud': 'Salud'
        };
        return labels[category] || category;
    }

    updateStats() {
        // Actualizar estadísticas en la página de inicio
        const today = Helpers.getTodayString();
        const todayTasks = this.tasks.filter(task => 
            Helpers.isToday(task.completedAt)
        );
        
        const totalTimeToday = this.tasks
            .filter(task => Helpers.isToday(task.createdAt) || Helpers.isToday(task.completedAt))
            .reduce((total, task) => total + task.timeSpent, 0);

        // Calcular racha
        const streak = this.calculateStreak();

        // Actualizar elementos del DOM
        const tasksCompletedElement = document.getElementById('tasks-completed-today');
        const totalTimeElement = document.getElementById('total-time-today');
        const streakElement = document.getElementById('current-streak');

        if (tasksCompletedElement) {
            tasksCompletedElement.textContent = todayTasks.length;
        }

        if (totalTimeElement) {
            totalTimeElement.textContent = Helpers.formatTime(totalTimeToday);
        }

        if (streakElement) {
            streakElement.textContent = `${streak} día${streak !== 1 ? 's' : ''}`;
        }
    }

    calculateStreak() {
        let streak = 0;
        let currentDate = new Date();
        
        while (true) {
            const dateString = currentDate.toISOString().split('T')[0];
            const tasksCompletedOnDate = this.tasks.filter(task => 
                task.completedAt && task.completedAt.startsWith(dateString)
            );
            
            if (tasksCompletedOnDate.length > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');

        if (!modal) return;

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add('active');

        const handleConfirm = () => {
            modal.classList.remove('active');
            onConfirm();
            cleanup();
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
        };

        const cleanup = () => {
            modalConfirm.removeEventListener('click', handleConfirm);
            modalCancel.removeEventListener('click', handleCancel);
        };

        modalConfirm.addEventListener('click', handleConfirm);
        modalCancel.addEventListener('click', handleCancel);
    }

    // Métodos de persistencia
    saveTasks() {
        window.storage.save('tasks', this.tasks);
        
        // Crear backup automático cada 10 tareas modificadas
        if (this.tasks.length % 10 === 0) {
            window.storage.createBackup();
        }
    }

    loadTasks() {
        this.tasks = window.storage.load('tasks', []);
    }

    // Exportar tareas
    exportTasks() {
        const data = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const filename = `tareas_${new Date().toISOString().split('T')[0]}.json`;
        
        Helpers.downloadAsFile(jsonString, filename, 'application/json');
        window.notifications.success('Tareas exportadas correctamente');
    }

    // Importar tareas
    async importTasks(file) {
        try {
            const content = await Helpers.readFileAsText(file);
            const data = JSON.parse(content);
            
            if (data.tasks && Array.isArray(data.tasks)) {
                // Confirmar importación
                this.showConfirmModal(
                    'Importar Tareas',
                    `¿Quieres importar ${data.tasks.length} tareas? Esto reemplazará las tareas actuales.`,
                    () => {
                        this.tasks = data.tasks;
                        this.saveTasks();
                        this.renderTasks();
                        this.updateStats();
                        window.notifications.success('Tareas importadas correctamente');
                    }
                );
            } else {
                window.notifications.error('Archivo de tareas inválido');
            }
        } catch (error) {
            console.error('Error al importar tareas:', error);
            window.notifications.error('Error al importar el archivo');
        }
    }

    // Obtener estadísticas
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const totalTime = this.tasks.reduce((sum, task) => sum + task.timeSpent, 0);
        
        const categories = {};
        this.tasks.forEach(task => {
            if (!categories[task.category]) {
                categories[task.category] = { total: 0, completed: 0, time: 0 };
            }
            categories[task.category].total++;
            if (task.completed) {
                categories[task.category].completed++;
            }
            categories[task.category].time += task.timeSpent;
        });

        return {
            total,
            completed,
            pending,
            totalTime,
            categories,
            completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0
        };
    }
}

// Instancia global
window.taskManager = new TaskManager();

