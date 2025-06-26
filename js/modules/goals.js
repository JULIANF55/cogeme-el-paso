// Módulo de metas y objetivos
class GoalManager {
    constructor() {
        this.goals = [];
        this.init();
    }

    init() {
        this.loadGoals();
        this.setupEventListeners();
        this.renderGoals();
    }

    setupEventListeners() {
        const addGoalBtn = document.getElementById('add-goal');
        const goalTitle = document.getElementById('goal-title');

        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => this.addGoal());
        }

        if (goalTitle) {
            goalTitle.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addGoal();
                }
            });
        }
    }

    addGoal() {
        const goalTitle = document.getElementById('goal-title');
        const goalDescription = document.getElementById('goal-description');
        const goalDeadline = document.getElementById('goal-deadline');
        const goalCategory = document.getElementById('goal-category');

        if (!goalTitle || !goalDescription || !goalDeadline || !goalCategory) return;

        const title = goalTitle.value.trim();
        const description = goalDescription.value.trim();
        const deadline = goalDeadline.value;
        const category = goalCategory.value;

        if (!title) {
            window.notifications.warning('Por favor, ingresa el título de la meta');
            return;
        }

        if (!deadline) {
            window.notifications.warning('Por favor, selecciona una fecha límite');
            return;
        }

        const deadlineDate = new Date(deadline);
        const now = new Date();

        if (deadlineDate <= now) {
            window.notifications.warning('La fecha límite debe ser futura');
            return;
        }

        const goal = {
            id: Helpers.generateId(),
            title,
            description,
            deadline: deadlineDate.toISOString(),
            category,
            completed: false,
            progress: 0,
            createdAt: new Date().toISOString(),
            completedAt: null,
            milestones: [],
            notes: ''
        };

        this.goals.push(goal);
        this.saveGoals();
        this.renderGoals();

        // Limpiar formulario
        goalTitle.value = '';
        goalDescription.value = '';
        goalDeadline.value = '';

        window.notifications.success('Meta agregada correctamente');
    }

    updateGoalProgress(goalId, progress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        progress = Math.max(0, Math.min(100, progress));
        goal.progress = progress;

        if (progress >= 100 && !goal.completed) {
            goal.completed = true;
            goal.completedAt = new Date().toISOString();
            window.notifications.success(`¡Meta completada: ${goal.title}!`);
        } else if (progress < 100 && goal.completed) {
            goal.completed = false;
            goal.completedAt = null;
        }

        this.saveGoals();
        this.renderGoals();
    }

    addMilestone(goalId, milestoneText) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || !milestoneText.trim()) return;

        const milestone = {
            id: Helpers.generateId(),
            text: milestoneText.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        goal.milestones.push(milestone);
        this.saveGoals();
        this.renderGoals();
        
        window.notifications.success('Hito agregado a la meta');
    }

    toggleMilestone(goalId, milestoneId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const milestone = goal.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        milestone.completed = !milestone.completed;
        milestone.completedAt = milestone.completed ? new Date().toISOString() : null;

        // Actualizar progreso automáticamente basado en hitos
        const completedMilestones = goal.milestones.filter(m => m.completed).length;
        const totalMilestones = goal.milestones.length;
        
        if (totalMilestones > 0) {
            const autoProgress = Math.round((completedMilestones / totalMilestones) * 100);
            this.updateGoalProgress(goalId, autoProgress);
        }

        this.saveGoals();
        this.renderGoals();
    }

    deleteGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        // Mostrar confirmación
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');

        if (!modal) return;

        modalTitle.textContent = 'Eliminar Meta';
        modalMessage.textContent = `¿Estás seguro de que quieres eliminar la meta "${goal.title}"?`;
        modal.classList.add('active');

        const handleConfirm = () => {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoals();
            this.renderGoals();
            modal.classList.remove('active');
            window.notifications.success('Meta eliminada');
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

    renderGoals() {
        const goalsList = document.getElementById('goals-list');
        if (!goalsList) return;

        if (this.goals.length === 0) {
            goalsList.innerHTML = `
                <div class="no-goals">
                    <p>No hay metas configuradas</p>
                    <small>Agrega una meta para comenzar a trabajar hacia tus objetivos</small>
                </div>
            `;
            return;
        }

        // Ordenar metas: activas primero, luego por fecha límite
        const sortedGoals = this.goals.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(a.deadline) - new Date(b.deadline);
        });

        goalsList.innerHTML = '';

        sortedGoals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = `goal-item ${goal.completed ? 'completed' : ''}`;
            
            const now = new Date();
            const deadline = new Date(goal.deadline);
            const isOverdue = deadline < now && !goal.completed;
            
            if (isOverdue) {
                goalElement.classList.add('overdue');
            }

            const timeRemaining = this.getTimeRemaining(goal.deadline);
            const deadlineDisplay = Helpers.formatDate(goal.deadline);

            goalElement.innerHTML = `
                <div class="goal-header">
                    <div>
                        <div class="goal-title">${Helpers.escapeHtml(goal.title)}</div>
                        <span class="goal-category ${goal.category}">${this.getCategoryLabel(goal.category)}</span>
                    </div>
                    <div class="goal-progress-text">${goal.progress}%</div>
                </div>
                
                <div class="goal-description">${Helpers.escapeHtml(goal.description)}</div>
                
                <div class="goal-deadline">
                    📅 Fecha límite: ${deadlineDisplay}
                    ${isOverdue ? '<span class="overdue-text">⚠️ Vencida</span>' : 
                      timeRemaining ? `<span class="time-remaining">(${timeRemaining})</span>` : ''}
                </div>
                
                <div class="goal-progress">
                    <div class="goal-progress-bar" style="width: ${goal.progress}%"></div>
                </div>
                
                ${goal.milestones.length > 0 ? `
                    <div class="goal-milestones">
                        <h4>Hitos (${goal.milestones.filter(m => m.completed).length}/${goal.milestones.length})</h4>
                        <ul>
                            ${goal.milestones.map(milestone => `
                                <li class="${milestone.completed ? 'completed' : ''}">
                                    <input type="checkbox" ${milestone.completed ? 'checked' : ''} 
                                           onchange="window.goalManager.toggleMilestone('${goal.id}', '${milestone.id}')">
                                    <span>${Helpers.escapeHtml(milestone.text)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="goal-controls">
                    <button class="btn-primary" onclick="window.goalManager.showProgressModal('${goal.id}')" title="Actualizar progreso">
                        📊 Progreso
                    </button>
                    <button class="btn-secondary" onclick="window.goalManager.showMilestoneModal('${goal.id}')" title="Agregar hito">
                        🎯 Hito
                    </button>
                    <button class="btn-success" onclick="window.goalManager.updateGoalProgress('${goal.id}', 100)" title="Marcar como completada" ${goal.completed ? 'disabled' : ''}>
                        ✅
                    </button>
                    <button class="btn-danger" onclick="window.goalManager.deleteGoal('${goal.id}')" title="Eliminar meta">
                        🗑️
                    </button>
                </div>
            `;

            goalsList.appendChild(goalElement);
        });
    }

    showProgressModal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');

        if (!modal) return;

        modalTitle.textContent = 'Actualizar Progreso';
        modalMessage.innerHTML = `
            <p>Meta: ${Helpers.escapeHtml(goal.title)}</p>
            <p>Progreso actual: ${goal.progress}%</p>
            <label for="progress-input">Nuevo progreso (0-100):</label>
            <input type="number" id="progress-input" min="0" max="100" value="${goal.progress}" style="width: 100%; margin-top: 10px;">
        `;
        modal.classList.add('active');

        const progressInput = document.getElementById('progress-input');
        progressInput.focus();

        const handleConfirm = () => {
            const newProgress = parseInt(progressInput.value) || 0;
            this.updateGoalProgress(goalId, newProgress);
            modal.classList.remove('active');
            cleanup();
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            }
        };

        const cleanup = () => {
            modalConfirm.removeEventListener('click', handleConfirm);
            modalCancel.removeEventListener('click', handleCancel);
            progressInput.removeEventListener('keypress', handleKeyPress);
        };

        modalConfirm.addEventListener('click', handleConfirm);
        modalCancel.addEventListener('click', handleCancel);
        progressInput.addEventListener('keypress', handleKeyPress);
    }

    showMilestoneModal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');

        if (!modal) return;

        modalTitle.textContent = 'Agregar Hito';
        modalMessage.innerHTML = `
            <p>Meta: ${Helpers.escapeHtml(goal.title)}</p>
            <label for="milestone-input">Descripción del hito:</label>
            <input type="text" id="milestone-input" placeholder="Ej: Completar investigación inicial" style="width: 100%; margin-top: 10px;">
        `;
        modal.classList.add('active');

        const milestoneInput = document.getElementById('milestone-input');
        milestoneInput.focus();

        const handleConfirm = () => {
            const milestoneText = milestoneInput.value.trim();
            if (milestoneText) {
                this.addMilestone(goalId, milestoneText);
                modal.classList.remove('active');
            } else {
                window.notifications.warning('Por favor, ingresa la descripción del hito');
            }
            cleanup();
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            }
        };

        const cleanup = () => {
            modalConfirm.removeEventListener('click', handleConfirm);
            modalCancel.removeEventListener('click', handleCancel);
            milestoneInput.removeEventListener('keypress', handleKeyPress);
        };

        modalConfirm.addEventListener('click', handleConfirm);
        modalCancel.addEventListener('click', handleCancel);
        milestoneInput.addEventListener('keypress', handleKeyPress);
    }

    getTimeRemaining(deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate - now;

        if (diff <= 0) return null;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `${days} día${days !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hora${hours !== 1 ? 's' : ''}`;
        } else {
            return 'Menos de 1 hora';
        }
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

    // Obtener metas próximas a vencer
    getUpcomingDeadlines(days = 7) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);

        return this.goals.filter(goal => {
            if (goal.completed) return false;
            const deadline = new Date(goal.deadline);
            return deadline >= now && deadline <= futureDate;
        }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }

    // Obtener metas vencidas
    getOverdueGoals() {
        const now = new Date();
        return this.goals.filter(goal => {
            if (goal.completed) return false;
            const deadline = new Date(goal.deadline);
            return deadline < now;
        });
    }

    // Obtener estadísticas
    getStats() {
        const total = this.goals.length;
        const completed = this.goals.filter(g => g.completed).length;
        const pending = total - completed;
        const overdue = this.getOverdueGoals().length;
        const upcoming = this.getUpcomingDeadlines().length;

        const avgProgress = total > 0 ? 
            this.goals.reduce((sum, goal) => sum + goal.progress, 0) / total : 0;

        const categoryStats = {};
        this.goals.forEach(goal => {
            if (!categoryStats[goal.category]) {
                categoryStats[goal.category] = { total: 0, completed: 0, avgProgress: 0 };
            }
            categoryStats[goal.category].total++;
            if (goal.completed) {
                categoryStats[goal.category].completed++;
            }
        });

        // Calcular progreso promedio por categoría
        Object.keys(categoryStats).forEach(category => {
            const categoryGoals = this.goals.filter(g => g.category === category);
            const totalProgress = categoryGoals.reduce((sum, goal) => sum + goal.progress, 0);
            categoryStats[category].avgProgress = categoryGoals.length > 0 ? 
                totalProgress / categoryGoals.length : 0;
        });

        return {
            total,
            completed,
            pending,
            overdue,
            upcoming,
            avgProgress: avgProgress.toFixed(1),
            completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0,
            categoryStats
        };
    }

    // Persistencia
    saveGoals() {
        window.storage.save('goals', this.goals);
    }

    loadGoals() {
        this.goals = window.storage.load('goals', []);
    }

    // Exportar metas
    exportGoals() {
        const data = {
            goals: this.goals,
            stats: this.getStats(),
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const filename = `metas_${new Date().toISOString().split('T')[0]}.json`;
        
        Helpers.downloadAsFile(jsonString, filename, 'application/json');
        window.notifications.success('Metas exportadas correctamente');
    }

    // Importar metas
    async importGoals(file) {
        try {
            const content = await Helpers.readFileAsText(file);
            const data = JSON.parse(content);
            
            if (data.goals && Array.isArray(data.goals)) {
                // Filtrar metas futuras
                const futureGoals = data.goals.filter(goal => {
                    const deadline = new Date(goal.deadline);
                    return deadline > new Date();
                });

                this.goals = [...this.goals, ...futureGoals];
                this.saveGoals();
                this.renderGoals();
                
                window.notifications.success(`${futureGoals.length} metas importadas`);
            } else {
                window.notifications.error('Archivo de metas inválido');
            }
        } catch (error) {
            console.error('Error al importar metas:', error);
            window.notifications.error('Error al importar el archivo');
        }
    }

    // Generar reporte de metas
    generateGoalsReport() {
        const stats = this.getStats();
        const upcomingDeadlines = this.getUpcomingDeadlines();
        const overdueGoals = this.getOverdueGoals();

        return {
            summary: stats,
            upcomingDeadlines,
            overdueGoals,
            recommendations: this.generateGoalRecommendations(stats, overdueGoals)
        };
    }

    generateGoalRecommendations(stats, overdueGoals) {
        const recommendations = [];

        if (stats.avgProgress < 30) {
            recommendations.push({
                type: 'progress',
                message: 'Tu progreso promedio es bajo. Considera dividir tus metas en hitos más pequeños y alcanzables.',
                priority: 'high'
            });
        }

        if (overdueGoals.length > 0) {
            recommendations.push({
                type: 'overdue',
                message: `Tienes ${overdueGoals.length} meta(s) vencida(s). Revisa si siguen siendo relevantes o ajusta las fechas límite.`,
                priority: 'high'
            });
        }

        if (stats.total > 10) {
            recommendations.push({
                type: 'quantity',
                message: 'Tienes muchas metas activas. Considera enfocarte en las más importantes para mejorar tu efectividad.',
                priority: 'medium'
            });
        }

        if (stats.completionRate < 20 && stats.total > 5) {
            recommendations.push({
                type: 'completion',
                message: 'Tu tasa de completado de metas es baja. Asegúrate de que tus metas sean realistas y específicas.',
                priority: 'medium'
            });
        }

        return recommendations;
    }
}

// Instancia global
window.goalManager = new GoalManager();

