class TimeManagementApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.reminders = JSON.parse(localStorage.getItem('reminders')) || [];
        this.goals = JSON.parse(localStorage.getItem('goals')) || [];
        this.timeEntries = JSON.parse(localStorage.getItem('timeEntries')) || [];
        this.settings = JSON.parse(localStorage.getItem('settings')) || this.getDefaultSettings();
        
        this.stopwatchInterval = null;
        this.timerInterval = null;
        this.stopwatchTime = 0;
        this.timerTime = 0;
        this.isStopwatchRunning = false;
        this.isTimerRunning = false;
        this.currentStopwatchTask = null;
        this.lapTimes = [];
        
        this.currentDate = new Date();
        this.editingTask = null;
        this.editingReminder = null;
        this.editingGoal = null;
        
        this.init();
    }

    getDefaultSettings() {
        return {
            theme: 'default',
            soundEnabled: true,
            notificationsEnabled: true,
            reminderAdvance: 5
        };
    }

    init() {
        this.requestNotificationPermission();
        this.applyTheme();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.renderDashboard();
        this.updateStopwatchTasks();
        this.checkReminders();
        this.renderCalendar();
        this.renderReports();
        this.renderGoals();
        this.loadSettings();
        
        // Verificar recordatorios cada minuto
        setInterval(() => this.checkReminders(), 60000);
        
        // Mostrar sección activa al cargar
        const hash = window.location.hash.substring(1) || 'inicio';
        this.showSection(hash);
    }

    // NOTIFICACIONES Y SONIDOS
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    showNotification(title, message, type = 'info') {
        // Notificación en la aplicación
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <strong>${title}</strong><br>
            ${message}
        `;
        
        container.appendChild(notification);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Remover al hacer clic
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });

        // Notificación del navegador
        if (this.settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏰</text></svg>'
            });
        }

        // Sonido
        if (this.settings.soundEnabled) {
            this.playSound(type);
        }
    }

    playSound(type) {
        // Crear sonido usando Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Diferentes frecuencias para diferentes tipos
        const frequencies = {
            success: 800,
            warning: 600,
            error: 400,
            info: 500
        };
        
        oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    // CONFIGURACIÓN Y TEMAS
    applyTheme() {
        document.body.setAttribute('data-theme', this.settings.theme);
    }

    loadSettings() {
        document.getElementById('themeSelect').value = this.settings.theme;
        document.getElementById('soundEnabled').checked = this.settings.soundEnabled;
        document.getElementById('notificationsEnabled').checked = this.settings.notificationsEnabled;
        document.getElementById('reminderAdvance').value = this.settings.reminderAdvance;
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    // NAVEGACIÓN Y UI
    setupEventListeners() {
        // Navegación
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Modals
        this.setupModalEventListeners();
        
        // Filtros
        this.setupFilterEventListeners();
        
        // Cronómetro y Temporizador
        this.setupTimerEventListeners();
        
        // Calendario
        this.setupCalendarEventListeners();
        
        // Configuración
        this.setupConfigEventListeners();
        
        // Exportar/Importar
        this.setupDataEventListeners();
    }

    setupModalEventListeners() {
        // Modal de tareas
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.editingTask = null;
            this.resetTaskForm();
            document.getElementById('taskModalTitle').textContent = 'Nueva Tarea';
            document.getElementById('taskSubmitBtn').textContent = 'Crear Tarea';
            document.getElementById('taskModal').style.display = 'block';
        });

        document.querySelector('#taskModal .close').addEventListener('click', () => {
            document.getElementById('taskModal').style.display = 'none';
        });

        // Modal de recordatorios
        document.getElementById('addReminderBtn').addEventListener('click', () => {
            this.editingReminder = null;
            this.resetReminderForm();
            document.getElementById('reminderModalTitle').textContent = 'Nuevo Recordatorio';
            document.getElementById('reminderSubmitBtn').textContent = 'Crear Recordatorio';
            document.getElementById('reminderModal').style.display = 'block';
        });

        document.querySelector('#reminderModal .close-reminder-modal').addEventListener('click', () => {
            document.getElementById('reminderModal').style.display = 'none';
        });

        // Modal de metas
        document.getElementById('addGoalBtn').addEventListener('click', () => {
            this.editingGoal = null;
            this.resetGoalForm();
            document.getElementById('goalModalTitle').textContent = 'Nueva Meta';
            document.getElementById('goalSubmitBtn').textContent = 'Crear Meta';
            document.getElementById('goalModal').style.display = 'block';
        });

        document.querySelector('#goalModal .close-goal-modal').addEventListener('click', () => {
            document.getElementById('goalModal').style.display = 'none';
        });

        // Formularios
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        document.getElementById('reminderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReminder();
        });

        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });

        // Modal de confirmación
        document.getElementById('confirmYes').addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
                this.confirmCallback = null;
            }
            document.getElementById('confirmModal').style.display = 'none';
        });

        document.getElementById('confirmNo').addEventListener('click', () => {
            this.confirmCallback = null;
            document.getElementById('confirmModal').style.display = 'none';
        });

        // Cerrar modals al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    setupFilterEventListeners() {
        // Filtros de tareas
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderTasks();
            });
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.renderTasks();
        });

        // Filtros de recordatorios
        document.querySelectorAll('.reminder-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.reminder-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderReminders();
            });
        });

        // Filtros de metas
        document.querySelectorAll('.goal-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.goal-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderGoals();
            });
        });
    }

    setupTimerEventListeners() {
        // Cronómetro
        document.getElementById('startStopwatch').addEventListener('click', () => {
            this.startStopwatch();
        });

        document.getElementById('pauseStopwatch').addEventListener('click', () => {
            this.pauseStopwatch();
        });

        document.getElementById('resetStopwatch').addEventListener('click', () => {
            this.resetStopwatch();
        });

        document.getElementById('lapStopwatch').addEventListener('click', () => {
            this.addLapTime();
        });

        // Temporizador
        document.getElementById('startTimer').addEventListener('click', () => {
            this.startTimer();
        });

        document.getElementById('pauseTimer').addEventListener('click', () => {
            this.pauseTimer();
        });

        document.getElementById('resetTimer').addEventListener('click', () => {
            this.resetTimer();
        });

        // Inputs del temporizador
        ['timerHours', 'timerMinutes', 'timerSeconds'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.updateTimerDisplayFromInputs();
                });
            }
        });
    }

    setupCalendarEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
    }

    setupConfigEventListeners() {
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.applyTheme();
            this.saveSettings();
        });

        document.getElementById('soundEnabled').addEventListener('change', (e) => {
            this.settings.soundEnabled = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('notificationsEnabled').addEventListener('change', (e) => {
            this.settings.notificationsEnabled = e.target.checked;
            this.saveSettings();
            if (e.target.checked) {
                this.requestNotificationPermission();
            }
        });

        document.getElementById('reminderAdvance').addEventListener('change', (e) => {
            this.settings.reminderAdvance = parseInt(e.target.value);
            this.saveSettings();
        });

        document.getElementById('testNotificationBtn').addEventListener('click', () => {
            this.showNotification('Prueba', 'Esta es una notificación de prueba', 'info');
        });
    }

    setupDataEventListeners() {
        // Reportes
        document.getElementById('exportReport').addEventListener('click', () => {
            this.exportReport();
        });

        document.getElementById('reportPeriod').addEventListener('change', () => {
            this.renderReports();
        });

        // Tareas
        document.getElementById('exportTasksBtn').addEventListener('click', () => {
            this.exportTasks();
        });

        document.getElementById('importTasksBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        // Datos generales
        document.getElementById('exportAllData').addEventListener('click', () => {
            this.exportAllData();
        });

        document.getElementById('importAllData').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clearAllData').addEventListener('click', () => {
            this.confirmAction('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.', () => {
                this.clearAllData();
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        document.getElementById('addTaskBtn').click();
                        break;
                    case ' ':
                        e.preventDefault();
                        if (this.isStopwatchRunning) {
                            this.pauseStopwatch();
                        } else {
                            this.startStopwatch();
                        }
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetStopwatch();
                        break;
                    case 't':
                        e.preventDefault();
                        if (this.isTimerRunning) {
                            this.pauseTimer();
                        } else {
                            this.startTimer();
                        }
                        break;
                }
            }
        });
    }

    showSection(sectionName) {
        // Ocultar todas las secciones
        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.remove('active');
        });

        // Remover clase active de todos los botones
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
        });

        // Mostrar sección seleccionada
        const section = document.getElementById(sectionName);
        if (section) {
            section.classList.add('active');
            document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
            window.location.hash = sectionName;
        }

        // Renderizar contenido específico
        switch(sectionName) {
            case 'inicio':
                this.renderDashboard();
                break;
            case 'tareas':
                this.renderTasks();
                break;
            case 'calendario':
                this.renderCalendar();
                break;
            case 'recordatorios':
                this.renderReminders();
                break;
            case 'reportes':
                this.renderReports();
                break;
            case 'metas':
                this.renderGoals();
                break;
            case 'temporizador':
                this.updateTimerDisplay();
                break;
        }
    }

    // DASHBOARD
    renderDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const completedToday = this.tasks.filter(task => 
            task.completed && task.completedAt && 
            new Date(task.completedAt).toISOString().split('T')[0] === today
        ).length;

        const totalTime = this.timeEntries.reduce((total, entry) => total + entry.duration, 0);
        const streak = this.calculateStreak();
        const productivity = this.calculateProductivity();

        document.getElementById('completedTasks').textContent = completedToday;
        document.getElementById('totalTime').textContent = this.formatTime(totalTime);
        document.getElementById('streak').textContent = `${streak} días`;
        document.getElementById('productivity').textContent = `${productivity}%`;

        this.renderRecentActivity();
    }

    calculateStreak() {
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);

        while (true) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const hasCompletedTasks = this.tasks.some(task => 
                task.completed && task.completedAt && 
                new Date(task.completedAt).toISOString().split('T')[0] === dateStr
            );

            if (hasCompletedTasks) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    calculateProductivity() {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks.filter(task => {
            if (task.dueDate) {
                return new Date(task.dueDate).toISOString().split('T')[0] === today;
            }
            return false;
        });

        if (todayTasks.length === 0) return 100;

        const completedTasks = todayTasks.filter(task => task.completed).length;
        return Math.round((completedTasks / todayTasks.length) * 100);
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivities');
        const activities = this.getRecentActivities();

        if (activities.length === 0) {
            container.innerHTML = '<p style="text-align: center; opacity: 0.7;">No hay actividad reciente</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <strong>${activity.time}</strong> - ${activity.description}
            </div>
        `).join('');
    }

    getRecentActivities() {
        const activities = [];
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Tareas completadas
        this.tasks.filter(task => 
            task.completed && task.completedAt && 
            new Date(task.completedAt) > oneDayAgo
        ).forEach(task => {
            activities.push({
                time: new Date(task.completedAt).toLocaleTimeString(),
                description: `Completaste la tarea "${task.title}"`
            });
        });

        // Entradas de tiempo
        this.timeEntries.filter(entry => 
            new Date(entry.date) > oneDayAgo
        ).forEach(entry => {
            activities.push({
                time: new Date(entry.date).toLocaleTimeString(),
                description: `Trabajaste ${this.formatTime(entry.duration)} en "${entry.taskTitle || 'Sin tarea'}"`
            });
        });

        return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
    }

    // TAREAS
    resetTaskForm() {
        document.getElementById('taskForm').reset();
    }

    saveTask() {
        const titleInput = document.getElementById('taskTitle');
        const descriptionInput = document.getElementById('taskDescription');
        const categoryInput = document.getElementById('taskCategory');
        const dueDateInput = document.getElementById('taskDueDate');
        const dueTimeInput = document.getElementById('taskDueTime');
        const priorityInput = document.getElementById('taskPriority');
        const estimatedTimeInput = document.getElementById('taskEstimatedTime');

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const category = categoryInput.value;
        const dueDate = dueDateInput.value;
        const dueTime = dueTimeInput.value;
        const priority = priorityInput.checked;
        const estimatedTime = parseInt(estimatedTimeInput.value) || 0;

        if (!title || !category) {
            this.showNotification('Error', 'Por favor, completa el título y la categoría de la tarea.', 'error');
            return;
        }

        let dueDateTime = null;
        if (dueDate) {
            dueDateTime = dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T23:59`;
        }

        if (this.editingTask) {
            // Editar tarea existente
            const task = this.tasks.find(t => t.id === this.editingTask);
            if (task) {
                task.title = title;
                task.description = description;
                task.category = category;
                task.dueDate = dueDateTime;
                task.priority = priority;
                task.estimatedTime = estimatedTime;
                task.updatedAt = new Date().toISOString();
            }
            this.showNotification('Éxito', 'Tarea actualizada correctamente', 'success');
        } else {
            // Crear nueva tarea
            const task = {
                id: Date.now(),
                title,
                description,
                category,
                dueDate: dueDateTime,
                priority,
                estimatedTime,
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null,
                timeSpent: 0
            };
            this.tasks.push(task);
            this.showNotification('Éxito', 'Tarea creada correctamente', 'success');
        }

        this.saveTasks();
        this.renderTasks();
        this.updateStopwatchTasks();
        this.renderCalendar();
        this.renderDashboard();
        this.updateGoalProgress();
        this.renderGoals();
        
        document.getElementById('taskModal').style.display = 'none';
        this.editingTask = null;
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTask = taskId;
        
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskPriority').checked = task.priority;
        document.getElementById('taskEstimatedTime').value = task.estimatedTime || '';

        if (task.dueDate) {
            const date = new Date(task.dueDate);
            document.getElementById('taskDueDate').value = date.toISOString().split('T')[0];
            document.getElementById('taskDueTime').value = date.toTimeString().slice(0, 5);
        }

        document.getElementById('taskModalTitle').textContent = 'Editar Tarea';
        document.getElementById('taskSubmitBtn').textContent = 'Actualizar Tarea';
        document.getElementById('taskModal').style.display = 'block';
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            
            if (task.completed) {
                this.showNotification('¡Bien hecho!', `Completaste la tarea "${task.title}"`, 'success');
            }
            
            this.saveTasks();
            this.renderTasks();
            this.renderDashboard();
            this.renderCalendar();
            this.updateGoalProgress();
            this.renderGoals();
            this.renderReports();
        }
    }

    deleteTask(taskId) {
        this.confirmAction('¿Estás seguro de que quieres eliminar esta tarea?', () => {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateStopwatchTasks();
            this.renderDashboard();
            this.renderCalendar();
            this.updateGoalProgress();
            this.renderGoals();
            this.renderReports();
            this.showNotification('Tarea eliminada', 'La tarea ha sido eliminada correctamente', 'info');
        });
    }

    renderTasks() {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const taskList = document.getElementById('taskList');

        let filteredTasks = this.tasks;

        // Aplicar filtro de estado
        if (activeFilter === 'pendientes') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (activeFilter === 'completadas') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (activeFilter === 'vencidas') {
            const now = new Date();
            filteredTasks = filteredTasks.filter(task => 
                !task.completed && task.dueDate && new Date(task.dueDate) < now
            );
        }

        // Aplicar filtro de categoría
        if (categoryFilter !== 'todas') {
            filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
        }

        // Ordenar tareas
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            if (!a.completed && !b.completed) {
                if (a.priority !== b.priority) {
                    return a.priority ? -1 : 1;
                }
            }
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return 0;
        });

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No hay tareas que mostrar</p>';
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => {
            const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            
            return `
                <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority ? 'priority' : ''} ${isOverdue ? 'overdue' : ''}">
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                        <div class="task-meta">
                            <span class="category-badge category-${task.category}">${task.category}</span>
                            ${dueDate ? `<span>Vence: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString().slice(0, 5)}</span>` : ''}
                            ${task.priority ? '<span style="color: #dc2626;">Prioridad Alta</span>' : ''}
                            <span>Tiempo: ${this.formatTime(task.timeSpent)}</span>
                            ${task.estimatedTime ? `<span>Estimado: ${task.estimatedTime}min</span>` : ''}
                            ${isOverdue ? '<span style="color: #facc15;">VENCIDA</span>' : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-success" onclick="app.toggleTask(${task.id})">
                            ${task.completed ? '↶' : '✓'}
                        </button>
                        <button class="btn btn-secondary" onclick="app.editTask(${task.id})">✏️</button>
                        <button class="btn btn-danger" onclick="app.deleteTask(${task.id})">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    exportTasks() {
        const data = {
            tasks: this.tasks,
            exportDate: new Date().toISOString()
        };
        this.downloadJSON(data, 'tareas_cogeme_el_paso.json');
        this.showNotification('Exportación completa', 'Las tareas han sido exportadas correctamente', 'success');
    }

    // CRONÓMETRO
    updateStopwatchTasks() {
        const select = document.getElementById('stopwatchTask');
        const pendingTasks = this.tasks.filter(task => !task.completed);
        
        select.innerHTML = '<option value="">Seleccionar tarea...</option>' +
            pendingTasks.map(task => `<option value="${task.id}">${task.title}</option>`).join('');
    }

    startStopwatch() {
        if (!this.isStopwatchRunning) {
            this.isStopwatchRunning = true;
            const taskSelect = document.getElementById('stopwatchTask');
            this.currentStopwatchTask = taskSelect.value ? parseInt(taskSelect.value) : null;
            
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime++;
                this.updateStopwatchDisplay();
            }, 1000);
            
            document.getElementById('startStopwatch').textContent = 'Detener';
            document.getElementById('startStopwatch').className = 'btn-danger';
            document.body.classList.add('timer-active');
            
            this.showNotification('Cronómetro iniciado', 'El cronómetro ha comenzado a contar', 'info');
        } else {
            this.pauseStopwatch();
        }
    }

    pauseStopwatch() {
        if (this.isStopwatchRunning) {
            this.isStopwatchRunning = false;
            clearInterval(this.stopwatchInterval);
            
            // Guardar tiempo en la tarea si hay una seleccionada
            if (this.currentStopwatchTask && this.stopwatchTime > 0) {
                this.saveTimeEntry(this.currentStopwatchTask, this.stopwatchTime);
            }
            
            document.getElementById('startStopwatch').textContent = 'Continuar';
            document.getElementById('startStopwatch').className = 'btn-primary';
            document.body.classList.remove('timer-active');
            
            this.showNotification('Cronómetro pausado', 'El cronómetro ha sido pausado', 'info');
        }
    }

    resetStopwatch() {
        this.isStopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        
        // Guardar tiempo en la tarea si hay una seleccionada
        if (this.currentStopwatchTask && this.stopwatchTime > 0) {
            this.saveTimeEntry(this.currentStopwatchTask, this.stopwatchTime);
        }
        
        this.stopwatchTime = 0;
        this.currentStopwatchTask = null;
        this.lapTimes = [];
        
        this.updateStopwatchDisplay();
        document.getElementById('lapTimes').innerHTML = '';
        document.getElementById('startStopwatch').textContent = 'Iniciar';
        document.getElementById('startStopwatch').className = 'btn-primary';
        document.body.classList.remove('timer-active');
        
        this.showNotification('Cronómetro reiniciado', 'El cronómetro ha sido reiniciado', 'info');
    }

    addLapTime() {
        if (this.isStopwatchRunning) {
            const lapTime = this.stopwatchTime;
            this.lapTimes.push(lapTime);
            
            const lapContainer = document.getElementById('lapTimes');
            const lapDiv = document.createElement('div');
            lapDiv.className = 'lap-time';
            lapDiv.innerHTML = `
                <span>Vuelta ${this.lapTimes.length}</span>
                <span>${this.formatTime(lapTime)}</span>
            `;
            lapContainer.appendChild(lapDiv);
        }
    }

    updateStopwatchDisplay() {
        document.getElementById('stopwatchDisplay').textContent = this.formatTime(this.stopwatchTime);
    }

    saveTimeEntry(taskId, duration) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.timeSpent += duration;
            
            const timeEntry = {
                id: Date.now(),
                taskId,
                taskTitle: task.title,
                duration,
                date: new Date().toISOString()
            };
            
            this.timeEntries.push(timeEntry);
            localStorage.setItem('timeEntries', JSON.stringify(this.timeEntries));
            this.saveTasks();
            this.renderTasks();
            this.renderDashboard();
        }
    }

    // TEMPORIZADOR
    updateTimerDisplayFromInputs() {
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
        
        this.timerTime = hours * 3600 + minutes * 60 + seconds;
        this.updateTimerDisplay();
    }

    startTimer() {
        if (!this.isTimerRunning) {
            if (this.timerTime === 0) {
                this.updateTimerDisplayFromInputs();
            }
            
            if (this.timerTime === 0) {
                this.showNotification('Error', 'Por favor, establece un tiempo válido', 'error');
                return;
            }
            
            this.isTimerRunning = true;
            this.timerInterval = setInterval(() => {
                this.timerTime--;
                this.updateTimerDisplay();
                
                if (this.timerTime <= 0) {
                    this.timerFinished();
                }
            }, 1000);
            
            document.getElementById('startTimer').textContent = 'Detener';
            document.getElementById('startTimer').className = 'btn-danger';
            document.getElementById('timerStatus').textContent = 'En progreso...';
            document.body.classList.add('timer-active');
            
            this.showNotification('Temporizador iniciado', 'El temporizador ha comenzado', 'info');
        } else {
            this.pauseTimer();
        }
    }

    pauseTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        
        document.getElementById('startTimer').textContent = 'Continuar';
        document.getElementById('startTimer').className = 'btn-primary';
        document.getElementById('timerStatus').textContent = 'Pausado';
        document.body.classList.remove('timer-active');
        
        this.showNotification('Temporizador pausado', 'El temporizador ha sido pausado', 'info');
    }

    resetTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        
        this.updateTimerDisplayFromInputs();
        
        document.getElementById('startTimer').textContent = 'Iniciar';
        document.getElementById('startTimer').className = 'btn-primary';
        document.getElementById('timerStatus').textContent = 'Listo para comenzar';
        document.body.classList.remove('timer-active', 'timer-finished');
        
        this.showNotification('Temporizador reiniciado', 'El temporizador ha sido reiniciado', 'info');
    }

    timerFinished() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.timerTime = 0;
        
        document.getElementById('startTimer').textContent = 'Iniciar';
        document.getElementById('startTimer').className = 'btn-primary';
        document.getElementById('timerStatus').textContent = '¡Tiempo completado!';
        document.body.classList.remove('timer-active');
        document.body.classList.add('timer-finished');
        
        // Actualizar estadísticas de Pomodoro
        this.updatePomodoroStats();
        
        this.showNotification('¡Tiempo completado!', 'El temporizador ha terminado. ¡Buen trabajo!', 'success');
        
        // Remover clase después de 5 segundos
        setTimeout(() => {
            document.body.classList.remove('timer-finished');
        }, 5000);
    }

    updateTimerDisplay() {
        document.getElementById('timerDisplay').textContent = this.formatTime(this.timerTime);
    }

    updatePomodoroStats() {
        const today = new Date().toISOString().split('T')[0];
        let pomodoroStats = JSON.parse(localStorage.getItem('pomodoroStats')) || {};
        
        if (!pomodoroStats[today]) {
            pomodoroStats[today] = { count: 0, totalTime: 0 };
        }
        
        pomodoroStats[today].count++;
        pomodoroStats[today].totalTime += (parseInt(document.getElementById('timerHours').value) || 0) * 3600 + 
                                          (parseInt(document.getElementById('timerMinutes').value) || 0) * 60 + 
                                          (parseInt(document.getElementById('timerSeconds').value) || 0);
        
        localStorage.setItem('pomodoroStats', JSON.stringify(pomodoroStats));
        
        // Actualizar display
        document.getElementById('pomodorosToday').textContent = pomodoroStats[today].count;
        document.getElementById('pomodoroTotalTime').textContent = this.formatTime(pomodoroStats[today].totalTime);
    }

    // CALENDARIO
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';
        
        // Días de la semana
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.textContent = day;
            dayHeader.style.fontWeight = 'bold';
            dayHeader.style.textAlign = 'center';
            dayHeader.style.padding = '0.5rem';
            dayHeader.style.background = 'rgba(255, 255, 255, 0.1)';
            calendarGrid.appendChild(dayHeader);
        });
        
        // Días del calendario
        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDate.getDate();
            dayElement.dataset.date = currentDate.toISOString().split('T')[0];
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = this.isToday(currentDate);
            const hasTasks = this.hasTasksOnDate(currentDate);
            const hasCompletedTasks = this.hasCompletedTasksOnDate(currentDate);
            const hasReminders = this.hasRemindersOnDate(currentDate);
            
            if (!isCurrentMonth) {
                dayElement.classList.add('other-month');
            }
            if (isToday) {
                dayElement.classList.add('today');
            }
            if (hasTasks) {
                dayElement.classList.add('has-tasks');
            }
            if (hasCompletedTasks) {
                dayElement.classList.add('completed-tasks');
            }
            if (hasReminders) {
                dayElement.classList.add('has-reminders');
            }
            
            dayElement.addEventListener('click', () => {
                this.showDayDetails(currentDate.toISOString().split('T')[0]);
            });
            
            calendarGrid.appendChild(dayElement);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() && 
               date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
    }

    hasTasksOnDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.tasks.some(task => {
            if (task.dueDate) {
                const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
                return taskDate === dateStr && !task.completed;
            }
            return false;
        });
    }

    hasCompletedTasksOnDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.tasks.some(task => 
            task.completed && task.completedAt && 
            new Date(task.completedAt).toISOString().split('T')[0] === dateStr
        );
    }

    hasRemindersOnDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.reminders.some(reminder => {
            if (reminder.dateTime) {
                const reminderDate = new Date(reminder.dateTime).toISOString().split('T')[0];
                return reminderDate === dateStr && !reminder.completed;
            }
            return false;
        });
    }

    showDayDetails(dateStr) {
        const dayDetails = document.getElementById('dayDetails');
        const date = new Date(dateStr);
        
        const dayTasks = this.tasks.filter(task => {
            if (task.dueDate) {
                return new Date(task.dueDate).toISOString().split('T')[0] === dateStr;
            }
            return false;
        });

        const dayReminders = this.reminders.filter(reminder => {
            if (reminder.dateTime) {
                return new Date(reminder.dateTime).toISOString().split('T')[0] === dateStr;
            }
            return false;
        });

        const completedTasks = this.tasks.filter(task => 
            task.completed && task.completedAt && 
            new Date(task.completedAt).toISOString().split('T')[0] === dateStr
        );

        let content = `<h4>${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>`;

        if (dayTasks.length > 0) {
            content += '<h5>Tareas programadas:</h5><ul>';
            dayTasks.forEach(task => {
                content += `<li>${task.title} ${task.completed ? '✓' : ''}</li>`;
            });
            content += '</ul>';
        }

        if (dayReminders.length > 0) {
            content += '<h5>Recordatorios:</h5><ul>';
            dayReminders.forEach(reminder => {
                content += `<li>${reminder.title} ${reminder.completed ? '✓' : ''}</li>`;
            });
            content += '</ul>';
        }

        if (completedTasks.length > 0) {
            content += '<h5>Tareas completadas:</h5><ul>';
            completedTasks.forEach(task => {
                content += `<li>${task.title}</li>`;
            });
            content += '</ul>';
        }

        if (dayTasks.length === 0 && dayReminders.length === 0 && completedTasks.length === 0) {
            content += '<p>No hay actividades para este día.</p>';
        }

        dayDetails.innerHTML = content;
        dayDetails.classList.add('active');
    }

    // RECORDATORIOS
    resetReminderForm() {
        document.getElementById('reminderForm').reset();
    }

    saveReminder() {
        const titleInput = document.getElementById('reminderTitle');
        const descriptionInput = document.getElementById('reminderDescription');
        const dateTimeInput = document.getElementById('reminderDateTime');
        const typeInput = document.getElementById('reminderType');

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const dateTime = dateTimeInput.value;
        const type = typeInput.value;

        if (!title || !dateTime || !type) {
            this.showNotification('Error', 'Por favor, completa todos los campos requeridos.', 'error');
            return;
        }

        if (this.editingReminder) {
            // Editar recordatorio existente
            const reminder = this.reminders.find(r => r.id === this.editingReminder);
            if (reminder) {
                reminder.title = title;
                reminder.description = description;
                reminder.dateTime = dateTime;
                reminder.type = type;
                reminder.updatedAt = new Date().toISOString();
            }
            this.showNotification('Éxito', 'Recordatorio actualizado correctamente', 'success');
        } else {
            // Crear nuevo recordatorio
            const reminder = {
                id: Date.now(),
                title,
                description,
                dateTime,
                type,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.reminders.push(reminder);
            this.showNotification('Éxito', 'Recordatorio creado correctamente', 'success');
        }

        this.saveReminders();
        this.renderReminders();
        this.renderCalendar();
        
        document.getElementById('reminderModal').style.display = 'none';
        this.editingReminder = null;
    }

    editReminder(reminderId) {
        const reminder = this.reminders.find(r => r.id === reminderId);
        if (!reminder) return;

        this.editingReminder = reminderId;
        
        document.getElementById('reminderTitle').value = reminder.title;
        document.getElementById('reminderDescription').value = reminder.description || '';
        document.getElementById('reminderDateTime').value = reminder.dateTime;
        document.getElementById('reminderType').value = reminder.type;

        document.getElementById('reminderModalTitle').textContent = 'Editar Recordatorio';
        document.getElementById('reminderSubmitBtn').textContent = 'Actualizar Recordatorio';
        document.getElementById('reminderModal').style.display = 'block';
    }

    toggleReminder(reminderId) {
        const reminder = this.reminders.find(r => r.id === reminderId);
        if (reminder) {
            reminder.completed = !reminder.completed;
            reminder.completedAt = reminder.completed ? new Date().toISOString() : null;
            
            if (reminder.completed) {
                this.showNotification('Recordatorio completado', `Marcaste como completado: "${reminder.title}"`, 'success');
            }
            
            this.saveReminders();
            this.renderReminders();
            this.renderCalendar();
        }
    }

    deleteReminder(reminderId) {
        this.confirmAction('¿Estás seguro de que quieres eliminar este recordatorio?', () => {
            this.reminders = this.reminders.filter(r => r.id !== reminderId);
            this.saveReminders();
            this.renderReminders();
            this.renderCalendar();
            this.showNotification('Recordatorio eliminado', 'El recordatorio ha sido eliminado correctamente', 'info');
        });
    }

    renderReminders() {
        const activeFilter = document.querySelector('.reminder-filter-btn.active').dataset.filter;
        const reminderList = document.getElementById('reminder-list');

        let filteredReminders = this.reminders;

        if (activeFilter === 'pendientes') {
            filteredReminders = filteredReminders.filter(reminder => !reminder.completed);
        } else if (activeFilter === 'completados') {
            filteredReminders = filteredReminders.filter(reminder => reminder.completed);
        }

        // Ordenar por fecha
        filteredReminders.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

        if (filteredReminders.length === 0) {
            reminderList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No hay recordatorios que mostrar</p>';
            return;
        }

        reminderList.innerHTML = filteredReminders.map(reminder => {
            const date = new Date(reminder.dateTime);
            const isPast = date < new Date() && !reminder.completed;
            
            return `
                <li class="reminder-item ${reminder.completed ? 'completed' : ''}">
                    <div>
                        <h4>${reminder.title}</h4>
                        ${reminder.description ? `<p>${reminder.description}</p>` : ''}
                        <small>
                            ${date.toLocaleDateString()} ${date.toLocaleTimeString().slice(0, 5)} - 
                            ${reminder.type === 'once' ? 'Una vez' : 
                              reminder.type === 'daily' ? 'Diario' : 
                              reminder.type === 'weekly' ? 'Semanal' : 'Mensual'}
                            ${isPast ? ' - <span style="color: #facc15;">VENCIDO</span>' : ''}
                        </small>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-success" onclick="app.toggleReminder(${reminder.id})">
                            ${reminder.completed ? '↶' : '✓'}
                        </button>
                        <button class="btn btn-secondary" onclick="app.editReminder(${reminder.id})">✏️</button>
                        <button class="btn btn-danger" onclick="app.deleteReminder(${reminder.id})">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');
    }

    saveReminders() {
        localStorage.setItem('reminders', JSON.stringify(this.reminders));
    }

    checkReminders() {
        const now = new Date();
        const advanceTime = this.settings.reminderAdvance * 60 * 1000; // Convertir a milisegundos

        this.reminders.forEach(reminder => {
            if (!reminder.completed && !reminder.notified) {
                const reminderTime = new Date(reminder.dateTime);
                const timeDiff = reminderTime.getTime() - now.getTime();

                // Notificar si es tiempo o si está dentro del tiempo de anticipación
                if (timeDiff <= advanceTime && timeDiff > -60000) { // -60000 para evitar notificaciones repetidas
                    this.showNotification('Recordatorio', reminder.title, 'warning');
                    reminder.notified = true;
                    this.saveReminders();
                }
            }
        });
    }

    // METAS
    resetGoalForm() {
        document.getElementById('goalForm').reset();
    }

    saveGoal() {
        const titleInput = document.getElementById('goalTitle');
        const descriptionInput = document.getElementById('goalDescription');
        const categoryInput = document.getElementById('goalCategory');
        const typeInput = document.getElementById('goalType');
        const targetInput = document.getElementById('goalTarget');
        const deadlineInput = document.getElementById('goalDeadline');

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const category = categoryInput.value;
        const type = typeInput.value;
        const target = parseInt(targetInput.value);
        const deadline = deadlineInput.value;

        if (!title || !category || !type || !target || !deadline) {
            this.showNotification('Error', 'Por favor, completa todos los campos requeridos.', 'error');
            return;
        }

        if (this.editingGoal) {
            // Editar meta existente
            const goal = this.goals.find(g => g.id === this.editingGoal);
            if (goal) {
                goal.title = title;
                goal.description = description;
                goal.category = category;
                goal.type = type;
                goal.target = target;
                goal.deadline = deadline;
                goal.updatedAt = new Date().toISOString();
            }
            this.showNotification('Éxito', 'Meta actualizada correctamente', 'success');
        } else {
            // Crear nueva meta
            const goal = {
                id: Date.now(),
                title,
                description,
                category,
                type,
                target,
                deadline,
                progress: 0,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.goals.push(goal);
            this.showNotification('Éxito', 'Meta creada correctamente', 'success');
        }

        this.saveGoals();
        this.updateGoalProgress();
        this.renderGoals();
        
        document.getElementById('goalModal').style.display = 'none';
        this.editingGoal = null;
    }

    editGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        this.editingGoal = goalId;
        
        document.getElementById('goalTitle').value = goal.title;
        document.getElementById('goalDescription').value = goal.description || '';
        document.getElementById('goalCategory').value = goal.category;
        document.getElementById('goalType').value = goal.type;
        document.getElementById('goalTarget').value = goal.target;
        document.getElementById('goalDeadline').value = goal.deadline;

        document.getElementById('goalModalTitle').textContent = 'Editar Meta';
        document.getElementById('goalSubmitBtn').textContent = 'Actualizar Meta';
        document.getElementById('goalModal').style.display = 'block';
    }

    deleteGoal(goalId) {
        this.confirmAction('¿Estás seguro de que quieres eliminar esta meta?', () => {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoals();
            this.renderGoals();
            this.showNotification('Meta eliminada', 'La meta ha sido eliminada correctamente', 'info');
        });
    }

    updateGoalProgress() {
        this.goals.forEach(goal => {
            let progress = 0;

            switch(goal.type) {
                case 'time':
                    // Calcular tiempo total trabajado en la categoría
                    const categoryTasks = this.tasks.filter(task => 
                        task.category === goal.category && task.completed
                    );
                    const totalTime = categoryTasks.reduce((sum, task) => sum + task.timeSpent, 0);
                    progress = Math.min(totalTime / (goal.target * 3600), 1); // target en horas
                    break;

                case 'tasks':
                    // Contar tareas completadas en la categoría
                    const completedTasks = this.tasks.filter(task => 
                        task.category === goal.category && task.completed
                    ).length;
                    progress = Math.min(completedTasks / goal.target, 1);
                    break;

                case 'streak':
                    // Calcular racha actual
                    const streak = this.calculateStreak();
                    progress = Math.min(streak / goal.target, 1);
                    break;
            }

            goal.progress = progress;
            goal.completed = progress >= 1;
        });

        this.saveGoals();
    }

    renderGoals() {
        const activeFilter = document.querySelector('.goal-filter-btn.active').dataset.filter;
        const goalList = document.getElementById('goal-list');

        let filteredGoals = this.goals;

        if (activeFilter === 'activas') {
            filteredGoals = filteredGoals.filter(goal => !goal.completed && new Date(goal.deadline) >= new Date());
        } else if (activeFilter === 'completadas') {
            filteredGoals = filteredGoals.filter(goal => goal.completed);
        } else if (activeFilter === 'vencidas') {
            filteredGoals = filteredGoals.filter(goal => !goal.completed && new Date(goal.deadline) < new Date());
        }

        // Ordenar por fecha límite
        filteredGoals.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        if (filteredGoals.length === 0) {
            goalList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No hay metas que mostrar</p>';
            return;
        }

        goalList.innerHTML = filteredGoals.map(goal => {
            const deadline = new Date(goal.deadline);
            const isOverdue = deadline < new Date() && !goal.completed;
            const progressPercent = Math.round(goal.progress * 100);
            
            let currentValue = 0;
            switch(goal.type) {
                case 'time':
                    const categoryTasks = this.tasks.filter(task => 
                        task.category === goal.category && task.completed
                    );
                    currentValue = Math.round(categoryTasks.reduce((sum, task) => sum + task.timeSpent, 0) / 3600);
                    break;
                case 'tasks':
                    currentValue = this.tasks.filter(task => 
                        task.category === goal.category && task.completed
                    ).length;
                    break;
                case 'streak':
                    currentValue = this.calculateStreak();
                    break;
            }

            return `
                <li class="goal-item ${goal.completed ? 'completed' : ''}">
                    <div>
                        <h4>${goal.title}</h4>
                        ${goal.description ? `<p>${goal.description}</p>` : ''}
                        <div class="goal-status">
                            <span class="category-badge category-${goal.category}">${goal.category}</span>
                            <span>Progreso: ${currentValue}/${goal.target} ${goal.type === 'time' ? 'horas' : goal.type === 'tasks' ? 'tareas' : 'días'}</span>
                            <span>Fecha límite: ${deadline.toLocaleDateString()}</span>
                            ${isOverdue ? '<span style="color: #facc15;">VENCIDA</span>' : ''}
                        </div>
                        <div class="goal-progress">
                            <div class="goal-progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                        <small>${progressPercent}% completado</small>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="app.editGoal(${goal.id})">✏️</button>
                        <button class="btn btn-danger" onclick="app.deleteGoal(${goal.id})">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');
    }

    saveGoals() {
        localStorage.setItem('goals', JSON.stringify(this.goals));
    }

    // REPORTES
    renderReports() {
        const period = document.getElementById('reportPeriod').value;
        const reportOutput = document.getElementById('report-output');
        
        const data = this.getReportData(period);
        
        let html = `
            <div class="report-section">
                <h3>Resumen General</h3>
                <div class="report-stats">
                    <div class="report-stat">
                        <span class="report-stat-value">${data.totalTasks}</span>
                        <span class="report-stat-label">Tareas Totales</span>
                    </div>
                    <div class="report-stat">
                        <span class="report-stat-value">${data.completedTasks}</span>
                        <span class="report-stat-label">Tareas Completadas</span>
                    </div>
                    <div class="report-stat">
                        <span class="report-stat-value">${data.completionRate}%</span>
                        <span class="report-stat-label">Tasa de Completado</span>
                    </div>
                    <div class="report-stat">
                        <span class="report-stat-value">${this.formatTime(data.totalTime)}</span>
                        <span class="report-stat-label">Tiempo Total</span>
                    </div>
                </div>
            </div>
        `;

        if (data.categoryStats.length > 0) {
            html += `
                <div class="report-section">
                    <h3>Productividad por Categoría</h3>
                    <div class="report-stats">
                        ${data.categoryStats.map(cat => `
                            <div class="report-stat">
                                <span class="report-stat-value">${cat.completed}/${cat.total}</span>
                                <span class="report-stat-label">${cat.category}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        reportOutput.innerHTML = html;
    }

    getReportData(period) {
        let startDate = new Date();
        const endDate = new Date();

        switch(period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'all':
                startDate = new Date(0);
                break;
        }

        const filteredTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= startDate && taskDate <= endDate;
        });

        const completedTasks = filteredTasks.filter(task => task.completed).length;
        const totalTasks = filteredTasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const totalTime = this.timeEntries
            .filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= startDate && entryDate <= endDate;
            })
            .reduce((sum, entry) => sum + entry.duration, 0);

        // Estadísticas por categoría
        const categories = ['personal', 'trabajo', 'estudio', 'salud'];
        const categoryStats = categories.map(category => {
            const categoryTasks = filteredTasks.filter(task => task.category === category);
            const categoryCompleted = categoryTasks.filter(task => task.completed).length;
            return {
                category,
                total: categoryTasks.length,
                completed: categoryCompleted
            };
        }).filter(cat => cat.total > 0);

        return {
            totalTasks,
            completedTasks,
            completionRate,
            totalTime,
            categoryStats
        };
    }

    exportReport() {
        const period = document.getElementById('reportPeriod').value;
        const data = this.getReportData(period);
        
        const report = {
            period,
            generatedAt: new Date().toISOString(),
            summary: data,
            tasks: this.tasks,
            timeEntries: this.timeEntries
        };

        this.downloadJSON(report, `reporte_productividad_${period}_${new Date().toISOString().split('T')[0]}.json`);
        this.showNotification('Reporte exportado', 'El reporte ha sido exportado correctamente', 'success');
    }

    // UTILIDADES
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    confirmAction(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'block';
        this.confirmCallback = callback;
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportAllData() {
        const data = {
            tasks: this.tasks,
            reminders: this.reminders,
            goals: this.goals,
            timeEntries: this.timeEntries,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        this.downloadJSON(data, `cogeme_el_paso_backup_${new Date().toISOString().split('T')[0]}.json`);
        this.showNotification('Datos exportados', 'Todos los datos han sido exportados correctamente', 'success');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.tasks) this.tasks = data.tasks;
                if (data.reminders) this.reminders = data.reminders;
                if (data.goals) this.goals = data.goals;
                if (data.timeEntries) this.timeEntries = data.timeEntries;
                if (data.settings) this.settings = { ...this.settings, ...data.settings };

                // Guardar en localStorage
                this.saveTasks();
                this.saveReminders();
                this.saveGoals();
                this.saveSettings();
                localStorage.setItem('timeEntries', JSON.stringify(this.timeEntries));

                // Actualizar UI
                this.applyTheme();
                this.loadSettings();
                this.renderDashboard();
                this.renderTasks();
                this.renderReminders();
                this.renderGoals();
                this.renderCalendar();
                this.renderReports();
                this.updateStopwatchTasks();

                this.showNotification('Datos importados', 'Los datos han sido importados correctamente', 'success');
            } catch (error) {
                this.showNotification('Error', 'Error al importar los datos. Verifica que el archivo sea válido.', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        localStorage.clear();
        location.reload();
    }
}

// Inicializar la aplicación
const app = new TimeManagementApp();

