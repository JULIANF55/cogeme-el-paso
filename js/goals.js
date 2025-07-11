// goals.js
class GoalsModule {
    constructor(appInstance) {
        this.app = appInstance;
        this.editingGoal = null;
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

        container.innerHTML = filteredGoals.map(goal => {
            const progress = this.calculateGoalProgress(goal);
            const isOverdue = !goal.completed && new Date(goal.deadline) < new Date();
            return `
                <li class="goal-item ${goal.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-goal-id="${goal.id}">
                    <div class="goal-content">
                        <h4>${Utils.sanitizeHTML(goal.title)}</h4>
                        <p>${Utils.sanitizeHTML(goal.description || '')}</p>
                        <div class="goal-meta">
                            <span>Categoría: ${goal.category}</span>
                            <span>Tipo: ${goal.type}</span>
                            <span>Objetivo: ${goal.target}</span>
                            <span>Fecha límite: ${Utils.formatDateShort(new Date(goal.deadline))}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <p class="progress-text">${progress}% completado</p>
                    </div>
                    <div class="goal-actions">
                        <button class="btn-icon" onclick="window.goalsModule.editGoal('${goal.id}')" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="window.goalsModule.toggleGoalComplete('${goal.id}')" title="${goal.completed ? 'Marcar como activa' : 'Marcar como completada'}">${goal.completed ? '↶' : '✓'}</button>
                        <button class="btn-icon" onclick="window.goalsModule.deleteGoal('${goal.id}')" title="Eliminar">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');
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

    toggleGoalComplete(goalId) {
        const goal = this.app.goals.find(g => g.id === goalId);
        if (goal) {
            goal.completed = !goal.completed;
            goal.completedAt = goal.completed ? new Date() : null;
            this.app.storage.set('goals', this.app.goals);
            this.renderGoals();
            this.app.updateDashboardStats();
            if (goal.completed) {
                Utils.showToast('¡Meta completada!', 'success');
                this.app.playSound('success');
            } else {
                Utils.showToast('Meta marcada como activa', 'info');
            }
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
