// tasks.js
class TasksModule {
    constructor(appInstance) {
        this.app = appInstance;
        this.editingTask = null;
    }

    setupListeners() {
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.showTaskModal();
            });
        }
        
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTaskFilter(btn.dataset.filter);
            });
        });
        
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.renderTasks();
            });
        }
        
        const importBtn = document.getElementById('importTasksBtn');
        const exportBtn = document.getElementById('exportTasksBtn');
        
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importTasks();
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportTasks();
            });
        }
    }

    showTaskModal(task = null) {
        this.editingTask = task;
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('taskModalTitle');
        const submitBtn = document.getElementById('taskSubmitBtn');
        
        if (task) {
            title.textContent = 'Editar Tarea';
            submitBtn.textContent = 'Actualizar Tarea';
            this.populateTaskForm(task);
        } else {
            title.textContent = 'Nueva Tarea';
            submitBtn.textContent = 'Crear Tarea';
            this.resetTaskForm();
        }
        
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    showQuickTaskModal() {
        const title = prompt('¿Qué tarea quieres agregar rápidamente?'); // Using prompt for quick action
        if (title && title.trim()) {
            const task = {
                id: Utils.generateId(),
                title: title.trim(),
                description: '',
                category: 'personal',
                completed: false,
                priority: false,
                createdAt: new Date(),
                estimatedTime: 60
            };
            
            this.app.tasks.push(task);
            this.saveTasks();
            this.renderTasks();
            this.app.updateDashboardStats();
            
            Utils.showToast('Tarea creada rápidamente', 'success');
        }
    }
    
    populateTaskForm(task) {
        document.getElementById('taskTitle').value = task.title || '';
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskCategory').value = task.category || '';
        document.getElementById('taskPriority').checked = task.priority || false;
        document.getElementById('taskEstimatedTime').value = task.estimatedTime || '';
        
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            document.getElementById('taskDueDate').value = dueDate.toISOString().split('T')[0];
            if (task.dueTime) {
                document.getElementById('taskDueTime').value = task.dueTime;
            }
        }
    }
    
    resetTaskForm() {
        document.getElementById('taskForm').reset();
    }
    
    saveTask() {
        const form = document.getElementById('taskForm');
        const formData = new FormData(form);
        
        const taskData = {
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim() || '',
            category: document.getElementById('taskCategory').value,
            priority: document.getElementById('taskPriority').checked,
            estimatedTime: parseInt(document.getElementById('taskEstimatedTime').value) || 60,
            dueDate: document.getElementById('taskDueDate').value || null,
            dueTime: document.getElementById('taskDueTime').value || null
        };
        
        if (!taskData.title || !taskData.category) {
            Utils.showToast('Por favor completa los campos requeridos', 'error');
            return;
        }
        
        if (this.editingTask) {
            const index = this.app.tasks.findIndex(t => t.id === this.editingTask.id);
            if (index !== -1) {
                this.app.tasks[index] = { ...this.app.tasks[index], ...taskData, updatedAt: new Date() };
                Utils.showToast('Tarea actualizada', 'success');
            }
        } else {
            const newTask = {
                id: Utils.generateId(),
                ...taskData,
                completed: false,
                createdAt: new Date()
            };
            this.app.tasks.push(newTask);
            Utils.showToast('Tarea creada', 'success');
        }
        
        this.saveTasks();
        this.renderTasks();
        this.app.updateDashboardStats();
        this.app.hideModal('taskModal');
    }
    
    deleteTask(taskId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            this.app.tasks = this.app.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.app.updateDashboardStats();
            Utils.showToast('Tarea eliminada', 'info');
        }
    }
    
    toggleTaskComplete(taskId) {
        const task = this.app.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date() : null;
            
            this.saveTasks();
            this.renderTasks();
            this.app.updateDashboardStats();
            
            if (task.completed) {
                Utils.showToast('¡Tarea completada!', 'success');
                this.app.playSound('success');
            } else {
                Utils.showToast('Tarea marcada como pendiente', 'info');
            }
        }
    }
    
    setTaskFilter(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderTasks();
    }
    
    renderTasks(viewType = this.app.currentView) {
        const container = document.getElementById('taskList');
        const kanbanBoard = document.getElementById('kanbanBoard');
        
        if (!container) return;
        
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'todas';
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'todas';
        
        let filteredTasks = this.app.tasks;
        
        if (activeFilter !== 'todas') {
            filteredTasks = filteredTasks.filter(task => {
                switch (activeFilter) {
                    case 'pendientes':
                        return !task.completed;
                    case 'completadas':
                        return task.completed;
                    case 'vencidas':
                        return !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
                    default:
                        return true;
                }
            });
        }
        
        if (categoryFilter !== 'todas') {
            filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
        }
        
        if (viewType === 'kanban' && kanbanBoard) {
            this.renderKanbanTasks(filteredTasks);
            container.style.display = 'none';
            kanbanBoard.style.display = 'grid';
        } else {
            this.renderListTasks(filteredTasks, container);
            container.style.display = 'flex';
            if (kanbanBoard) kanbanBoard.style.display = 'none';
        }
    }
    
    renderListTasks(tasks, container) {
        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay tareas que mostrar</div>';
            return;
        }
        
        container.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority ? 'high-priority' : ''}" 
                 data-task-id="${task.id}">
                <div class="task-content">
                    <div class="task-header">
                        <h3 class="task-title">${Utils.sanitizeHTML(task.title)}</h3>
                        <div class="task-actions">
                            <button class="btn-icon" onclick="window.tasksModule.toggleTaskComplete('${task.id}')" 
                                    title="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">
                                ${task.completed ? '↶' : '✓'}
                            </button>
                            <button class="btn-icon" onclick="window.tasksModule.editTask('${task.id}')" title="Editar">
                                ✏️
                            </button>
                            <button class="btn-icon" onclick="window.tasksModule.deleteTask('${task.id}')" title="Eliminar">
                                🗑️
                            </button>
                        </div>
                    </div>
                    ${task.description ? `<p class="task-description">${Utils.sanitizeHTML(task.description)}</p>` : ''}
                    <div class="task-meta">
                        <span class="task-category">${task.category}</span>
                        ${task.estimatedTime ? `<span class="task-time">${task.estimatedTime} min</span>` : ''}
                        ${task.dueDate ? `<span class="task-due ${this.isTaskOverdue(task) ? 'overdue' : ''}">${Utils.formatDateShort(new Date(task.dueDate))}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderKanbanTasks(tasks) {
        const columns = {
            'pendiente': tasks.filter(t => !t.completed && !this.isTaskInProgress(t)),
            'en-progreso': tasks.filter(t => this.isTaskInProgress(t)),
            'completada': tasks.filter(t => t.completed)
        };
        
        Object.keys(columns).forEach(status => {
            const container = document.querySelector(`[data-status="${status}"] .kanban-tasks`);
            if (container) {
                container.innerHTML = columns[status].map(task => `
                    <div class="kanban-task ${task.priority ? 'high-priority' : ''}" 
                         data-task-id="${task.id}" draggable="true">
                        <h4>${Utils.sanitizeHTML(task.title)}</h4>
                        ${task.description ? `<p>${Utils.sanitizeHTML(task.description)}</p>` : ''}
                        <div class="task-meta">
                            <span class="task-category">${task.category}</span>
                            ${task.dueDate ? `<span class="task-due">${Utils.formatDateShort(new Date(task.dueDate))}</span>` : ''}
                        </div>
                        <div class="task-actions">
                            <button class="btn-icon" onclick="window.tasksModule.toggleTaskComplete('${task.id}')" title="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">${task.completed ? '↶' : '✓'}</button>
                            <button class="btn-icon" onclick="window.tasksModule.editTask('${task.id}')" title="Editar">✏️</button>
                            <button class="btn-icon" onclick="window.tasksModule.deleteTask('${task.id}')" title="Eliminar">🗑️</button>
                        </div>
                    </div>
                `).join('');
            }
        });
    }
    
    isTaskOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        return new Date(task.dueDate) < new Date();
    }
    
    isTaskInProgress(task) {
        const today = Utils.getStartOfDay(new Date());
        return this.app.timeEntries.some(entry => 
            entry.taskId === task.id && 
            Utils.isSameDay(new Date(entry.date), today)
        );
    }
    
    editTask(taskId) {
        const task = this.app.tasks.find(t => t.id === taskId);
        if (task) {
            this.showTaskModal(task);
        }
    }
    
    saveTasks() {
        this.app.storage.set('tasks', this.app.tasks);
    }
    
    exportTasks() {
        const data = {
            tasks: this.app.tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        Utils.downloadFile(
            JSON.stringify(data, null, 2),
            `tareas_${Utils.formatDateShort(new Date()).replace(/\s/g, '_')}.json`,
            'application/json'
        );
        
        Utils.showToast('Tareas exportadas', 'success');
    }
    
    async importTasks() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const content = await Utils.readFile(file);
                const data = JSON.parse(content);
                
                if (data.tasks && Array.isArray(data.tasks)) {
                    // Using the app's confirm modal for consistency
                    if (confirm(`¿Importar ${data.tasks.length} tareas? Esto se agregará a las tareas existentes.`)) {
                        this.app.tasks.push(...data.tasks);
                        this.saveTasks();
                        this.renderTasks();
                        this.app.updateDashboardStats();
                        Utils.showToast(`${data.tasks.length} tareas importadas`, 'success');
                    }
                } else {
                    Utils.showToast('Formato de archivo inválido', 'error');
                }
            } catch (error) {
                console.error('Error importando tareas:', error);
                Utils.showToast('Error al importar tareas', 'error');
            }
        };
        
        input.click();
    }

    highlightTask(taskId) {
        setTimeout(() => {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                taskElement.classList.add('highlight');
                setTimeout(() => taskElement.classList.remove('highlight'), 2000);
            }
        }, 500);
    }
}
