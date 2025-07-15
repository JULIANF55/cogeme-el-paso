// calendar.js
class CalendarModule {
    constructor(appInstance) {
        this.app = appInstance;
        this.currentDate = new Date();
    }

    setupListeners() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        const todayBtn = document.getElementById('todayBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar();
            });
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.currentDate = new Date();
                this.renderCalendar();
            });
        }
    }

    renderCalendar() {
        const container = document.getElementById('calendarGrid');
        const monthTitle = document.getElementById('currentMonth');

        if (!container || !monthTitle) return;

        // --- MODIFICACIÓN DE LA OPCIÓN 1 ---
        // Obtén el mes y el año directamente del objeto Date
        const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(this.currentDate);
        const year = this.currentDate.getFullYear();
        monthTitle.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
        // -----------------------------------

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const today = new Date();

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
            const isToday = Utils.isSameDay(date, today);
            const hasTasks = this.app.tasks.some(task =>
                task.dueDate && Utils.isSameDay(new Date(task.dueDate), date)
            );
            const hasCompletedTasks = this.app.tasks.some(task =>
                task.completed && task.completedAt && Utils.isSameDay(new Date(task.completedAt), date)
            );
            const hasReminders = this.app.reminders.some(reminder =>
                reminder.dateTime && Utils.isSameDay(new Date(reminder.dateTime), date)
            );

            days.push({
                date: date.getDate(),
                isCurrentMonth,
                isToday,
                hasTasks,
                hasCompletedTasks,
                hasReminders,
                fullDate: new Date(date)
            });
        }

        container.innerHTML = `
            <div class="calendar-header-row">
                <div class="calendar-day-header">Dom</div>
                <div class="calendar-day-header">Lun</div>
                <div class="calendar-day-header">Mar</div>
                <div class="calendar-day-header">Mié</div>
                <div class="calendar-day-header">Jue</div>
                <div class="calendar-day-header">Vie</div>
                <div class="calendar-day-header">Sáb</div>
            </div>
            ${days.map(day => `
                <div class="calendar-day ${day.isCurrentMonth ? '' : 'other-month'} ${day.isToday ? 'today' : ''} ${day.hasTasks ? 'has-tasks' : ''} ${day.hasCompletedTasks ? 'has-completed-tasks' : ''} ${day.hasReminders ? 'has-reminders' : ''}"
                     onclick="window.calendarModule.showDayDetails('${day.fullDate.toISOString()}')">
                    <div class="calendar-day-content">
                        <span class="day-number">${day.date}</span>
                    </div>
                </div>
            `).join('')}
        `;
    }

    showDayDetails(dateString) {
        const date = new Date(dateString);
        const dayTasks = this.app.tasks.filter(task =>
            task.dueDate && Utils.isSameDay(new Date(task.dueDate), date)
        );

        const container = document.getElementById('dayDetails');
        if (!container) return;

        container.innerHTML = `
            <h3>${Utils.formatDate(date)}</h3>
            ${dayTasks.length > 0 ? `
                <h4>Tareas del día:</h4>
                <ul>
                    ${dayTasks.map(task => `
                        <li class="${task.completed ? 'completed' : ''}">
                            ${Utils.sanitizeHTML(task.title)}
                        </li>
                    `).join('')}
                </ul>
            ` : '<p>No hay tareas para este día</p>'}
        `;

        const modal = document.getElementById('dayDetailsModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
}
