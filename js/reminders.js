// reminders.js
class RemindersModule {
    constructor(appInstance) {
        this.app = appInstance;
        this.editingReminder = null;
        this.checkInterval = null;
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

        // Iniciar la verificación de recordatorios
        this.startRealTimeCheck();
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
            
            // Establecer la fecha mínima como ahora para nuevos recordatorios
            const dateInput = document.getElementById('reminderDateTime');
            if (dateInput) {
                dateInput.min = new Date().toISOString().slice(0, 16);
            }
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
        
        // Convertir fecha ISO a formato local para el input datetime-local
        const dateTimeValue = reminder.dateTime ? this.formatLocalDateTime(reminder.dateTime) : '';
        document.getElementById('reminderDateTime').value = dateTimeValue;
        
        document.getElementById('reminderType').value = reminder.type || 'once';
    }

    formatLocalDateTime(dateTimeStr) {
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return '';
        
        const pad = n => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    resetReminderForm() {
        document.getElementById('reminderForm').reset();
    }

    saveReminder() {
        const dateTimeInput = document.getElementById("reminderDateTime").value;
        
        if (!dateTimeInput) {
            Utils.showToast('Por favor ingresa una fecha y hora válida', 'error');
            return;
        }

        // Convertir a formato ISO para almacenamiento consistente
        const dateTimeISO = new Date(dateTimeInput).toISOString();

        const reminderData = {
            title: document.getElementById("reminderTitle").value.trim(),
            description: document.getElementById("reminderDescription").value.trim() || "",
            dateTime: dateTimeISO,
            type: document.getElementById("reminderType").value || "once",
            advanceNotified: false,
            triggered: false,
            overdueNotified: false
        };

        if (!reminderData.title) {
            Utils.showToast('Por favor ingresa un título para el recordatorio', 'error');
            return;
        }

        if (this.editingReminder) {
            const index = this.app.reminders.findIndex(r => r.id === this.editingReminder.id);
            if (index !== -1) {
                this.app.reminders[index] = { 
                    ...this.app.reminders[index], 
                    ...reminderData, 
                    updatedAt: new Date().toISOString() 
                };
                Utils.showToast('Recordatorio actualizado', 'success');
            }
        } else {
            const newReminder = {
                id: Utils.generateId(),
                ...reminderData,
                completed: false,
                createdAt: new Date().toISOString()
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
            reminder.completedAt = reminder.completed ? new Date().toISOString() : null;
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
        let filteredReminders = [...this.app.reminders].sort((a, b) => {
            return new Date(a.dateTime) - new Date(b.dateTime);
        });

        if (activeFilter !== 'todos') {
            filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.dateTime);
                const now = new Date();
                
                switch (activeFilter) {
                    case 'pendientes':
                        return !reminder.completed && reminderTime > now;
                    case 'completados':
                        return reminder.completed;
                    case 'vencidos':
                        return !reminder.completed && reminderTime < now;
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
            const reminderTime = new Date(reminder.dateTime);
            const now = new Date();
            const isOverdue = !reminder.completed && reminderTime < now;
            
            return `
                <li class="reminder-item ${reminder.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-reminder-id="${reminder.id}">
                    <div class="reminder-content">
                        <h4>${Utils.sanitizeHTML(reminder.title)}</h4>
                        ${reminder.description ? `<p>${Utils.sanitizeHTML(reminder.description)}</p>` : ''}
                        <div class="reminder-meta">
                            <span>Fecha: ${Utils.formatDate(reminderTime)}</span>
                            <span>Tipo: ${reminder.type === 'once' ? 'Una vez' : 
                                         reminder.type === 'daily' ? 'Diario' : 
                                         reminder.type === 'weekly' ? 'Semanal' : 'Mensual'}</span>
                        </div>
                    </div>
                    <div class="reminder-actions">
                        <button class="btn-icon" onclick="window.remindersModule.toggleReminderComplete('${reminder.id}')" 
                            title="${reminder.completed ? 'Marcar como pendiente' : 'Marcar como completado'}">
                            ${reminder.completed ? '↶' : '✓'}
                        </button>
                        <button class="btn-icon" onclick="window.remindersModule.editReminder('${reminder.id}')" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="window.remindersModule.deleteReminder('${reminder.id}')" title="Eliminar">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');
    }

    checkReminders() {
        const now = new Date();
        const reminderAdvance = this.app.settings.reminderAdvance || 5; // minutos de anticipación

        this.app.reminders.forEach(reminder => {
            if (reminder.completed || reminder.triggered) return;

            const reminderTime = new Date(reminder.dateTime);
            if (isNaN(reminderTime.getTime())) {
                console.error('Fecha inválida en recordatorio:', reminder);
                return;
            }

            const timeDiff = reminderTime.getTime() - now.getTime();
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));

            // Notificación de anticipación
            if (!reminder.advanceNotified && minutesDiff <= reminderAdvance && minutesDiff > 0) {
                this.app.showNotification(
                    'Recordatorio próximo',
                    `"${reminder.title}" en ${minutesDiff} minuto${minutesDiff !== 1 ? 's' : ''}`,
                    'warning'
                );
                reminder.advanceNotified = true;
                this.app.storage.set('reminders', this.app.reminders);
            }

            // Notificación principal - con margen de 1 minuto
            if (!reminder.triggered && timeDiff <= 60000) {
                this.app.showNotification(
                    'Recordatorio',
                    reminder.description ? `${reminder.title}\n${reminder.description}` : reminder.title,
                    'info'
                );
                
                if ('vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200]);
                }
                
                reminder.triggered = true;
                
                if (reminder.type !== 'once') {
                    this.scheduleRecurringReminder(reminder);
                }
                
                this.app.storage.set('reminders', this.app.reminders);
                this.highlightReminder(reminder.id);
            }
        });
    }
    
    scheduleRecurringReminder(reminder) {
        if (reminder.type === 'once') return;
        
        const originalTime = new Date(reminder.dateTime);
        let nextTime = new Date(originalTime);
        
        switch (reminder.type) {
            case 'daily':
                nextTime.setDate(nextTime.getDate() + 1);
                break;
            case 'weekly':
                nextTime.setDate(nextTime.getDate() + 7);
                break;
            case 'monthly':
                nextTime.setMonth(nextTime.getMonth() + 1);
                break;
            default:
                return;
        }
        
        // Crear nuevo recordatorio para la próxima ocurrencia
        const newReminder = {
            id: Utils.generateId(),
            title: reminder.title,
            description: reminder.description,
            dateTime: nextTime.toISOString(),
            type: reminder.type,
            triggered: false,
            completed: false,
            advanceNotified: false,
            overdueNotified: false,
            createdAt: new Date().toISOString()
        };
        
        this.app.reminders.push(newReminder);
        this.app.storage.set('reminders', this.app.reminders);
        
        Utils.showToast(`Próximo recordatorio programado para ${Utils.formatDate(nextTime)}`, 'info');
    }
    
    startRealTimeCheck() {
        // Limpiar intervalo previo si existe
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        // Verificar cada 15 segundos para mayor precisión
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 15000);
        
        // Verificar inmediatamente al cargar
        this.checkReminders();
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

    cleanup() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}
