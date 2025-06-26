// Módulo de reportes y estadísticas
class ReportManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateReport();
    }

    setupEventListeners() {
        const generateReportBtn = document.getElementById('generate-report');
        const exportDataBtn = document.getElementById('export-data');
        const reportPeriodSelect = document.getElementById('report-period');

        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateReport());
        }

        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportAllData());
        }

        if (reportPeriodSelect) {
            reportPeriodSelect.addEventListener('change', () => this.generateReport());
        }
    }

    generateReport() {
        const period = document.getElementById('report-period')?.value || 'week';
        const reportData = this.getReportData(period);
        
        this.updateReportDisplay(reportData);
        this.updateCategoryChart(reportData.categoryData);
    }

    getReportData(period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
        }

        return this.calculateStats(startDate, now);
    }

    calculateStats(startDate, endDate) {
        const tasks = window.taskManager ? window.taskManager.tasks : [];
        const reminders = window.reminderManager ? window.reminderManager.reminders : [];

        // Filtrar tareas del período
        const periodTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            const completedDate = task.completedAt ? new Date(task.completedAt) : null;
            
            return (taskDate >= startDate && taskDate <= endDate) ||
                   (completedDate && completedDate >= startDate && completedDate <= endDate);
        });

        // Calcular estadísticas de tareas
        const completedTasks = periodTasks.filter(task => 
            task.completed && task.completedAt &&
            new Date(task.completedAt) >= startDate && 
            new Date(task.completedAt) <= endDate
        );

        const totalTime = periodTasks.reduce((sum, task) => sum + task.timeSpent, 0);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const dailyAverage = totalTime / days;

        // Estadísticas por categoría
        const categoryData = {};
        periodTasks.forEach(task => {
            if (!categoryData[task.category]) {
                categoryData[task.category] = {
                    total: 0,
                    completed: 0,
                    time: 0
                };
            }
            categoryData[task.category].total++;
            categoryData[task.category].time += task.timeSpent;
            if (task.completed) {
                categoryData[task.category].completed++;
            }
        });

        // Estadísticas de recordatorios
        const periodReminders = reminders.filter(reminder => {
            const reminderDate = new Date(reminder.createdAt);
            return reminderDate >= startDate && reminderDate <= endDate;
        });

        const completedReminders = periodReminders.filter(r => r.completed);

        // Productividad por día
        const dailyProductivity = this.calculateDailyProductivity(startDate, endDate, tasks);

        return {
            period: this.getPeriodLabel(),
            tasksCompleted: completedTasks.length,
            totalTasks: periodTasks.length,
            totalTime,
            dailyAverage,
            categoryData,
            remindersCompleted: completedReminders.length,
            totalReminders: periodReminders.length,
            dailyProductivity,
            completionRate: periodTasks.length > 0 ? 
                (completedTasks.length / periodTasks.length * 100).toFixed(1) : 0
        };
    }

    calculateDailyProductivity(startDate, endDate, tasks) {
        const dailyData = {};
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            dailyData[dateString] = {
                tasksCompleted: 0,
                timeSpent: 0,
                tasksCreated: 0
            };

            // Tareas completadas en este día
            const completedToday = tasks.filter(task => 
                task.completed && task.completedAt &&
                new Date(task.completedAt).toISOString().split('T')[0] === dateString
            );

            // Tareas creadas en este día
            const createdToday = tasks.filter(task => 
                new Date(task.createdAt).toISOString().split('T')[0] === dateString
            );

            dailyData[dateString].tasksCompleted = completedToday.length;
            dailyData[dateString].tasksCreated = createdToday.length;
            dailyData[dateString].timeSpent = createdToday.reduce((sum, task) => sum + task.timeSpent, 0);

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dailyData;
    }

    getPeriodLabel() {
        const period = document.getElementById('report-period')?.value || 'week';
        const labels = {
            'week': 'Esta semana',
            'month': 'Este mes',
            'year': 'Este año'
        };
        return labels[period] || 'Período seleccionado';
    }

    updateReportDisplay(reportData) {
        // Actualizar estadísticas principales
        const tasksCompletedElement = document.getElementById('report-tasks-completed');
        const totalTimeElement = document.getElementById('report-total-time');
        const dailyAverageElement = document.getElementById('report-daily-average');

        if (tasksCompletedElement) {
            tasksCompletedElement.textContent = `${reportData.tasksCompleted} de ${reportData.totalTasks}`;
        }

        if (totalTimeElement) {
            totalTimeElement.textContent = Helpers.formatTime(reportData.totalTime);
        }

        if (dailyAverageElement) {
            dailyAverageElement.textContent = Helpers.formatTime(reportData.dailyAverage);
        }

        // Actualizar título del período
        const reportContent = document.getElementById('report-content');
        if (reportContent) {
            const existingTitle = reportContent.querySelector('.report-period-title');
            if (existingTitle) {
                existingTitle.remove();
            }

            const titleElement = document.createElement('h3');
            titleElement.className = 'report-period-title';
            titleElement.textContent = `Reporte de ${reportData.period}`;
            reportContent.insertBefore(titleElement, reportContent.firstChild);
        }
    }

    updateCategoryChart(categoryData) {
        const canvas = document.getElementById('category-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const categories = Object.keys(categoryData);
        
        if (categories.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No hay datos para mostrar', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Colores para las categorías
        const colors = [
            '#8b5cf6', // personal
            '#06b6d4', // trabajo
            '#10b981', // estudio
            '#f59e0b'  // salud
        ];

        // Calcular datos para el gráfico de barras
        const maxTime = Math.max(...categories.map(cat => categoryData[cat].time));
        const barWidth = canvas.width / categories.length - 20;
        const maxBarHeight = canvas.height - 60;

        categories.forEach((category, index) => {
            const data = categoryData[category];
            const barHeight = maxTime > 0 ? (data.time / maxTime) * maxBarHeight : 0;
            const x = index * (barWidth + 20) + 10;
            const y = canvas.height - barHeight - 30;

            // Dibujar barra
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);

            // Dibujar etiqueta de categoría
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                this.getCategoryLabel(category), 
                x + barWidth / 2, 
                canvas.height - 10
            );

            // Dibujar tiempo
            if (data.time > 0) {
                ctx.fillText(
                    Helpers.formatTime(data.time),
                    x + barWidth / 2,
                    y - 5
                );
            }

            // Dibujar número de tareas completadas
            ctx.fillText(
                `${data.completed}/${data.total}`,
                x + barWidth / 2,
                y + barHeight / 2
            );
        });
    }

    getCategoryLabel(category) {
        const labels = {
            'personal': 'Personal',
            'trabajo': 'Trabajo',
            'estudio': 'Estudio',
            'salud': 'Salud'
        };
        return labels[category] || category;
    }

    exportAllData() {
        const allData = {
            tasks: window.taskManager ? window.taskManager.tasks : [],
            reminders: window.reminderManager ? window.reminderManager.reminders : [],
            calendarEvents: window.calendarManager ? window.calendarManager.events : [],
            timerState: window.storage.load('timerState', {}),
            reportData: this.getReportData('year'),
            exportInfo: {
                date: new Date().toISOString(),
                version: '1.0',
                source: 'Cogeme el paso - Gestión del Tiempo'
            }
        };

        // Exportar como JSON
        const jsonString = JSON.stringify(allData, null, 2);
        const filename = `cogeme_el_paso_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        Helpers.downloadAsFile(jsonString, filename, 'application/json');

        // También exportar como CSV para las tareas
        this.exportTasksAsCSV();

        window.notifications.success('Datos exportados correctamente');
    }

    exportTasksAsCSV() {
        const tasks = window.taskManager ? window.taskManager.tasks : [];
        if (tasks.length === 0) return;

        const headers = [
            'ID',
            'Texto',
            'Categoría',
            'Completada',
            'Tiempo (ms)',
            'Tiempo (formato)',
            'Fecha Creación',
            'Fecha Completado'
        ];

        const csvContent = [
            headers.join(','),
            ...tasks.map(task => [
                task.id,
                `"${task.text.replace(/"/g, '""')}"`,
                task.category,
                task.completed ? 'Sí' : 'No',
                task.timeSpent,
                `"${Helpers.formatTime(task.timeSpent)}"`,
                task.createdAt,
                task.completedAt || ''
            ].join(','))
        ].join('\n');

        const filename = `tareas_${new Date().toISOString().split('T')[0]}.csv`;
        Helpers.downloadAsFile(csvContent, filename, 'text/csv');
    }

    generateProductivityReport() {
        const tasks = window.taskManager ? window.taskManager.tasks : [];
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const weeklyStats = this.calculateStats(lastWeek, now);
        const monthlyStats = this.calculateStats(lastMonth, now);

        const report = {
            generatedAt: now.toISOString(),
            summary: {
                totalTasks: tasks.length,
                completedTasks: tasks.filter(t => t.completed).length,
                totalTimeSpent: tasks.reduce((sum, task) => sum + task.timeSpent, 0),
                averageTaskTime: tasks.length > 0 ? 
                    tasks.reduce((sum, task) => sum + task.timeSpent, 0) / tasks.length : 0
            },
            weekly: weeklyStats,
            monthly: monthlyStats,
            trends: this.calculateTrends(tasks),
            recommendations: this.generateRecommendations(tasks)
        };

        return report;
    }

    calculateTrends(tasks) {
        const now = new Date();
        const periods = [];

        // Dividir en períodos de 7 días para los últimos 28 días
        for (let i = 0; i < 4; i++) {
            const endDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            const periodTasks = tasks.filter(task => {
                const completedDate = task.completedAt ? new Date(task.completedAt) : null;
                return completedDate && completedDate >= startDate && completedDate <= endDate;
            });

            periods.push({
                week: i + 1,
                completed: periodTasks.length,
                timeSpent: periodTasks.reduce((sum, task) => sum + task.timeSpent, 0)
            });
        }

        return periods.reverse();
    }

    generateRecommendations(tasks) {
        const recommendations = [];
        const completedTasks = tasks.filter(t => t.completed);
        const pendingTasks = tasks.filter(t => !t.completed);

        // Recomendación basada en tasa de completado
        const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
        
        if (completionRate < 50) {
            recommendations.push({
                type: 'completion',
                message: 'Tu tasa de completado es baja. Considera dividir las tareas grandes en subtareas más pequeñas.',
                priority: 'high'
            });
        }

        // Recomendación basada en tiempo promedio
        const avgTime = completedTasks.length > 0 ? 
            completedTasks.reduce((sum, task) => sum + task.timeSpent, 0) / completedTasks.length : 0;
        
        if (avgTime > 2 * 60 * 60 * 1000) { // Más de 2 horas
            recommendations.push({
                type: 'time',
                message: 'Tus tareas toman mucho tiempo en promedio. Usa la técnica Pomodoro para mantener el foco.',
                priority: 'medium'
            });
        }

        // Recomendación basada en tareas pendientes
        if (pendingTasks.length > 10) {
            recommendations.push({
                type: 'backlog',
                message: 'Tienes muchas tareas pendientes. Prioriza las más importantes y elimina las que ya no son relevantes.',
                priority: 'medium'
            });
        }

        // Recomendación basada en categorías
        const categoryStats = {};
        tasks.forEach(task => {
            if (!categoryStats[task.category]) {
                categoryStats[task.category] = { total: 0, completed: 0 };
            }
            categoryStats[task.category].total++;
            if (task.completed) {
                categoryStats[task.category].completed++;
            }
        });

        const lowPerformanceCategories = Object.keys(categoryStats).filter(cat => {
            const stats = categoryStats[cat];
            return stats.total > 3 && (stats.completed / stats.total) < 0.3;
        });

        if (lowPerformanceCategories.length > 0) {
            recommendations.push({
                type: 'category',
                message: `Tienes bajo rendimiento en: ${lowPerformanceCategories.join(', ')}. Revisa tu enfoque en estas áreas.`,
                priority: 'low'
            });
        }

        return recommendations;
    }

    // Generar reporte en PDF (simulado con HTML)
    generatePDFReport() {
        const report = this.generateProductivityReport();
        const reportData = this.getReportData('month');

        const htmlContent = `
            <html>
            <head>
                <title>Reporte de Productividad - Cogeme el paso</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    .stat { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ccc; }
                    .recommendation { background: #f0f0f0; padding: 10px; margin: 5px 0; }
                    .high { border-left: 4px solid #ef4444; }
                    .medium { border-left: 4px solid #f59e0b; }
                    .low { border-left: 4px solid #10b981; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reporte de Productividad</h1>
                    <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
                </div>
                
                <div class="section">
                    <h2>Resumen General</h2>
                    <div class="stat">
                        <strong>Tareas Totales:</strong> ${report.summary.totalTasks}
                    </div>
                    <div class="stat">
                        <strong>Tareas Completadas:</strong> ${report.summary.completedTasks}
                    </div>
                    <div class="stat">
                        <strong>Tiempo Total:</strong> ${Helpers.formatTime(report.summary.totalTimeSpent)}
                    </div>
                    <div class="stat">
                        <strong>Tasa de Completado:</strong> ${reportData.completionRate}%
                    </div>
                </div>

                <div class="section">
                    <h2>Estadísticas del Mes</h2>
                    <p><strong>Tareas Completadas:</strong> ${reportData.tasksCompleted}</p>
                    <p><strong>Tiempo Total:</strong> ${Helpers.formatTime(reportData.totalTime)}</p>
                    <p><strong>Promedio Diario:</strong> ${Helpers.formatTime(reportData.dailyAverage)}</p>
                </div>

                <div class="section">
                    <h2>Recomendaciones</h2>
                    ${report.recommendations.map(rec => 
                        `<div class="recommendation ${rec.priority}">
                            <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}
                        </div>`
                    ).join('')}
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_productividad_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        window.notifications.success('Reporte PDF generado');
    }
}

// Instancia global
window.reportManager = new ReportManager();

