// Módulo de calendario
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.init();
    }

    init() {
        this.loadEvents();
        this.setupEventListeners();
        this.renderCalendar();
    }

    setupEventListeners() {
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');

        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => this.previousMonth());
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => this.nextMonth());
        }
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    renderCalendar() {
        this.updateMonthYearDisplay();
        this.renderCalendarGrid();
    }

    updateMonthYearDisplay() {
        const monthYearElement = document.getElementById('current-month-year');
        if (monthYearElement) {
            const monthName = Helpers.getMonthName(this.currentDate);
            const year = this.currentDate.getFullYear();
            monthYearElement.textContent = `${monthName} ${year}`;
        }
    }

    renderCalendarGrid() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;

        calendarGrid.innerHTML = '';

        // Headers de días de la semana
        const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayHeaders.forEach(day => {
            const headerElement = document.createElement('div');
            headerElement.className = 'calendar-header';
            headerElement.textContent = day;
            calendarGrid.appendChild(headerElement);
        });

        // Obtener información del mes
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = Helpers.getFirstDayOfMonth(year, month);
        const daysInMonth = Helpers.getDaysInMonth(year, month);
        const daysInPrevMonth = Helpers.getDaysInMonth(year, month - 1);

        // Días del mes anterior
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayElement = this.createDayElement(
                daysInPrevMonth - i,
                new Date(year, month - 1, daysInPrevMonth - i),
                true
            );
            calendarGrid.appendChild(dayElement);
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(
                day,
                new Date(year, month, day),
                false
            );
            calendarGrid.appendChild(dayElement);
        }

        // Días del mes siguiente
        const totalCells = calendarGrid.children.length - 7; // Restar headers
        const remainingCells = 42 - totalCells; // 6 semanas * 7 días
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(
                day,
                new Date(year, month + 1, day),
                true
            );
            calendarGrid.appendChild(dayElement);
        }
    }

    createDayElement(dayNumber, date, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = dayNumber;

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        if (Helpers.isToday(date)) {
            dayElement.classList.add('today');
        }

        // Verificar si hay tareas en este día
        const tasksOnDay = this.getTasksForDate(date);
        if (tasksOnDay.length > 0) {
            dayElement.classList.add('has-tasks');
            
            // Verificar si hay tareas completadas
            const completedTasks = tasksOnDay.filter(task => task.completed);
            if (completedTasks.length > 0) {
                dayElement.classList.add('completed-tasks');
            }
        }

        // Agregar eventos
        const eventsOnDay = this.getEventsForDate(date);
        if (eventsOnDay.length > 0) {
            dayElement.classList.add('has-events');
        }

        // Click handler
        dayElement.addEventListener('click', () => {
            this.showDayDetails(date, tasksOnDay, eventsOnDay);
        });

        return dayElement;
    }

    getTasksForDate(date) {
        if (!window.taskManager) return [];
        
        const dateString = date.toISOString().split('T')[0];
        return window.taskManager.tasks.filter(task => {
            const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
            const completedDate = task.completedAt ? 
                new Date(task.completedAt).toISOString().split('T')[0] : null;
            
            return taskDate === dateString || completedDate === dateString;
        });
    }

    getEventsForDate(date) {
        const dateString = date.toISOString().split('T')[0];
        return this.events.filter(event => {
            const eventDate = new Date(event.date).toISOString().split('T')[0];
            return eventDate === dateString;
        });
    }

    showDayDetails(date, tasks, events) {
        const formattedDate = Helpers.formatDate(date, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        let content = `<h3>${formattedDate}</h3>`;

        if (tasks.length > 0) {
            content += '<h4>📝 Tareas:</h4><ul>';
            tasks.forEach(task => {
                const status = task.completed ? '✅' : '⏳';
                const time = task.timeSpent > 0 ? ` (${Helpers.formatTime(task.timeSpent)})` : '';
                content += `<li>${status} ${Helpers.escapeHtml(task.text)}${time}</li>`;
            });
            content += '</ul>';
        }

        if (events.length > 0) {
            content += '<h4>📅 Eventos:</h4><ul>';
            events.forEach(event => {
                content += `<li>${Helpers.escapeHtml(event.title)} - ${event.time}</li>`;
            });
            content += '</ul>';
        }

        if (tasks.length === 0 && events.length === 0) {
            content += '<p>No hay tareas ni eventos para este día.</p>';
        }

        // Mostrar en modal o crear un popup
        this.showModal('Detalles del Día', content);
    }

    showModal(title, content) {
        // Crear modal temporal si no existe uno específico para el calendario
        let modal = document.getElementById('calendar-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'calendar-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div id="calendar-modal-content"></div>
                    <div class="modal-buttons">
                        <button id="calendar-modal-close" class="btn-secondary">Cerrar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Event listener para cerrar
            document.getElementById('calendar-modal-close').addEventListener('click', () => {
                modal.classList.remove('active');
            });

            // Cerrar al hacer click fuera
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        document.getElementById('calendar-modal-content').innerHTML = content;
        modal.classList.add('active');
    }

    // Agregar evento al calendario
    addEvent(title, date, time, description = '') {
        const event = {
            id: Helpers.generateId(),
            title,
            date: date,
            time,
            description,
            createdAt: new Date().toISOString()
        };

        this.events.push(event);
        this.saveEvents();
        this.renderCalendar();
        
        window.notifications.success('Evento agregado al calendario');
        return event;
    }

    // Eliminar evento
    removeEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
        this.saveEvents();
        this.renderCalendar();
        window.notifications.success('Evento eliminado');
    }

    // Obtener eventos del mes actual
    getCurrentMonthEvents() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === year && eventDate.getMonth() === month;
        });
    }

    // Obtener estadísticas del calendario
    getCalendarStats() {
        const today = new Date();
        const thisMonth = this.getCurrentMonthEvents();
        const upcomingEvents = this.events.filter(event => new Date(event.date) > today);
        
        return {
            totalEvents: this.events.length,
            thisMonthEvents: thisMonth.length,
            upcomingEvents: upcomingEvents.length,
            currentMonth: Helpers.getMonthName(this.currentDate),
            currentYear: this.currentDate.getFullYear()
        };
    }

    // Navegar a una fecha específica
    goToDate(date) {
        this.currentDate = new Date(date);
        this.renderCalendar();
    }

    // Ir a hoy
    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }

    // Buscar eventos
    searchEvents(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.events.filter(event => 
            event.title.toLowerCase().includes(lowercaseQuery) ||
            event.description.toLowerCase().includes(lowercaseQuery)
        );
    }

    // Obtener eventos próximos (próximos 7 días)
    getUpcomingEvents(days = 7) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today && eventDate <= futureDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Persistencia
    saveEvents() {
        window.storage.save('calendarEvents', this.events);
    }

    loadEvents() {
        this.events = window.storage.load('calendarEvents', []);
    }

    // Exportar eventos
    exportEvents() {
        const data = {
            events: this.events,
            stats: this.getCalendarStats(),
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const filename = `calendario_${new Date().toISOString().split('T')[0]}.json`;
        
        Helpers.downloadAsFile(jsonString, filename, 'application/json');
        window.notifications.success('Eventos del calendario exportados');
    }

    // Importar eventos
    async importEvents(file) {
        try {
            const content = await Helpers.readFileAsText(file);
            const data = JSON.parse(content);
            
            if (data.events && Array.isArray(data.events)) {
                this.events = [...this.events, ...data.events];
                this.saveEvents();
                this.renderCalendar();
                window.notifications.success(`${data.events.length} eventos importados`);
            } else {
                window.notifications.error('Archivo de eventos inválido');
            }
        } catch (error) {
            console.error('Error al importar eventos:', error);
            window.notifications.error('Error al importar el archivo');
        }
    }
}

// Instancia global
window.calendarManager = new CalendarManager();

