// reminders.js
class RemindersModule {
    constructor(appInstance) {
        this.app = appInstance;
        this.editingReminder = null;
    }

    setupListeners() {
        const addBtn = document.getElementById('addReminderBtn');
        const testBtn = document.getElementById('testNotificationBtn');
        
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showReminderModal();
            });
        }
        
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.app.showNotification('Prueba de notificación', 'Las notificaciones están funcionando correctamente', 'info');
            });
        }

        const reminderForm = document.getElementById('reminderForm');
        if (reminderForm) {
            reminderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveReminder();
            });
        }

        document.querySelectorAll('.reminder-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setReminderFilter(e.target.dataset.filter);
            });
        });
    }

    showReminderModal(reminder = null) {
        this.editingReminder = reminder;
        const modal = document.getElementById('reminderModal');
        const title = document.getElementById('reminderModalTitle');
        const submitBtn = document.getElementById('reminderSubmitBtn');

        if (reminder) {
            title.textContent = 'Editar Recordatorio';
            submitBtn.textContent = 'Actualizar Recordatorio';
            this.populateReminderForm(reminder);
        } else {
            title.textContent = 'Nuevo Recordatorio';
            submitBtn.textContent = 'Crear Recordatorio';
            this.resetReminderForm();
        }

        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    populateReminderForm(reminder) {
        document.getElementById('reminderTitle').value = reminder.title || '';
        document.getElementById('reminderDescription').value = reminder.description || '';
        document.getElementById('reminderDateTime').value = reminder.dateTime ? new Date(reminder.dateTime).toISOString().slice(0, 16) : '';
        document.getElementById('reminderType').value = reminder.type || 'once';
    }

    resetReminderForm() {
        document.getElementById('reminderForm').reset();
    }

    saveReminder() {
        const form = document.getElementById('reminderForm');
        const formData = new FormData(form);

        const reminderData = {
            title: document.getElementById("reminderTitle").value.trim(),
            description: document.getElementById("reminderDescription").value.trim() || 
            "",
            dateTime: document.getElementById("reminderDateTime").value || null,
            type: document.getElementById("reminderType").value || "once"
        };

        if (!reminderData.title || !reminderData.dateTime) {
            Utils.showToast('Por favor completa los campos requeridos para el recordatorio', 'error');
            return;
        }

        if (this.editingReminder) {
            const index = this.app.reminders.findIndex(r => r.id === this.editingReminder.id);
            if (index !== -1) {
                this.app.reminders[index] = { ...this.app.reminders[index], ...reminderData, updatedAt: new Date() };
                Utils.showToast('Recordatorio actualizado', 'success');
            }
        } else {
            const newReminder = {
                id: Utils.generateId(),
                ...reminderData,
                triggered: false,
                completed: false, // New field for completion status
                createdAt: new Date()
            };
            this.app.reminders.push(newReminder);
            Utils.showToast('Recordatorio creado', 'success');
        }

        this.app.storage.set('reminders', this.app.reminders);
        this.renderReminders();
        this.app.hideModal('reminderModal');
    }

    deleteReminder(reminderId) {
        if (confirm("¿Estás seguro de que quieres eliminar este recordatorio?")) {
            this.app.reminders = this.app.reminders.filter(r => r.id !== reminderId);
            this.app.storage.set("reminders", this.app.reminders);
            this.renderReminders();
            Utils.showToast("Recordatorio eliminado", "info");
        }
    }

    toggleReminderComplete(reminderId) {
        const reminder = this.app.reminders.find(r => r.id === reminderId);
        if (reminder) {
            reminder.completed = !reminder.completed;
            reminder.completedAt = reminder.completed ? new Date() : null;
            this.app.storage.set('reminders', this.app.reminders);
            this.renderReminders();
            if (reminder.completed) {
                Utils.showToast('¡Recordatorio completado!', 'success');
            } else {
                Utils.showToast('Recordatorio marcado como pendiente', 'info');
            }
        }
    }

    setReminderFilter(filter) {
        document.querySelectorAll('.reminder-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderReminders();
    }

    renderReminders() {
        const container = document.getElementById('reminder-list');
        if (!container) return;

        const activeFilter = document.querySelector('.reminder-filter-btn.active')?.dataset.filter || 'todos';
        let filteredReminders = this.app.reminders;

        if (activeFilter !== 'todos') {
            filteredReminders = filteredReminders.filter(reminder => {
                switch (activeFilter) {
                    case 'pendientes':
                        return !reminder.completed && new Date(reminder.dateTime) > new Date();
                    case 'completados':
                        return reminder.completed;
                    case 'vencidos': // Add a filter for overdue reminders
                        return !reminder.completed && new Date(reminder.dateTime) < new Date();
                    default:
                        return true;
                }
            });
        }
        
        if (filteredReminders.length === 0) {
            container.innerHTML = '<li class="empty-state">No hay recordatorios configurados para este filtro.</li>';
            return;
        }

        container.innerHTML = filteredReminders.map(reminder => {
            const isOverdue = !reminder.completed && new Date(reminder.dateTime) < new Date();
            return `
                <li class="reminder-item ${reminder.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-reminder-id="${reminder.id}">
                    <div class="reminder-content">
                        <h4>${Utils.sanitizeHTML(reminder.title)}</h4>
                        <p>${Utils.sanitizeHTML(reminder.description || '')}</p>
                        <div class="reminder-meta">
                            <span>Fecha: ${Utils.formatDate(new Date(reminder.dateTime))}</span>
                            <span>Tipo: ${reminder.type}</span>
                        </div>
                    </div>
                    <div class="reminder-actions">
                        <button class="btn-icon" onclick="window.remindersModule.toggleReminderComplete('${reminder.id}')" title="${reminder.completed ? 'Marcar como pendiente' : 'Marcar como completado'}">${reminder.completed ? '↶' : '✓'}</button>
                        <button class="btn-icon" onclick="window.remindersModule.editReminder('${reminder.id}')" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="window.remindersModule.deleteReminder('${reminder.id}')" title="Eliminar">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');
    }

    checkReminders() {
        const now = new Date();
        this.app.reminders.forEach(reminder => {
            if (!reminder.triggered && !reminder.completed && new Date(reminder.dateTime) <= now) {
                this.app.showNotification(
                    'Recordatorio',
                    reminder.title,
                    'warning'
                );
                reminder.triggered = true;
                this.app.storage.set('reminders', this.app.reminders); // Save the triggered state
            }
        });
    }

    editReminder(reminderId) {
        const reminder = this.app.reminders.find(r => r.id === reminderId);
        if (reminder) {
            this.showReminderModal(reminder);
        }
    }

    highlightReminder(reminderId) {
        setTimeout(() => {
            const reminderElement = document.querySelector(`[data-reminder-id="${reminderId}"]`);
            if (reminderElement) {
                reminderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                reminderElement.classList.add('highlight');
                setTimeout(() => reminderElement.classList.remove('highlight'), 2000);
            }
        }, 500);
    }
}
