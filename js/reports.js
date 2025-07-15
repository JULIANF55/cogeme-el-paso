class ReportsModule {
    constructor(app) {
        this.app = app;
        this.chartInstances = {};
    }

    init() {
        this.setupListeners();
        this.renderAllReports();
        this.updateReportsWithRealData(); // Actualizar con datos reales al iniciar
    }

    setupListeners() {
        // Escuchar cambios en los datos para actualizar reportes
        window.addEventListener('storageChange', (e) => {
            if (e.detail.key === 'tasks' || e.detail.key === 'timeEntries') {
                this.updateReportsWithRealData();
            }
        });
    }

    renderAllReports() {
        this.renderTimeReport();
        this.renderTasksReport();
        this.renderDistributionReport();
    }

    renderTimeReport() {
        // Obtener datos reales de timeEntries
        const timeEntries = this.app.timeEntries || [];
        
        // Agrupar por día de la semana
        const weeklyHours = [0, 0, 0, 0, 0, 0, 0]; // Lun-Dom
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        
        timeEntries.forEach(entry => {
            const date = new Date(entry.date);
            const day = date.getDay(); // 0=Domingo, 1=Lunes, etc.
            const dayIndex = day === 0 ? 6 : day - 1; // Ajustar para que sea Lun=0, Dom=6
            weeklyHours[dayIndex] += (entry.seconds || 0) / 3600; // Convertir a horas
        });

        // Calcular máximo para el eje Y (redondeado al siguiente entero)
        const maxHours = Math.max(...weeklyHours, 8);
        const yMax = Math.ceil(maxHours / 2) * 2; // Redondear al siguiente número par

        // Renderizar gráfico de tiempo trabajado
        const ctx = document.getElementById('tiempo-chart');
        if (ctx) {
            if (this.chartInstances.timeChart) {
                this.chartInstances.timeChart.destroy();
            }
            
            this.chartInstances.timeChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Horas trabajadas',
                        data: weeklyHours,
                        backgroundColor: '#6BA6E8',
                        borderColor: '#4A90E2',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#4A90E2',
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.parsed.y.toFixed(1)} horas`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: yMax,
                            ticks: {
                                stepSize: 1,
                                color: '#666',
                                callback: function(value) {
                                    return value + 'h';
                                }
                            },
                            grid: {
                                color: '#e0e0e0'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#666'
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }

    renderTasksReport() {
        // Obtener datos reales de tareas
        const tasks = this.app.tasks || [];
        const completed = tasks.filter(task => task.completed).length;
        const pending = tasks.filter(task => !task.completed).length;

        // Renderizar gráfico de tareas completadas
        const ctx = document.getElementById('tareas-chart');
        if (ctx) {
            if (this.chartInstances.tasksChart) {
                this.chartInstances.tasksChart.destroy();
            }
            
            this.chartInstances.tasksChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Completadas', 'Pendientes'],
                    datasets: [{
                        data: [completed, pending],
                        backgroundColor: ['#2ECC71', '#E74C3C'],
                        borderColor: ['#27AE60', '#C0392B'],
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.parsed.y} tareas`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#666',
                                precision: 0
                            },
                            grid: {
                                color: '#e0e0e0'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#666'
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }

    renderDistributionReport() {
        // Obtener datos reales de tareas
        const tasks = this.app.tasks || [];
        const distributionData = {
            trabajo: 0,
            estudio: 0,
            personal: 0,
            salud: 0,
            otros: 0
        };

        tasks.forEach(task => {
            const category = task.category || 'otros';
            const time = task.estimatedTime || 0;
            
            if (distributionData.hasOwnProperty(category)) {
                distributionData[category] += time / 60; // Convertir minutos a horas
            } else {
                distributionData.otros += time / 60;
            }
        });

        // Filtrar categorías con 0 horas
        const labels = [];
        const data = [];
        const backgroundColors = [
            '#6BA6E8',  // Azul para trabajo
            '#9B59B6',  // Morado para estudio
            '#2ECC71',  // Verde para personal
            '#F1C40F',  // Amarillo para salud
            '#E67E22'   // Naranja para otros
        ];
        const borderColors = [
            '#4A90E2',  // Azul para trabajo
            '#8E44AD',  // Morado para estudio
            '#27AE60',  // Verde para personal
            '#F39C12',  // Amarillo para salud
            '#D35400'   // Naranja para otros
        ];

        Object.keys(distributionData).forEach((key, index) => {
            if (distributionData[key] > 0) {
                labels.push(this.capitalize(key));
                data.push(distributionData[key]);
            }
        });

        // Renderizar gráfico circular de distribución
        const ctx = document.getElementById('distribucion-chart');
        if (ctx) {
            if (this.chartInstances.distributionChart) {
                this.chartInstances.distributionChart.destroy();
            }
            
            this.chartInstances.distributionChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors.slice(0, labels.length),
                        borderColor: '#fff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: '#666',
                                font: {
                                    size: 11
                                },
                                padding: 15,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    return `${label}: ${value.toFixed(1)} horas`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    updateReportsWithRealData() {
        // Actualizar todos los reportes con datos reales
        this.renderAllReports();
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
