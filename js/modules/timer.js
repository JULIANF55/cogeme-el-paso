// Módulo de cronómetro y temporizador
class TimerManager {
    constructor() {
        this.stopwatchInterval = null;
        this.timerInterval = null;
        this.stopwatchTime = 0;
        this.timerTime = 0;
        this.isStopwatchRunning = false;
        this.isTimerRunning = false;
        this.pomodoroSession = {
            workTime: 25 * 60 * 1000, // 25 minutos
            shortBreak: 5 * 60 * 1000, // 5 minutos
            longBreak: 15 * 60 * 1000, // 15 minutos
            currentSession: 0,
            isBreak: false
        };
        this.init();
    }

    init() {
        this.loadState();
        this.setupEventListeners();
        this.updateDisplays();
    }

    setupEventListeners() {
        // Cronómetro
        const startStopwatchBtn = document.getElementById('start-stopwatch');
        const pauseStopwatchBtn = document.getElementById('pause-stopwatch');
        const resetStopwatchBtn = document.getElementById('reset-stopwatch');

        if (startStopwatchBtn) {
            startStopwatchBtn.addEventListener('click', () => this.startStopwatch());
        }
        if (pauseStopwatchBtn) {
            pauseStopwatchBtn.addEventListener('click', () => this.pauseStopwatch());
        }
        if (resetStopwatchBtn) {
            resetStopwatchBtn.addEventListener('click', () => this.resetStopwatch());
        }

        // Temporizador
        const startTimerBtn = document.getElementById('start-timer');
        const pauseTimerBtn = document.getElementById('pause-timer');
        const resetTimerBtn = document.getElementById('reset-timer');
        const timerMinutesInput = document.getElementById('timer-minutes');

        if (startTimerBtn) {
            startTimerBtn.addEventListener('click', () => this.startTimer());
        }
        if (pauseTimerBtn) {
            pauseTimerBtn.addEventListener('click', () => this.pauseTimer());
        }
        if (resetTimerBtn) {
            resetTimerBtn.addEventListener('click', () => this.resetTimer());
        }
        if (timerMinutesInput) {
            timerMinutesInput.addEventListener('change', () => this.updateTimerDisplay());
        }

        // Presets del temporizador
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.setTimerPreset(minutes);
            });
        });
    }

    // Métodos del cronómetro
    startStopwatch() {
        if (!this.isStopwatchRunning) {
            this.isStopwatchRunning = true;
            this.stopwatchInterval = setInterval(() => this.updateStopwatch(), 10);
            this.updateStopwatchButtons();
            this.addTimerActiveClass('cronometro');
            this.saveState();
        }
    }

    pauseStopwatch() {
        if (this.isStopwatchRunning) {
            this.isStopwatchRunning = false;
            clearInterval(this.stopwatchInterval);
            
            // Guardar tiempo en tarea actual si existe
            if (window.taskManager && window.taskManager.currentTaskId) {
                window.taskManager.stopTaskTimer();
            }
            
            this.updateStopwatchButtons();
            this.removeTimerActiveClass('cronometro');
            this.saveState();
        }
    }

    resetStopwatch() {
        this.isStopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        this.stopwatchTime = 0;
        this.updateStopwatchDisplay();
        this.updateStopwatchButtons();
        this.removeTimerActiveClass('cronometro');
        
        // Limpiar tarea actual
        if (window.taskManager) {
            window.taskManager.currentTaskId = null;
            const currentTaskInfo = document.getElementById('current-task-info');
            if (currentTaskInfo) {
                currentTaskInfo.textContent = 'Sin tarea seleccionada';
            }
        }
        
        this.saveState();
    }

    updateStopwatch() {
        this.stopwatchTime += 10;
        this.updateStopwatchDisplay();
        
        // Guardar estado cada minuto
        if (this.stopwatchTime % 60000 === 0) {
            this.saveState();
        }
    }

    updateStopwatchDisplay() {
        const display = document.getElementById('stopwatch-display');
        if (display) {
            display.textContent = Helpers.formatTime(this.stopwatchTime);
        }
    }

    updateStopwatchButtons() {
        const startBtn = document.getElementById('start-stopwatch');
        const pauseBtn = document.getElementById('pause-stopwatch');
        
        if (startBtn && pauseBtn) {
            if (this.isStopwatchRunning) {
                startBtn.textContent = 'Corriendo...';
                startBtn.disabled = true;
                pauseBtn.disabled = false;
            } else {
                startBtn.textContent = this.stopwatchTime > 0 ? 'Continuar' : 'Iniciar';
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
        }
    }

    // Métodos del temporizador
    startTimer() {
        if (!this.isTimerRunning) {
            if (this.timerTime === 0) {
                const minutes = parseInt(document.getElementById('timer-minutes')?.value) || 25;
                this.timerTime = minutes * 60 * 1000;
            }
            
            this.isTimerRunning = true;
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);
            this.updateTimerButtons();
            this.addTimerActiveClass('temporizador');
            this.saveState();
        }
    }

    pauseTimer() {
        if (this.isTimerRunning) {
            this.isTimerRunning = false;
            clearInterval(this.timerInterval);
            this.updateTimerButtons();
            this.removeTimerActiveClass('temporizador');
            this.saveState();
        }
    }

    resetTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.timerTime = 0;
        this.updateTimerDisplay();
        this.updateTimerButtons();
        this.removeTimerActiveClass('temporizador');
        this.removeTimerFinishedClass('temporizador');
        
        const timerMinutesInput = document.getElementById('timer-minutes');
        if (timerMinutesInput) {
            timerMinutesInput.disabled = false;
        }
        
        this.saveState();
    }

    updateTimer() {
        if (this.timerTime > 0) {
            this.timerTime -= 1000;
            this.updateTimerDisplay();
            
            // Guardar estado cada minuto
            if (this.timerTime % 60000 === 0) {
                this.saveState();
            }
        } else {
            this.timerFinished();
        }
    }

    updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        if (!display) return;

        let displayTime;
        if (this.timerTime > 0) {
            displayTime = Helpers.formatTime(this.timerTime);
        } else {
            const minutes = parseInt(document.getElementById('timer-minutes')?.value) || 25;
            displayTime = Helpers.formatTime(minutes * 60 * 1000);
        }
        display.textContent = displayTime;
    }

    updateTimerButtons() {
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        const timerMinutesInput = document.getElementById('timer-minutes');
        
        if (startBtn && pauseBtn) {
            if (this.isTimerRunning) {
                startBtn.textContent = 'Corriendo...';
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                if (timerMinutesInput) timerMinutesInput.disabled = true;
            } else {
                startBtn.textContent = this.timerTime > 0 ? 'Continuar' : 'Iniciar';
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                if (timerMinutesInput) timerMinutesInput.disabled = false;
            }
        }
    }

    timerFinished() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        
        this.addTimerFinishedClass('temporizador');
        this.removeTimerActiveClass('temporizador');
        
        // Notificación
        window.notifications.timerFinished('¡Tiempo terminado!');
        
        // Actualizar botones
        this.updateTimerButtons();
        
        // Resetear después de 3 segundos
        setTimeout(() => {
            this.timerTime = 0;
            this.updateTimerDisplay();
            this.removeTimerFinishedClass('temporizador');
        }, 3000);
        
        this.saveState();
    }

    setTimerPreset(minutes) {
        if (this.isTimerRunning) {
            window.notifications.warning('Detén el temporizador actual antes de cambiar el preset');
            return;
        }
        
        const timerMinutesInput = document.getElementById('timer-minutes');
        if (timerMinutesInput) {
            timerMinutesInput.value = minutes;
            this.timerTime = 0;
            this.updateTimerDisplay();
        }
        
        window.notifications.info(`Temporizador configurado para ${minutes} minutos`);
    }

    // Métodos de utilidad
    addTimerActiveClass(timerId) {
        const element = document.getElementById(timerId);
        if (element) {
            element.classList.add('timer-active');
        }
    }

    removeTimerActiveClass(timerId) {
        const element = document.getElementById(timerId);
        if (element) {
            element.classList.remove('timer-active');
        }
    }

    addTimerFinishedClass(timerId) {
        const element = document.getElementById(timerId);
        if (element) {
            element.classList.add('timer-finished');
        }
    }

    removeTimerFinishedClass(timerId) {
        const element = document.getElementById(timerId);
        if (element) {
            element.classList.remove('timer-finished');
        }
    }

    updateDisplays() {
        this.updateStopwatchDisplay();
        this.updateTimerDisplay();
        this.updateStopwatchButtons();
        this.updateTimerButtons();
    }

    // Técnica Pomodoro
    startPomodoroSession() {
        const isBreak = this.pomodoroSession.isBreak;
        const sessionTime = isBreak ? 
            (this.pomodoroSession.currentSession % 4 === 0 ? 
                this.pomodoroSession.longBreak : 
                this.pomodoroSession.shortBreak) : 
            this.pomodoroSession.workTime;
        
        // Configurar temporizador
        const minutes = Math.floor(sessionTime / 60000);
        const timerMinutesInput = document.getElementById('timer-minutes');
        if (timerMinutesInput) {
            timerMinutesInput.value = minutes;
        }
        
        this.timerTime = sessionTime;
        this.updateTimerDisplay();
        this.startTimer();
        
        const sessionType = isBreak ? 'descanso' : 'trabajo';
        window.notifications.info(`Sesión Pomodoro iniciada: ${sessionType} (${minutes} min)`);
    }

    completePomodoroSession() {
        if (this.pomodoroSession.isBreak) {
            // Terminar descanso, comenzar trabajo
            this.pomodoroSession.isBreak = false;
        } else {
            // Terminar trabajo, comenzar descanso
            this.pomodoroSession.currentSession++;
            this.pomodoroSession.isBreak = true;
        }
        
        // Preguntar si quiere continuar con la siguiente sesión
        const nextSessionType = this.pomodoroSession.isBreak ? 'descanso' : 'trabajo';
        const nextDuration = this.pomodoroSession.isBreak ? 
            (this.pomodoroSession.currentSession % 4 === 0 ? 15 : 5) : 25;
        
        setTimeout(() => {
            if (confirm(`¿Quieres continuar con la siguiente sesión de ${nextSessionType} (${nextDuration} min)?`)) {
                this.startPomodoroSession();
            }
        }, 1000);
    }

    // Persistencia
    saveState() {
        const state = {
            stopwatchTime: this.stopwatchTime,
            timerTime: this.timerTime,
            isStopwatchRunning: this.isStopwatchRunning,
            isTimerRunning: this.isTimerRunning,
            pomodoroSession: this.pomodoroSession,
            lastSaved: new Date().toISOString()
        };
        
        window.storage.save('timerState', state);
    }

    loadState() {
        const state = window.storage.load('timerState');
        if (state) {
            this.stopwatchTime = state.stopwatchTime || 0;
            this.timerTime = state.timerTime || 0;
            this.pomodoroSession = state.pomodoroSession || this.pomodoroSession;
            
            // No restaurar estados de ejecución automáticamente
            // El usuario debe reiniciar manualmente
            this.isStopwatchRunning = false;
            this.isTimerRunning = false;
        }
    }

    // Obtener estadísticas
    getStats() {
        return {
            totalStopwatchTime: this.stopwatchTime,
            currentTimerTime: this.timerTime,
            pomodoroSessions: this.pomodoroSession.currentSession,
            isStopwatchActive: this.isStopwatchRunning,
            isTimerActive: this.isTimerRunning
        };
    }

    // Exportar datos del temporizador
    exportTimerData() {
        const data = {
            stats: this.getStats(),
            state: {
                stopwatchTime: this.stopwatchTime,
                timerTime: this.timerTime,
                pomodoroSession: this.pomodoroSession
            },
            exportDate: new Date().toISOString()
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const filename = `timer_data_${new Date().toISOString().split('T')[0]}.json`;
        
        Helpers.downloadAsFile(jsonString, filename, 'application/json');
        window.notifications.success('Datos del temporizador exportados');
    }
}

// Instancia global
window.timerManager = new TimerManager();

