// Aplicación principal - Cogeme el paso
class TimeManagerApp {
    constructor() {
        this.currentTab = 'inicio';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabNavigation();
        this.initializeModules();
        this.startPeriodicUpdates();
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // Navegación por pestañas
        const tabLinks = document.querySelectorAll('nav a');
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = this.getTabIdFromHref(link.getAttribute('href'));
                this.showTab(targetId);
            });
        });

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Eventos de visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Eventos de beforeunload para guardar datos
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });

        // Configurar modal global
        this.setupModal();
    }

    setupTabNavigation() {
        // Mostrar pestaña inicial
        this.showTab('inicio');
    }

    setupModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            // Cerrar modal al hacer click fuera
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });

            // Cerrar modal con Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                }
            });
        }
    }

    getTabIdFromHref(href) {
        return href ? href.substring(1) : 'inicio';
    }

    showTab(tabId) {
        // Ocultar todas las pestañas
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // Mostrar pestaña seleccionada
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
            this.currentTab = tabId;
        }

        // Actualizar navegación
        const tabLinks = document.querySelectorAll('nav a');
        tabLinks.forEach(link => {
            const linkTabId = this.getTabIdFromHref(link.getAttribute('href'));
            link.classList.toggle('active', linkTabId === tabId);
        });

        // Ejecutar acciones específicas por pestaña
        this.onTabChange(tabId);

        // Guardar pestaña actual
        window.storage.save('currentTab', tabId);
    }

    onTabChange(tabId) {
        switch (tabId) {
            case 'inicio':
                this.updateDashboard();
                break;
            case 'tareas':
                if (window.taskManager) {
                    window.taskManager.updateStats();
                }
                break;
            case 'cronometro':
                if (window.timerManager) {
                    window.timerManager.updateDisplays();
                }
                break;
            case 'temporizador':
                if (window.timerManager) {
                    window.timerManager.updateDisplays();
                }
                break;
            case 'calendario':
                if (window.calendarManager) {
                    window.calendarManager.renderCalendar();
                }
                break;
            case 'recordatorios':
                if (window.reminderManager) {
                    window.reminderManager.renderReminders();
                }
                break;
            case 'reportes':
                if (window.reportManager) {
                    window.reportManager.generateReport();
                }
                break;
            case 'metas':
                if (window.goalManager) {
                    window.goalManager.renderGoals();
                }
                break;
        }
    }

    initializeModules() {
        // Los módulos ya se inicializan automáticamente al cargar
        // Aquí podemos hacer configuraciones adicionales
        
        // Restaurar pestaña anterior
        const savedTab = window.storage.load('currentTab', 'inicio');
        this.showTab(savedTab);

        // Verificar recordatorios vencidos
        this.checkOverdueReminders();

        // Verificar metas próximas a vencer
        this.checkUpcomingGoalDeadlines();
    }

    updateDashboard() {
        // Actualizar estadísticas del dashboard
        if (window.taskManager) {
            window.taskManager.updateStats();
        }

        // Mostrar recordatorios próximos
        this.showUpcomingReminders();

        // Mostrar metas próximas
        this.showUpcomingGoals();
    }

    showUpcomingReminders() {
        if (!window.reminderManager) return;

        const upcomingReminders = window.reminderManager.getUpcomingReminders(24);
        if (upcomingReminders.length > 0) {
            // Mostrar notificación discreta
            const reminderText = upcomingReminders.length === 1 ? 
                `Recordatorio próximo: ${upcomingReminders[0].text}` :
                `Tienes ${upcomingReminders.length} recordatorios próximos`;
            
            setTimeout(() => {
                window.notifications.info(reminderText);
            }, 2000);
        }
    }

    showUpcomingGoals() {
        if (!window.goalManager) return;

        const upcomingGoals = window.goalManager.getUpcomingDeadlines(7);
        if (upcomingGoals.length > 0) {
            const goalText = upcomingGoals.length === 1 ? 
                `Meta próxima a vencer: ${upcomingGoals[0].title}` :
                `Tienes ${upcomingGoals.length} metas próximas a vencer`;
            
            setTimeout(() => {
                window.notifications.warning(goalText);
            }, 3000);
        }
    }

    checkOverdueReminders() {
        if (!window.reminderManager) return;

        const overdueReminders = window.reminderManager.getOverdueReminders();
        if (overdueReminders.length > 0) {
            setTimeout(() => {
                const message = overdueReminders.length === 1 ? 
                    'Tienes 1 recordatorio vencido' :
                    `Tienes ${overdueReminders.length} recordatorios vencidos`;
                
                window.notifications.warning(message, true);
            }, 1000);
        }
    }

    checkUpcomingGoalDeadlines() {
        if (!window.goalManager) return;

        const overdueGoals = window.goalManager.getOverdueGoals();
        if (overdueGoals.length > 0) {
            setTimeout(() => {
                const message = overdueGoals.length === 1 ? 
                    'Tienes 1 meta vencida' :
                    `Tienes ${overdueGoals.length} metas vencidas`;
                
                window.notifications.error(message, true);
            }, 1500);
        }
    }

    handleKeyboardShortcuts(e) {
        // Solo procesar atajos si no estamos en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Atajos con Ctrl/Cmd
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.showTab('inicio');
                    break;
                case '2':
                    e.preventDefault();
                    this.showTab('tareas');
                    break;
                case '3':
                    e.preventDefault();
                    this.showTab('cronometro');
                    break;
                case '4':
                    e.preventDefault();
                    this.showTab('temporizador');
                    break;
                case '5':
                    e.preventDefault();
                    this.showTab('calendario');
                    break;
                case '6':
                    e.preventDefault();
                    this.showTab('recordatorios');
                    break;
                case '7':
                    e.preventDefault();
                    this.showTab('reportes');
                    break;
                case '8':
                    e.preventDefault();
                    this.showTab('metas');
                    break;
                case 's':
                    e.preventDefault();
                    this.saveAllData();
                    window.notifications.success('Datos guardados');
                    break;
                case 'e':
                    e.preventDefault();
                    if (window.reportManager) {
                        window.reportManager.exportAllData();
                    }
                    break;
            }
        }

        // Atajos simples
        switch (e.key) {
            case 'Escape':
                // Cerrar modales o cancelar acciones
                const modal = document.getElementById('modal');
                if (modal && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                }
                break;
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Página oculta - guardar datos
            this.saveAllData();
        } else {
            // Página visible - actualizar datos
            this.updateDashboard();
            
            // Verificar recordatorios que pudieron haber vencido
            this.checkOverdueReminders();
        }
    }

    startPeriodicUpdates() {
        // Actualizar cada minuto
        setInterval(() => {
            this.periodicUpdate();
        }, 60000);

        // Guardar datos cada 5 minutos
        setInterval(() => {
            this.saveAllData();
        }, 300000);

        // Verificar recordatorios cada 30 segundos
        setInterval(() => {
            this.checkOverdueReminders();
        }, 30000);
    }

    periodicUpdate() {
        // Actualizar displays de tiempo
        if (window.timerManager) {
            window.timerManager.updateDisplays();
        }

        // Actualizar estadísticas si estamos en inicio
        if (this.currentTab === 'inicio') {
            this.updateDashboard();
        }

        // Actualizar calendario si estamos en esa pestaña
        if (this.currentTab === 'calendario' && window.calendarManager) {
            window.calendarManager.renderCalendar();
        }
    }

    saveAllData() {
        // Crear backup automático
        if (window.storage) {
            window.storage.createBackup();
        }

        // Guardar estado de todos los módulos
        if (window.timerManager) {
            window.timerManager.saveState();
        }

        if (window.taskManager) {
            window.taskManager.saveTasks();
        }

        if (window.reminderManager) {
            window.reminderManager.saveReminders();
        }

        if (window.calendarManager) {
            window.calendarManager.saveEvents();
        }

        if (window.goalManager) {
            window.goalManager.saveGoals();
        }
    }

    showWelcomeMessage() {
        // Mostrar mensaje de bienvenida solo la primera vez
        const hasShownWelcome = window.storage.load('hasShownWelcome', false);
        
        if (!hasShownWelcome) {
            setTimeout(() => {
                window.notifications.info('¡Bienvenido a Cogeme el paso! Tu nueva herramienta de gestión del tiempo.');
                window.storage.save('hasShownWelcome', true);
            }, 1000);
        }
    }

    // Métodos públicos para uso externo
    exportAllData() {
        if (window.reportManager) {
            window.reportManager.exportAllData();
        }
    }

    importData(file) {
        // Detectar tipo de archivo y dirigir al módulo apropiado
        const fileName = file.name.toLowerCase();
        
        if (fileName.includes('tarea')) {
            window.taskManager?.importTasks(file);
        } else if (fileName.includes('recordatorio')) {
            window.reminderManager?.importReminders(file);
        } else if (fileName.includes('calendario')) {
            window.calendarManager?.importEvents(file);
        } else if (fileName.includes('meta')) {
            window.goalManager?.importGoals(file);
        } else {
            // Intentar importar como backup completo
            this.importFullBackup(file);
        }
    }

    async importFullBackup(file) {
        try {
            const content = await Helpers.readFileAsText(file);
            const data = JSON.parse(content);
            
            if (data.tasks && window.taskManager) {
                window.taskManager.tasks = data.tasks;
                window.taskManager.saveTasks();
            }
            
            if (data.reminders && window.reminderManager) {
                window.reminderManager.reminders = data.reminders;
                window.reminderManager.saveReminders();
            }
            
            if (data.calendarEvents && window.calendarManager) {
                window.calendarManager.events = data.calendarEvents;
                window.calendarManager.saveEvents();
            }
            
            if (data.goals && window.goalManager) {
                window.goalManager.goals = data.goals;
                window.goalManager.saveGoals();
            }
            
            // Actualizar todas las vistas
            this.updateAllViews();
            
            window.notifications.success('Backup importado correctamente');
        } catch (error) {
            console.error('Error al importar backup:', error);
            window.notifications.error('Error al importar el archivo de backup');
        }
    }

    updateAllViews() {
        if (window.taskManager) {
            window.taskManager.renderTasks();
            window.taskManager.updateStats();
        }
        
        if (window.reminderManager) {
            window.reminderManager.renderReminders();
        }
        
        if (window.calendarManager) {
            window.calendarManager.renderCalendar();
        }
        
        if (window.goalManager) {
            window.goalManager.renderGoals();
        }
        
        if (window.reportManager) {
            window.reportManager.generateReport();
        }
    }

    // Método para obtener estadísticas generales
    getAppStats() {
        return {
            tasks: window.taskManager?.getStats() || {},
            reminders: window.reminderManager?.getStats() || {},
            calendar: window.calendarManager?.getCalendarStats() || {},
            goals: window.goalManager?.getStats() || {},
            timer: window.timerManager?.getStats() || {}
        };
    }

    // Método para resetear toda la aplicación
    resetApp() {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');

        if (!modal) return;

        modalTitle.textContent = 'Resetear Aplicación';
        modalMessage.textContent = '¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.';
        modal.classList.add('active');

        const handleConfirm = () => {
            // Limpiar almacenamiento
            window.storage.clear();
            
            // Recargar página
            window.location.reload();
            
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
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TimeManagerApp();
    
    // Mostrar información de la aplicación en consola
    console.log('🚀 Cogeme el paso - Aplicación de Gestión del Tiempo');
    console.log('📱 Versión: 2.0.0');
    console.log('🔧 Atajos de teclado:');
    console.log('   Ctrl+1-8: Cambiar pestañas');
    console.log('   Ctrl+S: Guardar datos');
    console.log('   Ctrl+E: Exportar datos');
    console.log('   Escape: Cerrar modales');
});

// Registrar Service Worker si está disponible
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registrado: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registro falló: ', registrationError);
            });
    });
}

