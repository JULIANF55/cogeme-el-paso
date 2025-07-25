// timer.js
class TimerModule {
    constructor(appInstance) {
        this.app = appInstance;
        this.stopwatchInterval = null;
        this.timerInterval = null;
        this.stopwatchTime = 0;
        this.timerTime = 0;
        this.isStopwatchRunning = false;
        this.isTimerRunning = false;
        this.currentStopwatchTask = null;
        this.lapTimes = [];
    }

    setupListeners() {
        const startStopwatch = document.getElementById('startStopwatch');
        const pauseStopwatch = document.getElementById('pauseStopwatch');
        const resetStopwatch = document.getElementById('resetStopwatch');
        const lapStopwatch = document.getElementById('lapStopwatch');
        
        if (startStopwatch) {
            startStopwatch.addEventListener('click', () => this.startStopwatch());
        }
        if (pauseStopwatch) {
            pauseStopwatch.addEventListener('click', () => this.pauseStopwatch());
        }
        if (resetStopwatch) {
            resetStopwatch.addEventListener('click', () => this.resetStopwatch());
        }
        if (lapStopwatch) {
            lapStopwatch.addEventListener('click', () => this.addLap());
        }
        
        const startTimer = document.getElementById('startTimer');
        const pauseTimer = document.getElementById('pauseTimer');
        const resetTimer = document.getElementById('resetTimer');
        
        if (startTimer) {
            startTimer.addEventListener('click', () => this.startTimer());
        }
        if (pauseTimer) {
            pauseTimer.addEventListener('click', () => this.pauseTimer());
        }
        if (resetTimer) {
            resetTimer.addEventListener('click', () => this.resetTimer());
        }
        
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const [minutes, seconds, hours] = btn.dataset.time.split(',').map(Number);
                this.setTimerTime(hours || 0, minutes || 0, seconds || 0);
            });
        });
        
        const timeInputs = ['timerHours', 'timerMinutes', 'timerSeconds'];
        timeInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', () => this.updateTimerFromInputs());
            }
        });

        // Initial update for stopwatch task dropdown
        this.updateStopwatchTasks();
        this.updatePomodoroStats();
    }

    startStopwatch() {
        if (!this.isStopwatchRunning) {
            this.isStopwatchRunning = true;
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime++;
                this.updateStopwatchDisplay();
            }, 1000);
            
            const taskSelect = document.getElementById('stopwatchTask');
            this.currentStopwatchTask = taskSelect?.value || null;
            
            Utils.showToast('Cronómetro iniciado', 'info');
        }
    }
    
    pauseStopwatch() {
        if (this.isStopwatchRunning) {
            this.isStopwatchRunning = false;
            clearInterval(this.stopwatchInterval);
            
            if (this.currentStopwatchTask && this.stopwatchTime > 0) {
                this.recordTimeEntry(this.currentStopwatchTask, this.stopwatchTime, 'stopwatch');
            }
            
            Utils.showToast('Cronómetro pausado', 'info');
        }
    }
    
    resetStopwatch() {
        this.isStopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        
        if (this.currentStopwatchTask && this.stopwatchTime > 0) {
            this.recordTimeEntry(this.currentStopwatchTask, this.stopwatchTime, 'stopwatch');
        }
        
        this.stopwatchTime = 0;
        this.lapTimes = [];
        this.currentStopwatchTask = null;
        
        this.updateStopwatchDisplay();
        this.renderLapTimes();
        
        Utils.showToast('Cronómetro reiniciado', 'info');
    }
    
    toggleStopwatch() {
        if (this.isStopwatchRunning) {
            this.pauseStopwatch();
        } else {
            this.startStopwatch();
        }
    }
    
    addLap() {
        if (this.isStopwatchRunning) {
            this.lapTimes.push(this.stopwatchTime);
            this.renderLapTimes();
            Utils.showToast(`Vuelta ${this.lapTimes.length} registrada`, 'info');
        }
    }
    
    updateStopwatchDisplay() {
        const display = document.getElementById('stopwatchDisplay');
        if (display) {
            display.textContent = Utils.formatTime(this.stopwatchTime);
        }
    }
    
    renderLapTimes() {
        const container = document.getElementById('lapTimes');
        if (!container) return;
        
        if (this.lapTimes.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = `
            <h4>Vueltas</h4>
            <div class="lap-list">
                ${this.lapTimes.map((time, index) => `
                    <div class="lap-item">
                        <span>Vuelta ${index + 1}</span>
                        <span>${Utils.formatTime(time)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    startTimer() {
        if (!this.isTimerRunning && this.timerTime > 0) {
            this.isTimerRunning = true;
            this.timerInterval = setInterval(() => {
                this.timerTime--;
                this.updateTimerDisplay();
                
                if (this.timerTime <= 0) {
                    this.timerComplete();
                }
            }, 1000);
            
            this.updateTimerStatus('En progreso...');
            Utils.showToast('Temporizador iniciado', 'info');
        }
    }
    
    pauseTimer() {
        if (this.isTimerRunning) {
            this.isTimerRunning = false;
            clearInterval(this.timerInterval);
            this.updateTimerStatus('Pausado');
            Utils.showToast('Temporizador pausado', 'info');
        }
    }
    
    resetTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.updateTimerFromInputs();
        this.updateTimerStatus('Listo para comenzar');
        Utils.showToast('Temporizador reiniciado', 'info');
    }
    
    toggleTimer() {
        if (this.isTimerRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    timerComplete() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.timerTime = 0;
        this.updateTimerDisplay();
        this.updateTimerStatus('¡Tiempo completado!');
        
        this.recordTimeEntry(null, 25 * 60, 'pomodoro'); // Record a 25-minute pomodoro session
        
        this.app.showNotification('¡Tiempo completado!', 'Tu sesión de trabajo ha terminado', 'success');
        this.app.playSound('success');
        
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    setTimerTime(hours, minutes, seconds) {
        this.timerTime = (hours * 3600) + (minutes * 60) + seconds;
        this.updateTimerDisplay();
        this.updateTimerInputs();
    }
    
    updateTimerFromInputs() {
        const hours = parseInt(document.getElementById('timerHours')?.value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes')?.value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds')?.value) || 0;
        
        this.timerTime = (hours * 3600) + (minutes * 60) + seconds;
        this.updateTimerDisplay();
    }
    
    updateTimerInputs() {
        const hours = Math.floor(this.timerTime / 3600);
        const minutes = Math.floor((this.timerTime % 3600) / 60);
        const seconds = this.timerTime % 60;
        
        const hoursInput = document.getElementById('timerHours');
        const minutesInput = document.getElementById('timerMinutes');
        const secondsInput = document.getElementById('timerSeconds');
        
        if (hoursInput) hoursInput.value = hours;
        if (minutesInput) minutesInput.value = minutes;
        if (secondsInput) secondsInput.value = seconds;
    }
    
    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (display) {
            const minutes = Math.floor(this.timerTime / 60);
            const seconds = this.timerTime % 60;
            display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateTimerStatus(status) {
        const statusElement = document.getElementById('timerStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    recordTimeEntry(taskId, seconds, type) {
        const entry = {
            id: Utils.generateId(),
            taskId: taskId,
            seconds: seconds,
            date: new Date(),
            type: type
        };
        
        this.app.timeEntries.push(entry);
        this.app.storage.set('timeEntries', this.app.timeEntries);
        this.updatePomodoroStats(); // Update stats if it's a pomodoro
        this.app.updateDashboardStats(); // Update dashboard stats generally
    }
    
    updateStopwatchTasks() {
        const select = document.getElementById('stopwatchTask');
        if (!select) return;
        
        const pendingTasks = this.app.tasks.filter(t => !t.completed);
        
        // Guardar la tarea actualmente seleccionada
        const currentSelection = select.value;
        
        select.innerHTML = '<option value="">Seleccionar tarea...</option>' +
            pendingTasks.map(task => 
                `<option value="${task.id}">${Utils.sanitizeHTML(task.title)}</option>`
            ).join('');
        
        // Restaurar la selección si la tarea aún existe
        if (currentSelection && pendingTasks.find(t => t.id === currentSelection)) {
            select.value = currentSelection;
            this.currentStopwatchTask = currentSelection;
        } else if (this.currentStopwatchTask && pendingTasks.find(t => t.id === this.currentStopwatchTask)) {
            select.value = this.currentStopwatchTask;
        }
    }
    
    updatePomodoroStats() {
        const today = Utils.getStartOfDay(new Date());
        const todayEntries = this.app.timeEntries.filter(entry => 
            entry.type === 'pomodoro' && Utils.isSameDay(new Date(entry.date), today)
        );
        
        const pomodorosToday = document.getElementById('pomodorosToday');
        const totalTime = document.getElementById('pomodoroTotalTime');
        
        if (pomodorosToday) {
            pomodorosToday.textContent = todayEntries.length;
        }
        
        if (totalTime) {
            const totalSeconds = todayEntries.reduce((sum, entry) => sum + (entry.duration || entry.seconds || 0), 0);
            totalTime.textContent = Utils.formatTime(totalSeconds);
        }
    }
}
