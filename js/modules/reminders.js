// Módulo de recordatorios
class ReminderManager {
    constructor() {
        this.reminders = [];
        this.activeTimeouts = new Map();
        this.init();
    }

    init() {
        this.loadReminders();
        this.setupEventListeners();
        this.renderReminders();
        this.scheduleActiveReminders();
    }

    setupEventListeners() {
        const addReminderBtn = document.getElementById('add-reminder');
        const reminderText = document.getElementById('reminder-text');

        if (addReminderBtn) {
            addReminderBtn.addEventListener('click', () => this.addReminder());
        }

        if (reminderText) {
            reminderText.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addReminder();
                }
            });
        }
    }

    addReminder() {
        const reminderText = document.getElementById('reminder-text');
        const reminderDatetime = document.getElementById('reminder-datetime');
        const reminderType = document.getElementById('reminder-type');

        if (!reminderText || !reminderDatetime || !reminderType) return;

        const text = reminderText.value.trim();
        const datetime = reminderDatetime.value;
        const type = reminderType.value;

        if (!text) {
            window.notifications.warning('Por favor, ingresa el texto del recordatorio');
            return;
        }

        if (!datetime) {
            window.notifications.warning('Por favor, selecciona fecha y hora');
            return;
        }

        const reminderDate = new Date(datetime);
        const now = new Date();

        if (reminderDate <= now) {
            window.notifications.warning('La fecha debe ser futura');
            return;
        }

        const reminder = {
            id: Helpers.generateId(),
            text,
            datetime: reminderDate.toISOString(),
            type,
            completed: false,
            createdAt: new Date().toISOString(),
            notified: false
        };

        this.reminders.push(reminder);
        this.saveReminders();
        this.renderReminders();
        this.scheduleReminder(reminder);

        // Limpiar formulario
        reminderText.value = '';
        reminderDatetime.value = '';

        window.notifications.success('Recordatorio agregado correctamente');
    }

    scheduleReminder(reminder) {
        if (reminder.completed || reminder.notified) return;

        const now = new Date();
        const reminderTime = new Date(reminder.datetime);
        const delay = reminderTime.getTime() - now.getTime();

        if (delay > 0) {
            const timeoutId = setTimeout(() => {
                this.triggerReminder(reminder);
            }, delay);

            this.activeTimeouts.set(reminder.id, timeoutId);
        }
    }

    scheduleActiveReminders() {
        this.reminders.forEach(reminder => {
            this.scheduleReminder(reminder);
        });
    }

    triggerReminder(reminder) {
        if (reminder.completed || reminder.notified) return;

        // Marcar como notificado
        reminder.notified = true;
        this.saveReminders();

        // Mostrar notificación
        window.notifications.reminder(
            'Recordatorio',
            reminder.text,
            { id: reminder.id }
        );

        // Programar siguiente ocurrencia si es recurrente
        if (reminder.type !== 'once') {
            this.scheduleRecurringReminder(reminder);
        }

        this.renderReminders();
    }

    scheduleRecurringReminder(reminder) {
        const currentDate = new Date(reminder.datetime);
        let nextDate;

        switch (reminder.type) {
            case 'daily':
                nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 7);
                break;
            default:
                return;
        }

        const newReminder = {
            ...reminder,
            id: Helpers.generateId(),
            datetime: nextDate.toISOString(),
            notified: false,
            createdAt: new Date().toISOString()
        };

        this.reminders.push(newReminder);
        this.saveReminders();
        this.scheduleReminder(newReminder);
        this.renderReminders();
    }

    completeReminder(reminderId) {
        const reminder = this.reminders.find(r => r.id === reminderId);
        if (!reminder) return;

        reminder.completed = true;
        reminder.completedAt = new Date().toISOString();

        // Cancelar timeout si existe
        if (this.activeTimeouts.has(reminderId)) {
            clearTimeout(this.activeTimeouts.get(reminderId));
            this.activeTimeouts.delete(reminderId);
        }

        this.saveReminders();
        this.renderReminders();
        window.notifications.success('Recordatorio completado');
    }

    snoozeReminder(reminderId, minutes = 10) {
        const reminder = this.reminders.find(r => r.id === reminderId);
        if (!reminder) return;

        const newTime = new Date();
        newTime.setMinutes(newTime.getMinutes() + minutes);

        reminder.datetime = newTime.toISOString();
        reminder.notified = false;

        // Cancelar timeout anterior
        if (this.activeTimeouts.has(reminderId)) {
            clearTimeout(this.activeTimeouts.get(reminderId));
            this.activeTimeouts.delete(reminderId);
        }

        this.scheduleReminder(reminder);
        this.saveReminders();
        this.renderReminders();
        
        window.notifications.info(`Recordatorio pospuesto ${minutes} minutos`);
    }

    deleteReminder(reminderId) {
        const reminder = this.reminders.find(r => r.id === reminderId);
        if (!reminder) return;

        // Mostrar confirmación
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');

        if (!modal) return;

        modalTitle.textContent = 'Eliminar Recordatorio';
        modalMessage.textContent = `¿Estás seguro de que quieres eliminar el recordatorio "${reminder.text}"?`;
        modal.classList.add('active');

        const handleConfirm = () => {
            // Cancelar timeout si existe
            if (this.activeTimeouts.has(reminderId)) {
                clearTimeout(this.activeTimeouts.get(reminderId));
                this.activeTimeouts.delete(reminderId);
            }

            this.reminders = this.reminders.filter(r => r.id !== reminderId);
            this.saveReminders();
            this.renderReminders();
            modal.classList.remove('active');
            window.notifications.success('Recordatorio eliminado');
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

    renderReminders() {
        const remindersList = document.getElementById('reminders-list');
        if (!remindersList) return;

        if (this.reminders.length === 0) {
            remindersList.innerHTML = `
                <div class="no-reminders">
                    <p>No hay recordatorios configurados</p>
                    <small>Agrega un recordatorio para no olvidar tareas importantes</small>
                </div>
            `;
            return;
        }

        // Ordenar recordatorios: pendientes primero, luego por fecha
        const sortedReminders = this.reminders.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(a.datetime) - new Date(b.datetime);
        });

        remindersList.innerHTML = '';

        sortedReminders.forEach(reminder => {
            const reminderElement = document.createElement('div');
            reminderElement.className = `reminder-item ${reminder.completed ? 'completed' : ''}`;
            
            const now = new Date();
            const reminderTime = new Date(reminder.datetime);
            const isOverdue = reminderTime < now && !reminder.completed && !reminder.notified;
            
            if (isOverdue) {
                reminderElement.classList.add('overdue');
            }

            const timeDisplay = Helpers.formatDateTime(reminder.datetime);
            const typeLabel = this.getTypeLabel(reminder.type);

            reminderElement.innerHTML = `
                <div class="reminder-content">
                    <div class="reminder-text">${Helpers.escapeHtml(reminder.text)}</div>
                    <div class="reminder-meta">
                        <small class="reminder-datetime">📅 ${timeDisplay}</small>
                        <span class="reminder-type">${typeLabel}</span>
                        ${isOverdue ? '<span class="overdue-badge">⚠️ Vencido</span>' : ''}
                        ${reminder.notified ? '<span class="notified-badge">🔔 Notificado</span>' : ''}
                    </div>
                </div>
                <div class="reminder-controls">
                    ${!reminder.completed ? `
                        <button class="btn-success" onclick="window.reminderManager.completeReminder('${reminder.id}')" title="Marcar como completado">
                            ✅
                        </button>
                        <button class="btn-secondary" onclick="window.reminderManager.snoozeReminder('${reminder.id}', 10)" title="Posponer 10 minutos">
                            ⏰
                        </button>
                    ` : ''}
                    <button class="btn-danger" onclick="window.reminderManager.deleteReminder('${reminder.id}')" title="Eliminar recordatorio">
                        🗑️
                    </button>
                </div>
            `;

            remindersList.appendChild(reminderElement);
        });
    }

    getTypeLabel(type) {
        const labels = {
            'once': 'Una vez',
            'daily': 'Diario',
            'weekly': 'Semanal'
        };
        return labels[type] || type;
    }

    // Obtener recordatorios próximos
    getUpcomingReminders(hours = 24) {
        const now = new Date();
        const futureTime = new Date();
        futureTime.setHours(now.getHours() + hours);

        return this.reminders.filter(reminder => {
            if (reminder.completed) return false;
            const reminderTime = new Date(reminder.datetime);
            return reminderTime >= now && reminderTime <= futureTime;
        }).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    }

    // Obtener recordatorios vencidos
    getOverdueReminders() {
        const now = new Date();
        return this.reminders.filter(reminder => {
            if (reminder.completed || reminder.notified) return false;
            const reminderTime = new Date(reminder.datetime);
            return reminderTime < now;
        });
    }

    // Obtener estadísticas
    getStats() {
        const total = this.reminders.length;
        const completed = this.reminders.filter(r => r.completed).length;
        const pending = this.reminders.filter(r => !r.completed).length;
        const overdue = this.getOverdueReminders().length;
        const upcoming = this.getUpcomingReminders().length;

        return {
            total,
            completed,
            pending,
            overdue,
            upcoming,
            completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0
        };
    }

    // Persistencia
    saveReminders() {
        window.storage.save('reminders', this.reminders);
    }

    loadReminders() {
        this.reminders = window.storage.load('reminders', []);
    }

    // Exportar recordatorios
    exportReminders() {
        const data = {
            reminders: this.reminders,
            stats: this.getStats(),
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const filename = `recordatorios_${new Date().toISOString().split('T')[0]}.json`;
        
        Helpers.downloadAsFile(jsonString, filename, 'application/json');
        window.notifications.success('Recordatorios exportados correctamente');
    }

    // Importar recordatorios
    async importReminders(file) {
        try {
            const content = await Helpers.readFileAsText(file);
            const data = JSON.parse(content);
            
            if (data.reminders && Array.isArray(data.reminders)) {
                // Filtrar recordatorios futuros
                const futureReminders = data.reminders.filter(reminder => {
                    const reminderTime = new Date(reminder.datetime);
                    return reminderTime > new Date();
                });

                this.reminders = [...this.reminders, ...futureReminders];
                this.saveReminders();
                this.renderReminders();
                this.scheduleActiveReminders();
                
                window.notifications.success(`${futureReminders.length} recordatorios importados`);
            } else {
                window.notifications.error('Archivo de recordatorios inválido');
            }
        } catch (error) {
            console.error('Error al importar recordatorios:', error);
            window.notifications.error('Error al importar el archivo');
        }
    }

    // Limpiar recordatorios completados antiguos
    cleanupOldReminders(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const initialCount = this.reminders.length;
        this.reminders = this.reminders.filter(reminder => {
            if (!reminder.completed) return true;
            const completedDate = new Date(reminder.completedAt || reminder.datetime);
            return completedDate >= cutoffDate;
        });

        const removedCount = initialCount - this.reminders.length;
        if (removedCount > 0) {
            this.saveReminders();
            this.renderReminders();
            window.notifications.info(`${removedCount} recordatorios antiguos eliminados`);
        }
    }
}

// Instancia global
window.reminderManager = new ReminderManager();

