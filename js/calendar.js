// goals.js

// goals.js - Reescrito para que el botón de completar meta sume solo 1 día por clic de manera incremental y actualice correctamente la barra de progreso.

class GoalsModule {
    constructor(appInstance) {
        this.app = appInstance;
    }

    toggleGoalComplete(goalId) {
        const goal = this.app.goals.find(g => g.id === goalId);
        if (!goal) return;

        if (!goal.progress) goal.progress = 0;
        if (!goal.completed) {
            goal.progress += 1;
            if (goal.progress >= goal.target) {
                goal.progress = goal.target;
                goal.completed = true;
                goal.completedAt = new Date();
                Utils.showToast('¡Meta completada!', 'success');
                this.app.playSound('success');
            } else {
                Utils.showToast(`Progreso: ${goal.progress}/${goal.target}`, 'info');
            }
        } else {
            // Reiniciar meta si está completada y se hace clic en "Reabrir"
            goal.completed = false;
            goal.progress = 0;
            goal.completedAt = null;
            Utils.showToast('La meta ha sido reiniciada. ¡Puedes comenzar de nuevo!', 'info');
        }

        this.app.storage.set('goals', this.app.goals);
        this.renderGoals();
        this.app.updateDashboardStats();
    }

    setupListeners() {
        const addBtn = document.getElementById('addGoalBtn');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showGoalModal();
            });
        }
        // Add listeners for goal filters if they exist
        document.querySelectorAll('.goal-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setGoalFilter(e.target.dataset.filter);
            });
        });

        const goalForm = document.getElementById('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGoal();
            });
        }
    }

    showGoalModal(goal = null) {
        this.editingGoal = goal;
        const modal = document.getElementById('goalModal');
        const title = document.getElementById('goalModalTitle');
        const submitBtn = document.getElementById('goalSubmitBtn');

        if (goal) {
            title.textContent = 'Editar Meta';
            submitBtn.textContent = 'Actualizar Meta';
            this.populateGoalForm(goal);
        } else {
            title.textContent = 'Nueva Meta';
            submitBtn.textContent = 'Crear Meta';
            this.resetGoalForm();
        }

        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    populateGoalForm(goal) {
        document.getElementById('goalTitle').value = goal.title || '';
        document.getElementById('goalDescription').value = goal.description || '';
        document.getElementById('goalCategory').value = goal.category || '';
        document.getElementById('goalType').value = goal.type || '';
        document.getElementById('goalTarget').value = goal.target || '';
        if (goal.deadline) {
            document.getElementById('goalDeadline').value = new Date(goal.deadline).toISOString().split('T')[0];
        }
    }

    resetGoalForm() {
        document.getElementById('goalForm').reset();
    }

    saveGoal() {
        const form = document.getElementById('goalForm');
        const formData = new FormData(form);

        const goalData = {
            title: document.getElementById("goalTitle").value.trim(),
            description: document.getElementById("goalDescription").value.trim() || 
            "",
            category: document.getElementById("goalCategory").value,
            type: document.getElementById("goalType").value,
            target: parseInt(document.getElementById("goalTarget").value) || 0,
            deadline: document.getElementById("goalDeadline").value || null
        };


        if (!goalData.title || !goalData.category || !goalData.type || !goalData.target || !goalData.deadline) {
            Utils.showToast('Por favor completa todos los campos requeridos para la meta', 'error');
            return;
        }

        if (this.editingGoal) {
            const index = this.app.goals.findIndex(g => g.id === this.editingGoal.id);
            if (index !== -1) {
                this.app.goals[index] = { ...this.app.goals[index], ...goalData, updatedAt: new Date() };
                Utils.showToast('Meta actualizada', 'success');
            }
        } else {
            const newGoal = {
                id: Utils.generateId(),
                ...goalData,
                completed: false,
                progress: 0, // Initial progress
                createdAt: new Date()
            };
            this.app.goals.push(newGoal);
            Utils.showToast('Meta creada', 'success');
        }

        this.app.storage.set('goals', this.app.goals);
        this.renderGoals();
        this.app.updateDashboardStats();
        this.app.hideModal('goalModal');
    }

    renderGoals() {
        const container = document.getElementById('goal-list');
        if (!container) return;

        const activeFilter = document.querySelector('.goal-filter-btn.active')?.dataset.filter || 'todas';
        let filteredGoals = this.app.goals;

        if (activeFilter !== 'todas') {
            filteredGoals = filteredGoals.filter(goal => {
                switch (activeFilter) {
                    case 'activas':
                        return !goal.completed && new Date(goal.deadline) >= new Date();
                    case 'completadas':
                        return goal.completed;
                    case 'vencidas':
                        return !goal.completed && new Date(goal.deadline) < new Date();
                    default:
                        return true;
                }
            });
        }
        
        if (filteredGoals.length === 0) {
            container.innerHTML = '<li class="empty-state">No hay metas configuradas para este filtro.</li>';
            return;
        }

        container.innerHTML = filteredGoals.map((goal, index) => {
            const today = new Date();
            const startDate = new Date(goal.createdAt);
            const deadlineDate = new Date(goal.deadline);

            // Usar goal.progress como días actuales completados
            const daysCurrent = goal.progress || 0;
            // Días restantes = meta.target - progreso actual
            const daysRemaining = Math.max(0, goal.target - daysCurrent);

            // Progreso en porcentaje
            const progress = Math.min(100, Math.round((daysCurrent / goal.target) * 100));

            const isOverdue = !goal.completed && new Date(goal.deadline) < today;
            const backgroundClass = index % 2 === 0 ? 'goal-bg-primary' : 'goal-bg-secondary';
            const progressColor = this.getProgressColor(goal.type, progress);

            return `
                <li class="goal-item-enhanced ${backgroundClass} ${goal.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-goal-id="${goal.id}">
                    <div class="goal-card">
                        <div class="goal-header">
                            <div class="goal-title-section">
                                <h4 class="goal-title">${Utils.sanitizeHTML(goal.title)}</h4>
                                <span class="goal-type-badge ${goal.type}">${this.getTypeLabel(goal.type)}</span>
                            </div>
                            <div class="goal-status">
                                ${goal.completed ? '<span class="status-completed">✓ Completada</span>' : 
                                  isOverdue ? '<span class="status-overdue">⚠ Vencida</span>' : 
                                  `<span class="status-active"><span class="dias-restantes">${daysRemaining}</span> días restantes</span>`}
                            </div>
                        </div>
                        <div class="goal-body">
                            ${goal.description ? `<p class="goal-description">${Utils.sanitizeHTML(goal.description)}</p>` : ''}
                            <div class="goal-details">
                                <div class="goal-detail-item">
                                    <span class="detail-label">Categoría:</span>
                                    <span class="detail-value category-${goal.category}">${goal.category}</span>
                                </div>
                                <div class="goal-detail-item">
                                    <span class="detail-label">Objetivo:</span>
                                    <span class="detail-value">${goal.target} ${this.getTargetUnit(goal.type)}</span>
                                </div>
                                <div class="goal-detail-item">
                                    <span class="detail-label">Fecha límite:</span>
                                    <span class="detail-value">${Utils.formatDateShort(deadlineDate)}</span>
                                </div>
                                <div class="goal-detail-item">
                                    <span class="detail-label">Días actuales:</span>
                                    <span class="detail-value dias-actuales">${daysCurrent}</span>
                                </div>
                            </div>
                            <div class="goal-progress-section">
                                <div class="progress-header">
                                    <span class="progress-label">Progreso</span>
                                    <span class="progress-percentage">${progress}%</span>
                                </div>
                                <div class="progress-bar-enhanced">
                                    <div class="progress-fill-enhanced ${progressColor}" style="width: ${progress}%"></div>
                                </div>
                                <div class="progress-details">
                                    <div class="progress-stats">
                                        <span class="stat-item">
                                            <span class="stat-label">Actual:</span>
                                            <span class="stat-value">${daysCurrent} ${this.getTargetUnit(goal.type)}</span>
                                        </span>
                                        <span class="stat-item">
                                            <span class="stat-label">Restante:</span>
                                            <span class="stat-value">${daysRemaining} ${this.getTargetUnit(goal.type)}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="goal-footer">
                            <div class="goal-actions">
                                <button class="btn-action edit" onclick="window.goalsModule.editGoal('${goal.id}')" title="Editar meta">
                                    <span class="action-icon">✏️</span>
                                    <span class="action-text">Editar</span>
                                </button>
                                <button class="btn-action ${goal.completed ? 'reopen' : 'complete'}" onclick="window.goalsModule.toggleGoalComplete('${goal.id}')" title="${goal.completed ? 'Marcar como activa' : 'Marcar como completada'}">
                                    <span class="action-icon">${goal.completed ? '↶' : '✓'}</span>
                                    <span class="action-text">${goal.completed ? 'Reabrir' : 'Completar'}</span>
                                </button>
                                <button class="btn-action delete" onclick="window.goalsModule.deleteGoal('${goal.id}')" title="Eliminar meta">
                                    <span class="action-icon">🗑️</span>
                                    <span class="action-text">Eliminar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </li>
            `;
        }).join('');
    }
    
    getTypeLabel(type) {
        const labels = {
            'tasks': 'Tareas',
            'time': 'Tiempo',
            'streak': 'Racha',
            'habit': 'Hábito'
        };
        return labels[type] || type;
    }
    
    getTargetUnit(type) {
        const units = {
            'tasks': 'tareas',
            'time': 'horas',
            'streak': 'días',
            'habit': 'días'
        };
        return units[type] || 'unidades';
    }
    
    getProgressColor(type, progress) {
        if (progress >= 100) return 'progress-complete';
        if (progress >= 75) return 'progress-high';
        if (progress >= 50) return 'progress-medium';
        if (progress >= 25) return 'progress-low';
        return 'progress-minimal';
    }
    
    getProgressDetails(goal, progress) {
        const currentValue = this.calculateCurrentValue(goal);
        const remaining = Math.max(0, goal.target - currentValue);
        
        return `
            <div class="progress-stats">
                <span class="stat-item">
                    <span class="stat-label">Actual:</span>
                    <span class="stat-value">${currentValue} ${this.getTargetUnit(goal.type)}</span>
                </span>
                <span class="stat-item">
                    <span class="stat-label">Restante:</span>
                    <span class="stat-value">${remaining} ${this.getTargetUnit(goal.type)}</span>
                </span>
            </div>
        `;
    }
    
    calculateCurrentValue(goal) {
        switch (goal.type) {
            case 'tasks':
                const relevantTasks = this.app.tasks.filter(task => 
                    task.completed && 
                    (task.category === goal.category || task.description.includes(goal.title))
                );
                return relevantTasks.length;
                
            case 'time':
                const relevantTime = this.app.timeEntries.filter(entry => {
                    const task = this.app.tasks.find(t => t.id === entry.taskId);
                    return task && (task.category === goal.category || task.description.includes(goal.title));
                }).reduce((sum, entry) => sum + (entry.seconds || entry.duration || 0), 0);
                return Math.floor(relevantTime / 3600); // Convert to hours
                
            case 'streak':
                // Calcular racha actual
                return this.calculateCurrentStreak(goal);
                
            default:
                return 0;
        }
    }
    
    calculateCurrentStreak(goal) {
        let streak = 0;
        let currentDate = new Date();
        const startDate = new Date(goal.createdAt);
        
        while (currentDate >= startDate && streak < 365) {
            const dayStart = Utils.getStartOfDay(currentDate);
            const hasActivityThatDay = this.app.tasks.some(task => 
                task.completed && 
                task.completedAt && 
                Utils.isSameDay(new Date(task.completedAt), dayStart) &&
                task.category === goal.category
            );
            
            if (hasActivityThatDay) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }

    setGoalFilter(filter) {
        document.querySelectorAll('.goal-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderGoals();
    }

    calculateGoalProgress(goal) {
        // This is a simplified calculation. In a real app, you'd link this to tasks.
        // For now, let's base it on a random number or a simple increment.
        // If the goal is completed, it's 100%.
        if (goal.completed) return 100;

        let currentProgress = 0;
        switch (goal.type) {
            case 'tasks':
                // Count completed tasks related to this goal's category or description
                const relevantTasks = this.app.tasks.filter(task => 
                    task.completed && 
                    (task.category === goal.category || task.description.includes(goal.title))
                );
                currentProgress = relevantTasks.length;
                return Utils.calculatePercentage(currentProgress, goal.target);
            case 'time':
                // Sum time entries related to this goal's category or description
                const relevantTime = this.app.timeEntries.filter(entry => {
                    const task = this.app.tasks.find(t => t.id === entry.taskId);
                    return task && (task.category === goal.category || task.description.includes(goal.title));
                }).reduce((sum, entry) => sum + (entry.seconds || entry.duration || 0), 0);
                currentProgress = Math.floor(relevantTime / 3600); // Convert seconds to hours
                return Utils.calculatePercentage(currentProgress, goal.target);
            case 'streak':
                // This would require a more complex logic to track consecutive days
                // For now, let's just use a placeholder.
                return Math.min(100, Math.floor(Math.random() * 100));
            default:
                return Math.min(100, Math.floor(Math.random() * 100)); // Placeholder
        }
    }

    editGoal(goalId) {
        const goal = this.app.goals.find(g => g.id === goalId);
        if (goal) {
            this.showGoalModal(goal);
        }
    }

    deleteGoal(goalId) {
        if (confirm("¿Estás seguro de que quieres eliminar esta meta?")) {
            this.app.goals = this.app.goals.filter(g => g.id !== goalId);
            this.app.storage.set("goals", this.app.goals);
            this.renderGoals();
            this.app.updateDashboardStats();
            Utils.showToast("Meta eliminada", "info");
        }
    }

    highlightGoal(goalId) {
        setTimeout(() => {
            const goalElement = document.querySelector(`[data-goal-id="${goalId}"]`);
            if (goalElement) {
                goalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                goalElement.classList.add('highlight');
                setTimeout(() => goalElement.classList.remove('highlight'), 2000);
            }
        }, 500);
    }
}
