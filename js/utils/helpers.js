// Funciones de utilidad general
class Helpers {
    // Formatear tiempo en milisegundos a string legible
    static formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Formatear fecha para mostrar
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        return new Date(date).toLocaleDateString('es-ES', finalOptions);
    }

    // Formatear fecha y hora
    static formatDateTime(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        return new Date(date).toLocaleDateString('es-ES', finalOptions);
    }

    // Obtener fecha de hoy en formato YYYY-MM-DD
    static getTodayString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // Verificar si una fecha es hoy
    static isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        
        return today.getFullYear() === checkDate.getFullYear() &&
               today.getMonth() === checkDate.getMonth() &&
               today.getDate() === checkDate.getDate();
    }

    // Verificar si una fecha es esta semana
    static isThisWeek(date) {
        const today = new Date();
        const checkDate = new Date(date);
        
        // Obtener el lunes de esta semana
        const mondayThisWeek = new Date(today);
        mondayThisWeek.setDate(today.getDate() - today.getDay() + 1);
        mondayThisWeek.setHours(0, 0, 0, 0);
        
        // Obtener el domingo de esta semana
        const sundayThisWeek = new Date(mondayThisWeek);
        sundayThisWeek.setDate(mondayThisWeek.getDate() + 6);
        sundayThisWeek.setHours(23, 59, 59, 999);
        
        return checkDate >= mondayThisWeek && checkDate <= sundayThisWeek;
    }

    // Verificar si una fecha es este mes
    static isThisMonth(date) {
        const today = new Date();
        const checkDate = new Date(date);
        
        return today.getFullYear() === checkDate.getFullYear() &&
               today.getMonth() === checkDate.getMonth();
    }

    // Generar ID único
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Escapar HTML
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Validar email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validar URL
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Obtener contraste de color
    static getContrastColor(hexColor) {
        // Convertir hex a RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Calcular luminancia
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    // Copiar texto al portapapeles
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback para navegadores antiguos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    // Descargar datos como archivo
    static downloadAsFile(data, filename, type = 'application/json') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Leer archivo como texto
    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    // Calcular diferencia entre fechas en días
    static daysDifference(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    }

    // Obtener nombre del día de la semana
    static getDayName(date, short = false) {
        const days = short 
            ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
            : ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        
        return days[new Date(date).getDay()];
    }

    // Obtener nombre del mes
    static getMonthName(date, short = false) {
        const months = short
            ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
            : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        return months[new Date(date).getMonth()];
    }

    // Obtener días en un mes
    static getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    // Obtener primer día de la semana del mes
    static getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }

    // Animación suave de scroll
    static smoothScrollTo(element, duration = 300) {
        const targetPosition = element.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    }

    // Verificar si el dispositivo es móvil
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Verificar si el navegador soporta una característica
    static supportsFeature(feature) {
        switch (feature) {
            case 'notifications':
                return 'Notification' in window;
            case 'serviceWorker':
                return 'serviceWorker' in navigator;
            case 'localStorage':
                return typeof(Storage) !== 'undefined';
            case 'webAudio':
                return !!(window.AudioContext || window.webkitAudioContext);
            default:
                return false;
        }
    }
}

// Hacer disponible globalmente
window.Helpers = Helpers;

