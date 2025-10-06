// Aplicación principal optimizada de Cógeme el paso

// ==================== UTILS.JS ====================
class Utils {
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    static formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        return new Intl.DateTimeFormat('es-ES', options).format(date);
    }

    static formatDateShort(date) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        };
        return new Intl.DateTimeFormat('es-ES', options).format(date);
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

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

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    static escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static daysDifference(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date1 - date2) / oneDay));
    }

    static isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    static getStartOfDay(date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    static getEndOfDay(date) {
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return end;
    }

    static getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    static getStartOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    static getEndOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
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

    static downloadFile(content, filename, contentType = 'application/json') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    static compressData(data) {
        try {
            return btoa(JSON.stringify(data));
        } catch (err) {
            console.error('Error comprimiendo datos:', err);
            return null;
        }
    }

    static decompressData(compressedData) {
        try {
            return JSON.parse(atob(compressedData));
        } catch (err) {
            console.error('Error descomprimiendo datos:', err);
            return null;
        }
    }

    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        const colors = {
            success: '#4ade80',
            error: '#ef4444',
            warning: '#facc15',
            info: '#3b82f6'
        };
        
        toast.style.backgroundColor = colors[type] || colors.info;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
        
        toast.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });
    }

    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isOnline() {
        return navigator.onLine;
    }

    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    static simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    static formatNumber(num) {
        return new Intl.NumberFormat('es-ES').format(num);
    }

    static calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    static interpolateColor(color1, color2, factor) {
        const result = color1.slice();
        for (let i = 0; i < 3; i++) {
            result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
        }
        return result;
    }

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static checkFeatureSupport() {
        return {
            localStorage: typeof(Storage) !== "undefined",
            notifications: "Notification" in window,
            serviceWorker: "serviceWorker" in navigator,
            webWorker: typeof(Worker) !== "undefined",
            clipboard: navigator.clipboard !== undefined,
            geolocation: "geolocation" in navigator,
            camera: "mediaDevices" in navigator,
            fullscreen: document.fullscreenEnabled || document.webkitFullscreenEnabled,
            vibration: "vibrate" in navigator
        };
    }

    static sanitizeInput(input, type = 'text') {
        if (typeof input !== 'string') return '';
        let sanitized = input.trim();
        
        switch (type) {
            case 'email':
                sanitized = sanitized.toLowerCase();
                break;
            case 'number':
                sanitized = sanitized.replace(/[^0-9.-]/g, '');
                break;
            case 'alphanumeric':
                sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
                break;
            case 'text':
            default:
                sanitized = sanitized.replace(/[<>\"']/g, '');
                break;
        }
        return sanitized;
    }
}

// ==================== STORAGE.JS ====================
class StorageManager {
    constructor() {
        this.prefix = 'cogeme_el_paso_';
        this.version = '1.0';
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.lastSync = null;
        
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        this.initializeDefaultData();
    }
    
    initializeDefaultData() {
        const keys = ['tasks', 'reminders', 'goals', 'timeEntries', 'settings'];
        
        keys.forEach(key => {
            if (!this.get(key)) {
                let defaultValue;
                switch (key) {
                    case 'settings':
                        defaultValue = this.getDefaultSettings();
                        break;
                    default:
                        defaultValue = [];
                }
                this.set(key, defaultValue);
            }
        });
        
        this.migrateDataIfNeeded();
    }
    
    getDefaultSettings() {
        return {
            theme: 'default',
            fontSize: 'medium',
            soundEnabled: true,
            animationsEnabled: true,
            notificationsEnabled: true,
            reminderAdvance: 5,
            autoSave: true,
            syncEnabled: false,
            language: 'es',
            firstTime: true
        };
    }
    
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error obteniendo ${key}:`, error);
            return null;
        }
    }
    
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serialized);
            
            if (this.shouldSync(key)) {
                this.addToSyncQueue(key, value);
            }
            
            this.dispatchStorageEvent(key, value);
            return true;
        } catch (error) {
            console.error(`Error guardando ${key}:`, error);
            
            if (error.name === 'QuotaExceededError') {
                this.cleanupStorage();
                try {
                    localStorage.setItem(this.prefix + key, JSON.stringify(value));
                    return true;
                } catch (retryError) {
                    console.error('Error después de limpiar storage:', retryError);
                    Utils.showToast('Error: Espacio de almacenamiento insuficiente', 'error');
                }
            }
            return false;
        }
    }
    
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            
            if (this.shouldSync(key)) {
                this.addToSyncQueue(key, null, 'delete');
            }
            
            this.dispatchStorageEvent(key, null, 'delete');
            return true;
        } catch (error) {
            console.error(`Error eliminando ${key}:`, error);
            return false;
        }
    }
    
    exists(key) {
        return localStorage.getItem(this.prefix + key) !== null;
    }
    
    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }
        return keys;
    }
    
    exportAllData() {
        const data = {
            version: this.version,
            timestamp: new Date().toISOString(),
            data: {}
        };
        
        const keys = this.getAllKeys();
        keys.forEach(key => {
            data.data[key] = this.get(key);
        });
        
        return data;
    }
    
    async importAllData(importData) {
        try {
            if (!importData.data || typeof importData.data !== 'object') {
                throw new Error('Formato de datos inválido');
            }
            
            const backup = this.exportAllData();
            this.set('backup_' + Date.now(), backup);
            
            Object.keys(importData.data).forEach(key => {
                this.set(key, importData.data[key]);
            });
            
            Utils.showToast('Datos importados correctamente', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('Error importando datos:', error);
            Utils.showToast('Error al importar datos: ' + error.message, 'error');
            return false;
        }
    }
    
    clearAllData() {
        try {
            const keys = this.getAllKeys();
            keys.forEach(key => {
                if (!key.startsWith('backup_')) {
                    this.remove(key);
                }
            });
            
            this.initializeDefaultData();
            
            Utils.showToast('Todos los datos han sido eliminados', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('Error limpiando datos:', error);
            Utils.showToast('Error al limpiar datos', 'error');
            return false;
        }
    }
    
    cleanupStorage() {
        try {
            const keys = this.getAllKeys();
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            keys.forEach(key => {
                if (key.startsWith('backup_')) {
                    const timestamp = parseInt(key.split('_')[1]);
                    if (timestamp < sevenDaysAgo) {
                        this.remove(key);
                    }
                }
            });
            
            const timeEntries = this.get('timeEntries') || [];
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const filteredEntries = timeEntries.filter(entry => 
                new Date(entry.date).getTime() > thirtyDaysAgo
            );
            
            if (filteredEntries.length < timeEntries.length) {
                this.set('timeEntries', filteredEntries);
            }
            
            console.log('Storage limpiado');
        } catch (error) {
            console.error('Error limpiando storage:', error);
        }
    }
    
    shouldSync(key) {
        const settings = this.get('settings') || {};
        return settings.syncEnabled && this.isUserLoggedIn() && 
               !key.startsWith('backup_') && !key.startsWith('temp_');
    }
    
    isUserLoggedIn() {
        const user = this.get('currentUser');
        return user && user.id;
    }
    
    addToSyncQueue(key, value, operation = 'update') {
        const syncItem = {
            key,
            value,
            operation,
            timestamp: Date.now(),
            id: Utils.generateId()
        };
        
        this.syncQueue.push(syncItem);
        
        if (this.isOnline) {
            this.processSyncQueue();
        }
    }
    
    async processSyncQueue() {
        if (!this.isOnline || this.syncQueue.length === 0 || !this.isUserLoggedIn()) {
            return;
        }
        
        const user = this.get('currentUser');
        const itemsToSync = [...this.syncQueue];
        this.syncQueue = [];
        
        try {
            await this.simulateCloudSync(user.id, itemsToSync);
            this.lastSync = new Date();
            this.set('lastSync', this.lastSync);
            console.log('Sincronización completada:', itemsToSync.length, 'elementos');
        } catch (error) {
            console.error('Error en sincronización:', error);
            this.syncQueue.unshift(...itemsToSync);
            Utils.showToast('Error de sincronización. Se reintentará automáticamente.', 'warning');
        }
    }
    
    async simulateCloudSync(userId, items) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        if (Math.random() < 0.05) {
            throw new Error('Error de conexión simulado');
        }
        
        console.log('Sincronizando con servidor:', { userId, items });
        return { success: true, synced: items.length };
    }
    
    migrateDataIfNeeded() {
        const currentVersion = this.get('dataVersion') || '0.0';
        
        if (currentVersion !== this.version) {
            console.log(`Migrando datos de ${currentVersion} a ${this.version}`);
            this.set('dataVersion', this.version);
        }
    }
    
    dispatchStorageEvent(key, value, operation = 'update') {
        const event = new CustomEvent('storageChange', {
            detail: { key, value, operation, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }
    
    getStorageStats() {
        let totalSize = 0;
        const stats = {};
        
        const keys = this.getAllKeys();
        keys.forEach(key => {
            const item = localStorage.getItem(this.prefix + key);
            const size = new Blob([item]).size;
            totalSize += size;
            stats[key] = {
                size: size,
                sizeFormatted: this.formatBytes(size)
            };
        });
        
        return {
            totalSize,
            totalSizeFormatted: this.formatBytes(totalSize),
            itemCount: keys.length,
            items: stats,
            quota: this.getStorageQuota()
        };
    }
    
    getStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate();
        }
        return Promise.resolve({ quota: 'unknown', usage: 'unknown' });
    }
    
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    createAutoBackup() {
        const settings = this.get('settings') || {};
        if (!settings.autoSave) return;
        
        const lastBackup = this.get('lastAutoBackup');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (!lastBackup || (now - lastBackup) > oneDay) {
            const backup = this.exportAllData();
            this.set('autoBackup_' + Utils.formatDateShort(new Date()).replace(/\s/g, '_'), backup);
            this.set('lastAutoBackup', now);
            this.cleanupAutoBackups();
        }
    }
    
    cleanupAutoBackups() {
        const keys = this.getAllKeys();
        const autoBackups = keys.filter(key => key.startsWith('autoBackup_'))
                               .sort()
                               .reverse();
        
        if (autoBackups.length > 7) {
            autoBackups.slice(7).forEach(key => {
                this.remove(key);
            });
        }
    }
    
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isLoggedIn: this.isUserLoggedIn(),
            syncEnabled: (this.get('settings') || {}).syncEnabled,
            lastSync: this.lastSync,
            queueLength: this.syncQueue.length,
            pendingSync: this.syncQueue.length > 0
        };
    }
}

// ==================== AUTH.JS ====================
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.loginModal = null;
        this.authForms = {};
        
        this.init();
    }
    
    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.checkExistingSession();
        this.updateUI();
    }
    
    setupDOM() {
        this.loginModal = document.getElementById('loginModal');
        this.authForms = {
            login: document.getElementById('loginForm'),
            register: document.getElementById('registerForm')
        };
        
        this.elements = {
            loginBtn: document.getElementById('login-btn'),
            userMenu: document.getElementById('user-menu'),
            userName: document.getElementById('user-name'),
            logoutBtn: document.getElementById('logout-btn'),
            continueWithoutAccount: document.getElementById('continueWithoutAccount'),
            authTabs: document.querySelectorAll('.auth-tab')
        };
    }
    
    setupEventListeners() {
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }
        
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        if (this.elements.continueWithoutAccount) {
            this.elements.continueWithoutAccount.addEventListener('click', () => {
                this.hideLoginModal();
                storage.set('skipLogin', true);
            });
        }
        
        this.elements.authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchAuthTab(tab.dataset.tab);
            });
        });
        
        if (this.authForms.login) {
            this.authForms.login.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (this.authForms.register) {
            this.authForms.register.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
        
        const closeButtons = this.loginModal?.querySelectorAll('.modal-close');
        closeButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideLoginModal();
            });
        });
        
        this.loginModal?.addEventListener('click', (e) => {
            if (e.target === this.loginModal) {
                this.hideLoginModal();
            }
        });
        
        window.addEventListener('storageChange', (e) => {
            if (['tasks', 'goals', 'timeEntries'].includes(e.detail.key)) {
                window.app.renderGoalsProgress();
            }
        });
        
        window.addEventListener('storageChange', (e) => {
            if (e.detail.key === 'currentUser') {
                this.currentUser = e.detail.value;
                this.isLoggedIn = !!this.currentUser;
                this.updateUI();
            }
        });
    }
    
    checkExistingSession() {
        const user = storage.get('currentUser');
        const skipLogin = storage.get('skipLogin');
        
        if (user && this.validateSession(user)) {
            this.currentUser = user;
            this.isLoggedIn = true;
        } else if (!skipLogin && this.shouldPromptLogin()) {
            setTimeout(() => {
                this.showLoginModal();
            }, 2000);
        }
    }
    
    validateSession(user) {
        if (!user || !user.sessionExpiry) return false;
        
        const now = Date.now();
        const expiry = new Date(user.sessionExpiry).getTime();
        
        return now < expiry;
    }
    
    shouldPromptLogin() {
        const settings = storage.get('settings') || {};
        return settings.firstTime !== false;
    }
    
    showLoginModal() {
        if (this.loginModal) {
            this.loginModal.style.display = 'flex';
            this.loginModal.setAttribute('aria-hidden', 'false');
            
            const firstInput = this.loginModal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }
    
    hideLoginModal() {
        if (this.loginModal) {
            this.loginModal.style.display = 'none';
            this.loginModal.setAttribute('aria-hidden', 'true');
        }
    }
    
    switchAuthTab(tabName) {
        this.elements.authTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        Object.keys(this.authForms).forEach(formName => {
            const form = this.authForms[formName];
            if (form) {
                form.classList.toggle('hidden', formName !== tabName);
            }
        });
        
        const title = document.getElementById('loginModalTitle');
        if (title) {
            title.textContent = tabName === 'login' ? 'Iniciar Sesión' : 'Registrarse';
        }
    }
    
    async handleLogin() {
        const form = this.authForms.login;
        const email = form.querySelector('#loginEmail').value;
        const password = form.querySelector('#loginPassword').value;

        // Limpiar mensaje anterior
        const mensajeDiv = document.getElementById('mensaje');
        if (mensajeDiv) mensajeDiv.textContent = '';

        if (!this.validateLoginForm(email, password)) {
            if (mensajeDiv) mensajeDiv.textContent = 'Por favor completa todos los campos correctamente.';
            return;
        }

        this.setFormLoading(form, true);

        try {
            // Usar FormData para enviar como formulario tradicional
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            const response = await fetch('login.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();

            if (result.success) {
                const user = {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    avatar: result.user.avatar || this.generateAvatar(result.user.name),
                    sessionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    loginTime: new Date()
                };
                this.loginSuccess(user);
                if (mensajeDiv) mensajeDiv.textContent = '¡Inicio de sesión exitoso!';
            } else {
                if (mensajeDiv) mensajeDiv.textContent = result.message || 'Email o contraseña incorrectos';
                this.showAuthMessage(result.message || 'Email o contraseña incorrectos', 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            if (mensajeDiv) mensajeDiv.textContent = 'Error de conexión con el servidor';
            this.showAuthMessage('Error de conexión con el servidor', 'error');
        } finally {
            this.setFormLoading(form, false);
        }
    }
    
    async handleRegister() {
        const form = this.authForms.register;
        const name = form.querySelector('#registerName').value;
        const email = form.querySelector('#registerEmail').value;
        const password = form.querySelector('#registerPassword').value;
        const confirmPassword = form.querySelector('#registerPasswordConfirm').value;
    
        if (!this.validateRegisterForm(name, email, password, confirmPassword)) {
            return;
        }

        this.setFormLoading(form, true);

        try {
            const formData = new FormData();
            formData.append('username', name);
            formData.append('email', email);
            formData.append('password', password);

           const response = await fetch('register.php', {
               method: 'POST',
               body: formData
           });

            const result = await response.json();

            if (result.success) {
                const user = {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    avatar: result.user.avatar || null
                };
                this.loginSuccess(user);
                this.showAuthMessage('Cuenta creada exitosamente', 'success');
            } else {
                this.showAuthMessage(result.message || 'Error al crear la cuenta', 'error');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.showAuthMessage('Error de conexión. Inténtalo de nuevo.', 'error');
        } finally {
            this.setFormLoading(form, false);
        }
    }
    
    validateLoginForm(email, password) {
        if (!email || !password) {
            this.showAuthMessage('Por favor completa todos los campos', 'error');
            return false;
        }
        
        if (!Utils.isValidEmail(email)) {
            this.showAuthMessage('Por favor ingresa un email válido', 'error');
            return false;
        }
        
        return true;
    }
    
    validateRegisterForm(name, email, password, confirmPassword) {
        if (!name || !email || !password || !confirmPassword) {
            this.showAuthMessage('Por favor completa todos los campos', 'error');
            return false;
        }
        
        if (!Utils.isValidEmail(email)) {
            this.showAuthMessage('Por favor ingresa un email válido', 'error');
            return false;
        }
        
        if (password.length < 6) {
            this.showAuthMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showAuthMessage('Las contraseñas no coinciden', 'error');
            return false;
        }
        
        return true;
    }
    
    async authenticateUser(email, password) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const users = storage.get('registeredUsers') || [];
        const user = users.find(u => u.email === email);
        
        if (user && user.password === this.hashPassword(password)) {
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || this.generateAvatar(user.name),
                sessionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                loginTime: new Date()
            };
        }
        
        return null;
    }
    
    async registerUser(name, email, password) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const users = storage.get('registeredUsers') || [];
        if (users.find(u => u.email === email)) {
            throw new Error('El email ya está registrado');
        }
        
        const newUser = {
            id: Utils.generateId(),
            name: Utils.sanitizeInput(name),
            email: email.toLowerCase(),
            password: this.hashPassword(password),
            avatar: this.generateAvatar(name),
            createdAt: new Date(),
            verified: true
        };
        
        users.push(newUser);
        storage.set('registeredUsers', users);
        
        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            avatar: newUser.avatar,
            sessionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            loginTime: new Date()
        };
    }
    
    hashPassword(password) {
        return Utils.simpleHash(password + 'salt_cogeme_el_paso').toString();
    }
    
    generateAvatar(name) {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4ade80', '#facc15', '#ef4444'];
        const color = colors[Utils.simpleHash(name) % colors.length];
        
        return {
            initials,
            color,
            type: 'initials'
        };
    }
    
    loginSuccess(user) {
        this.currentUser = user;
        this.isLoggedIn = true;
        
        storage.set('currentUser', user);
        
        const settings = storage.get('settings') || {};
        settings.syncEnabled = true;
        settings.firstTime = false;
        storage.set('settings', settings);
        
        this.hideLoginModal();
        this.updateUI();
        
        Utils.showToast(`¡Bienvenido, ${user.name}!`, 'success');
        
        setTimeout(() => {
            storage.processSyncQueue();
        }, 1000);
    }
    
    logout() {
        if (this.currentUser) {
            Utils.showToast(`¡Hasta luego, ${this.currentUser.name}!`, 'info');
        }
        
        this.currentUser = null;
        this.isLoggedIn = false;
        
        storage.remove('currentUser');
        
        const settings = storage.get('settings') || {};
        settings.syncEnabled = false;
        storage.set('settings', settings);
        
        this.updateUI();
    }
    
    updateUI() {
        if (this.isLoggedIn && this.currentUser) {
            if (this.elements.loginBtn) {
                this.elements.loginBtn.style.display = 'none';
            }
            if (this.elements.userMenu) {
                this.elements.userMenu.classList.remove('hidden');
            }
            if (this.elements.userName) {
                this.elements.userName.textContent = this.currentUser.name;
            }
            
            this.updateUserAvatar();
        } else {
            if (this.elements.loginBtn) {
                this.elements.loginBtn.style.display = 'flex';
            }
            if (this.elements.userMenu) {
                this.elements.userMenu.classList.add('hidden');
            }
        }
        
        this.updateConnectionStatus();
    }
    
    updateUserAvatar() {
        if (!this.currentUser || !this.currentUser.avatar) return;
        
        const avatar = this.currentUser.avatar;
        const avatarElements = document.querySelectorAll('.user-avatar');
        
        avatarElements.forEach(element => {
            if (avatar.type === 'initials') {
                element.textContent = avatar.initials;
                element.style.backgroundColor = avatar.color;
                element.style.color = '#ffffff';
            }
        });
    }
    
    updateConnectionStatus() {
        let statusElement = document.querySelector('.connection-status');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'connection-status';
            document.body.appendChild(statusElement);
        }
        
        const syncStatus = storage.getSyncStatus();
        let status, text;
        
        if (!syncStatus.isOnline) {
            status = 'offline';
            text = 'Sin conexión';
        } else if (syncStatus.pendingSync) {
            status = 'syncing';
            text = 'Sincronizando...';
        } else if (syncStatus.isLoggedIn && syncStatus.syncEnabled) {
            status = 'online';
            text = 'Sincronizado';
        } else {
            status = 'offline';
            text = 'Local';
        }
        
        statusElement.className = `connection-status ${status}`;
        statusElement.textContent = text;
        
        if (status === 'online') {
            setTimeout(() => {
                statusElement.style.opacity = '0.5';
            }, 3000);
        } else {
            statusElement.style.opacity = '1';
        }
    }
    
    showAuthMessage(message, type) {
        const existingMessage = this.loginModal?.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `auth-message ${type}`;
        messageElement.textContent = message;
        
        const modalBody = this.loginModal?.querySelector('.modal-body');
        if (modalBody) {
            modalBody.insertBefore(messageElement, modalBody.firstChild);
            
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 5000);
        }
    }
    
    setFormLoading(form, loading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input');
        
        if (loading) {
            submitBtn.disabled = false;
            submitBtn.classList.add('auth-loading');
            inputs.forEach(input => input.disabled = true);
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('auth-loading');
            inputs.forEach(input => input.disabled = false);
        }
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isAuthenticated() {
        return this.isLoggedIn;
    }
    
    async updateProfile(updates) {
        if (!this.isLoggedIn) return false;
        
        try {
            this.currentUser = { ...this.currentUser, ...updates };
            storage.set('currentUser', this.currentUser);
            
            const users = storage.get('registeredUsers') || [];
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...updates };
                storage.set('registeredUsers', users);
            }
            
            this.updateUI();
            Utils.showToast('Perfil actualizado', 'success');
            
            return true;
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            Utils.showToast('Error al actualizar perfil', 'error');
            return false;
        }
    }
}

// ==================== TUTORIAL.JS ====================
class TutorialManager {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.isActive = false;
        this.tutorialData = null;
        this.overlay = null;
        this.content = null;
        this.highlight = null;
        
        this.init();
    }
    
    async init() {
        await this.loadTutorialData();
        this.setupDOM();
        this.setupEventListeners();
        this.checkFirstTime();
    }
    
    async loadTutorialData() {
        try {
            const response = await fetch('data/tutorial-content.json');
            this.tutorialData = await response.json();
            this.processTutorialSteps();
        } catch (error) {
            console.error('Error cargando tutorial:', error);
            this.tutorialData = this.getFallbackTutorialData();
            this.processTutorialSteps();
        }
    }
    
    processTutorialSteps() {
        this.steps = this.tutorialData.map((item, index) => ({
            id: index + 1,
            title: item.title,
            content: item.content,
            target: this.getTargetElement(item.title),
            position: 'bottom',
            action: this.getStepAction(item.title)
        }));
    }
    
    getTargetElement(title) {
        const targetMap = {
            'Introducción': null,
            'Acceso y navegación': 'nav',
            'Gestión de tareas': '[data-section="tareas"]',
            'Cronómetro': '[data-section="cronometro"]',
            'Temporizador (Pomodoro)': '[data-section="temporizador"]',
            'Calendario': '[data-section="calendario"]',
            'Recordatorios': '[data-section="recordatorios"]',
            'Reportes': '[data-section="reportes"]',
            'Metas y objetivos': '[data-section="metas"]',
            'Configuración': '[data-section="configuracion"]',
            'Notificaciones y sonidos': '#testNotificationBtn',
            'Soporte': '#help-btn'
        };
        
        const selector = targetMap[title];
        return selector ? document.querySelector(selector) : null;
    }
    
    getStepAction(title) {
        const actionMap = {
            'Gestión de tareas': () => window.app.showSection('tareas'),
            'Cronómetro': () => window.app.showSection('cronometro'),
            'Temporizador (Pomodoro)': () => window.app.showSection('temporizador'),
            'Calendario': () => window.app.showSection('calendario'),
            'Recordatorios': () => window.app.showSection('recordatorios'),
            'Reportes': () => window.app.showSection('reportes'),
            'Metas y objetivos': () => window.app.showSection('metas'),
            'Configuración': () => window.app.showSection('configuracion')
        };
        
        return actionMap[title] || null;
    }
    
    setupDOM() {
        this.overlay = document.getElementById('tutorial-overlay');
        this.content = this.overlay?.querySelector('.tutorial-content');
        this.highlight = this.overlay?.querySelector('.tutorial-highlight');
        
        this.elements = {
            title: document.getElementById('tutorial-title'),
            text: document.getElementById('tutorial-text'),
            step: document.getElementById('tutorial-step'),
            total: document.getElementById('tutorial-total'),
            prevBtn: document.getElementById('tutorial-prev'),
            nextBtn: document.getElementById('tutorial-next'),
            skipBtn: document.getElementById('tutorial-skip'),
            closeBtn: document.getElementById('tutorial-close'),
            progressBar: null
        };
        
        this.createProgressBar();
    }
    
    setupEventListeners() {
        const tutorialBtn = document.getElementById('tutorial-btn');
        if (tutorialBtn) {
            tutorialBtn.addEventListener('click', () => {
                this.startTutorial();
            });
        }
        
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => {
                this.previousStep();
            });
        }
        
        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => {
                this.nextStep();
            });
        }
        
        if (this.elements.skipBtn) {
            this.elements.skipBtn.addEventListener('click', () => {
                this.skipTutorial();
            });
        }
        
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => {
                this.endTutorial();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            switch (e.key) {
                case 'Escape':
                    this.endTutorial();
                    break;
                case 'ArrowLeft':
                    this.previousStep();
                    break;
                case 'ArrowRight':
                    this.nextStep();
                    break;
                case 'F1':
                    e.preventDefault();
                    this.startTutorial();
                    break;
            }
        });
        
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.endTutorial();
            }
        });
    }
    
    checkFirstTime() {
        const settings = storage.get('settings') || {};
        const hasSeenTutorial = storage.get('hasSeenTutorial');
        
        if (settings.firstTime && !hasSeenTutorial) {
            setTimeout(() => {
                this.startTutorial();
            }, 3000);
        }
    }
    
    startTutorial() {
        if (this.steps.length === 0) {
            Utils.showToast('Tutorial no disponible', 'error');
            return;
        }
        
        this.isActive = true;
        this.currentStep = 0;
        
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
            this.overlay.style.display = 'flex';
        }
        
        storage.set('hasSeenTutorial', true);
        this.showStep(this.currentStep);
        this.updateProgress();
        
        console.log('Tutorial iniciado');
    }
    
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        const step = this.steps[stepIndex];
        
        if (this.elements.title) {
            this.elements.title.textContent = step.title;
        }
        
        if (this.elements.text) {
            this.elements.text.textContent = step.content;
        }
        
        if (this.elements.step) {
            this.elements.step.textContent = stepIndex + 1;
        }
        
        if (this.elements.total) {
            this.elements.total.textContent = this.steps.length;
        }
        
        this.updateButtons(stepIndex);
        
        if (step.action) {
            step.action();
        }
        
        this.highlightTarget(step.target);
        this.updateProgress();
        this.animateStepTransition();
    }
    
    highlightTarget(target) {
        this.clearHighlight();
        
        if (!target) return;
        
        const rect = target.getBoundingClientRect();
        
        if (this.highlight) {
            Object.assign(this.highlight.style, {
                position: 'fixed',
                top: `${rect.top - 5}px`,
                left: `${rect.left - 5}px`,
                width: `${rect.width + 10}px`,
                height: `${rect.height + 10}px`,
                display: 'block',
                zIndex: '1041'
            });
        }
        
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        target.classList.add('tutorial-active');
        
        setTimeout(() => {
            target.classList.remove('tutorial-active');
        }, 3000);
    }
    
    clearHighlight() {
        if (this.highlight) {
            this.highlight.style.display = 'none';
        }
        
        document.querySelectorAll('.tutorial-active').forEach(el => {
            el.classList.remove('tutorial-active');
        });
    }
    
    updateButtons(stepIndex) {
        if (this.elements.prevBtn) {
            this.elements.prevBtn.disabled = stepIndex === 0;
            this.elements.prevBtn.style.opacity = stepIndex === 0 ? '0.5' : '1';
        }
        
        if (this.elements.nextBtn) {
            const isLastStep = stepIndex === this.steps.length - 1;
            this.elements.nextBtn.textContent = isLastStep ? 'Finalizar' : 'Siguiente';
        }
    }
    
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }
    
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.endTutorial();
        }
    }
    
    skipTutorial() {
        const confirmSkip = confirm('¿Estás seguro de que quieres saltar el tutorial?');
        if (confirmSkip) {
            this.endTutorial();
        }
    }
    
    endTutorial() {
        this.isActive = false;
        this.clearHighlight();
        
        if (this.overlay) {
            this.overlay.classList.add('hidden');
            this.overlay.style.display = 'none';
        }
        
        const settings = storage.get('settings') || {};
        settings.firstTime = false;
        storage.set('settings', settings);
        
        Utils.showToast('¡Tutorial completado! Puedes volver a verlo desde el botón de ayuda.', 'success', 5000);
        
        console.log('Tutorial finalizado');
    }
    
    createProgressBar() {
        this.elements.progressBar = document.createElement('div');
        this.elements.progressBar.className = 'tutorial-progress-bar';
        document.body.appendChild(this.elements.progressBar);
    }
    
    updateProgress() {
        if (!this.elements.progressBar || !this.isActive) return;
        
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;
        this.elements.progressBar.style.width = `${progress}%`;
        this.elements.progressBar.style.display = this.isActive ? 'block' : 'none';
    }
    
    animateStepTransition() {
        if (!this.content) return;
        
        this.content.style.transform = 'scale(0.95)';
        this.content.style.opacity = '0.8';
        
        setTimeout(() => {
            this.content.style.transform = 'scale(1)';
            this.content.style.opacity = '1';
        }, 150);
    }
    
    getFallbackTutorialData() {
        return [
            {
                title: "Introducción",
                content: "Bienvenido a Cógeme el paso, tu asistente personal para la gestión del tiempo y tareas. Este tutorial te guiará por las principales funciones."
            },
            {
                title: "Navegación",
                content: "Usa el menú superior para navegar entre las diferentes secciones: Tareas, Cronómetro, Temporizador, Calendario, Recordatorios, Reportes, Metas y Configuración."
            },
            {
                title: "Gestión de tareas",
                content: "Crea, edita y organiza tus tareas. Puedes filtrarlas por estado, categoría y fecha. Usa el botón '+ Nueva Tarea' para comenzar."
            },
            {
                title: "Cronómetro",
                content: "Mide el tiempo dedicado a tus tareas. Puedes asociar el cronómetro a una tarea específica para llevar un registro detallado."
            },
            {
                title: "Temporizador",
                content: "Usa la técnica Pomodoro o configura temporizadores personalizados. Ideal para sesiones de trabajo enfocado."
            },
            {
                title: "Finalización",
                content: "¡Perfecto! Ya conoces las funciones básicas. Explora las demás secciones para descubrir más características."
            }
        ];
    }
    
    showFeatureTutorial(featureName) {
        const featureSteps = this.getFeatureSteps(featureName);
        if (featureSteps.length === 0) return;
        
        const originalSteps = [...this.steps];
        this.steps = featureSteps;
        this.currentStep = 0;
        
        this.startTutorial();
        
        const originalEndTutorial = this.endTutorial.bind(this);
        this.endTutorial = () => {
            this.steps = originalSteps;
            this.endTutorial = originalEndTutorial;
            originalEndTutorial();
        };
    }
    
    getFeatureSteps(featureName) {
        const featureMap = {
            'tasks': [
                {
                    title: "Crear Nueva Tarea",
                    content: "Haz clic en '+ Nueva Tarea' para abrir el formulario de creación.",
                    target: document.getElementById('addTaskBtn')
                },
                {
                    title: "Completar Información",
                    content: "Llena el título, descripción, categoría y fecha de vencimiento de tu tarea.",
                    target: null
                }
            ],
            'timer': [
                {
                    title: "Configurar Tiempo",
                    content: "Ajusta las horas, minutos y segundos según tus necesidades.",
                    target: document.querySelector('.time-inputs')
                },
                {
                    title: "Iniciar Temporizador",
                    content: "Haz clic en 'Iniciar' para comenzar tu sesión de trabajo.",
                    target: document.getElementById('startTimer')
                }
            ]
        };
        
        return featureMap[featureName] || [];
    }
    
    getTutorialState() {
        return {
            isActive: this.isActive,
            currentStep: this.currentStep,
            totalSteps: this.steps.length,
            hasSeenTutorial: storage.get('hasSeenTutorial') || false
        };
    }
    
    resetTutorial() {
        storage.remove('hasSeenTutorial');
        const settings = storage.get('settings') || {};
        settings.firstTime = true;
        storage.set('settings', settings);
        
        Utils.showToast('Tutorial reiniciado. Se mostrará en la próxima carga.', 'info');
    }
}

// ==================== APP.JS ====================
class TimeManagementApp {
    constructor() {
        this.storage = window.storage;
        this.auth = window.auth;
        this.tutorial = window.tutorial;
        
        this.tasks = this.storage.get('tasks') || [];
        this.reminders = this.storage.get('reminders') || [];
        this.goals = this.storage.get('goals') || [];
        this.timeEntries = this.storage.get('timeEntries') || [];
        this.settings = this.storage.get('settings') || this.storage.getDefaultSettings();
        
        this.currentView = 'list';
        this.focusMode = false;
        
        this.init();
    }
    
    async init() {
        await this.waitForSystems();

        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.applySettings();
        this.requestNotificationPermission();

        // Initial rendering of sections
        this.renderDashboard();
        this.renderCalendar();
        this.renderReports();
        this.renderGoals();
        this.renderReminders();

        this.setupIntervals();

        const hash = window.location.hash.substring(1) || 'inicio';
        this.showSection(hash);

        // Bloque redundante eliminado para evitar confusión y posibles errores.
        // La lógica correcta ahora está centralizada en showSection().

        this.storage.createAutoBackup();

        console.log('Aplicación inicializada correctamente');
    }

    async waitForSystems() {
        let attempts = 0;
        while ((!window.storage || !window.auth || !window.tutorial) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (attempts >= 50) {
            console.warn('Algunos sistemas auxiliares no se cargaron completamente');
        }
    }
    
    setupIntervals() {
        // Verificar recordatorios cada 30 segundos para mayor precisión
        setInterval(() => {
            if (window.remindersModule) {
                window.remindersModule.checkReminders();
            }
        }, 30000);
        
        // Actualizar estadísticas del dashboard cada 30 segundos
        setInterval(() => this.updateDashboardStats(), 30000);
        
        // Auto backup cada hora
        setInterval(() => this.storage.createAutoBackup(), 3600000);
        
        // Verificación inicial de recordatorios
        setTimeout(() => {
            if (window.remindersModule) {
                window.remindersModule.checkReminders();
            }
        }, 2000);
    }
    
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
    
    showNotification(title, message, type = 'info') {
        // Mostrar toast siempre
        Utils.showToast(`${title}: ${message}`, type);
        
        // Notificación del navegador si está habilitada y permitida
        if (this.settings.notificationsEnabled && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body: message,
                    icon: 'images/icono.png',
                    tag: 'cogeme-el-paso-' + type,
                    requireInteraction: type === 'warning' || type === 'error', // Requiere interacción para recordatorios importantes
                    silent: false,
                    timestamp: Date.now()
                });
                
                // Auto-cerrar notificación después de 5 segundos (excepto las importantes)
                if (type !== 'warning' && type !== 'error') {
                    setTimeout(() => {
                        notification.close();
                    }, 5000);
                }
                
                // Manejar clic en la notificación
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    
                    // Si es un recordatorio, ir a la sección de recordatorios
                    if (title.includes('Recordatorio')) {
                        this.showSection('recordatorios');
                    }
                };
                
            } else if (Notification.permission === 'default') {
                // Solicitar permiso si no se ha decidido
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        // Volver a intentar mostrar la notificación
                        this.showNotification(title, message, type);
                    }
                });
            }
        }
        
        // Sonido si está habilitado
        if (this.settings.soundEnabled) {
            this.playSound(type);
        }
        
        // Vibración para recordatorios importantes (móviles)
        if ((type === 'warning' || type === 'error') && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
    }
    
    playSound(type) {
        if (!this.settings.soundEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const frequencies = {
                success: 800,
                warning: 600,
                error: 400,
                info: 500
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Error reproduciendo sonido:', error);
        }
    }
    
    applySettings() {
        document.body.setAttribute('data-theme', this.settings.theme);
        document.body.setAttribute('data-font-size', this.settings.fontSize);
        document.body.setAttribute('data-animations', this.settings.animationsEnabled ? 'enabled' : 'disabled');
        this.loadSettingsToUI();
    }
    
    loadSettingsToUI() {
        const elements = {
            themeSelect: document.getElementById('themeSelect'),
            fontSize: document.getElementById('fontSize'),
            soundEnabled: document.getElementById('soundEnabled'),
            animationsEnabled: document.getElementById('animationsEnabled'),
            notificationsEnabled: document.getElementById('notificationsEnabled'),
            reminderAdvance: document.getElementById('reminderAdvance')
        };
        
        Object.keys(elements).forEach(key => {
            const element = elements[key];
            if (element && this.settings[key] !== undefined) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[key];
                } else {
                    element.value = this.settings[key];
                }
            }
        });
    }
    
    updateSetting(key, value) {
        this.settings[key] = value;
        this.storage.set('settings', this.settings);
        this.applySettings();
    }
    
    setupEventListeners() {
        this.setupNavigationListeners();
        this.setupModalListeners();
        this.setupConfigListeners();
        this.setupSearchListeners();
        this.setupQuickActionListeners();

    }
    
    setupNavigationListeners() {
        // Configurar listeners para los enlaces de navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                    window.location.hash = section;
                }
            });
        });
        
        // Configurar toggle de navegación móvil
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.setAttribute('aria-expanded', 
                    navToggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
                );
            });
        }
        
        // Configurar botones de vista
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeView(btn.dataset.view);
            });
        });
        
        // Manejar cambios en el hash de la URL
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1) || 'inicio';
            this.showSection(hash);
        });
        
        // Configurar enlaces del footer
        const footerLinks = document.querySelectorAll('footer a[href^="#"]');
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                this.showInfoSection(sectionId);
            });
        });
    }
    
    setupQuickActionListeners() {
        const quickTaskBtn = document.getElementById('quick-task');
        if (quickTaskBtn) {
            quickTaskBtn.addEventListener('click', () => {
                window.tasksModule.showQuickTaskModal();
            });
        }
        
        const quickTimerBtn = document.getElementById('quick-timer');
        if (quickTimerBtn) {
            quickTimerBtn.addEventListener('click', () => {
                this.showSection('cronometro');
                window.timerModule.startStopwatch();
            });
        }
        
        const focusModeBtn = document.getElementById('focus-mode');
        if (focusModeBtn) {
            focusModeBtn.addEventListener('click', () => {
                this.toggleFocusMode();
            });
        }
    }
    
    setupSearchListeners() {
        const searchBtn = document.getElementById('search-btn');
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('global-search');
        const searchClose = document.getElementById('search-close');
        
        if (searchBtn && searchOverlay) {
            searchBtn.addEventListener('click', () => {
                searchOverlay.classList.remove('hidden');
                searchInput?.focus();
            });
        }
        
        if (searchClose) {
            searchClose.addEventListener('click', () => {
                searchOverlay.classList.add('hidden');
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.performGlobalSearch(e.target.value);
            }, 300));
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !searchOverlay?.classList.contains('hidden')) {
                searchOverlay.classList.add('hidden');
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        window.tasksModule.showTaskModal();
                        break;
                    case 'k':
                        e.preventDefault();
                        document.getElementById('search-btn')?.click();
                        break;
                    case ' ':
                        e.preventDefault();
                        window.timerModule.toggleStopwatch();
                        break;
                    case 'r':
                        e.preventDefault();
                        window.timerModule.resetStopwatch();
                        break;
                    case 't':
                        e.preventDefault();
                        window.timerModule.toggleTimer();
                        break;
                }
            } else if (e.key === 'F1') {
                e.preventDefault();
                this.tutorial?.startTutorial();
            }
        });
    }
    
    showSection(sectionId) {
        // Ocultar todas las secciones principales de navegación
        document.querySelectorAll("main > section.tab-content").forEach(section => {
            section.classList.remove("active");
            section.classList.add("hidden");
        });
        
        // Mostrar la sección objetivo
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove("hidden");
            targetSection.classList.add("active");
        }

        // --- INICIO DE LA CORRECCIÓN ---
        // Se obtiene la referencia a los módulos
        const tareasModulo = document.getElementById('tareasModulo');
        const recordatoriosModulo = document.getElementById('recordatoriosModulo');
        const metasModulo = document.getElementById('metasModulo');

        // Lógica simplificada para controlar la visibilidad de los módulos.
        // Esta única sección de código maneja todos los casos, incluido 'inicio'.
        // Si sectionId no es 'tareas', 'recordatorios' o 'metas', todos se ocultarán.
        if (tareasModulo) tareasModulo.style.display = (sectionId === 'tareas') ? 'block' : 'none';
        if (recordatoriosModulo) recordatoriosModulo.style.display = (sectionId === 'recordatorios') ? 'block' : 'none';
        if (metasModulo) metasModulo.style.display = (sectionId === 'metas') ? 'block' : 'none';
        // --- FIN DE LA CORRECCIÓN ---

        // Actualizar el estado activo de los enlaces de navegación principales
        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("data-section") === sectionId) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
        
        this.onSectionChange(sectionId);
    }

    // Función para mostrar secciones de información (Acerca de, Ayuda, Feedback)
    showInfoSection(sectionId) {
        // Ocultar todas las secciones principales de navegación
        document.querySelectorAll("main > section.tab-content").forEach(section => {
            section.classList.remove("active");
            section.classList.add("hidden");
        });

        // Mostrar la sección de información objetivo
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove("hidden");
            targetSection.classList.add("active");
        }

        // Desactivar cualquier enlace de navegación principal activo
        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
        });
    }
    
    onSectionChange(sectionId) {
        switch (sectionId) {
            case 'inicio':
                this.updateDashboardStats();
                break;
            case 'tareas':
                window.tasksModule.renderTasks();
                break;
            case 'calendario':
                window.calendarModule.renderCalendar();
                break;
            case 'reportes':
                window.reportsModule.renderReports();
                break;
            case 'metas':
                window.goalsModule.renderGoals();
                break;
            case 'recordatorios':
                window.remindersModule.renderReminders();
                break;
        }
    }
    
    changeView(viewType) {
        this.currentView = viewType;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewType);
        });
        
        window.tasksModule.renderTasks(viewType);
    }
    
    renderDashboard() {
        this.updateDashboardStats();
        this.renderRecentActivity();
        this.renderUpcomingTasks();
        this.renderGoalsProgress();
    }
    
    updateDashboardStats() {
        const today = Utils.getStartOfDay(new Date());

        // Usar un solo filtro para obtener tareas completadas hoy
        const completedToday = this.tasks.filter(task =>
            task.completed && task.completedAt &&
            Utils.isSameDay(new Date(task.completedAt), today)
        ).length;

        // Optimizar cálculo de tiempo total del día
        const totalSeconds = this.timeEntries
            .filter(entry => Utils.isSameDay(new Date(entry.date), today))
            .reduce((sum, entry) => sum + (entry.seconds || entry.duration || 0), 0);

        const streak = this.calculateStreak();
        const productivity = this.calculateProductivity();

        // Actualizar elementos de manera más eficiente
        const updates = [
            ['completedTasks', completedToday],
            ['totalTime', Utils.formatTime(totalSeconds)]
        ];
        updates.forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && element.textContent !== value.toString()) {
                element.textContent = value;
            }
        });

        // Actualizar estadísticas de Pomodoro si el módulo existe
        if (window.timerModule && typeof window.timerModule.updatePomodoroStats === 'function') {
            window.timerModule.updatePomodoroStats();
        }
    }
    
    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    calculateStreak() {
        let streak = 0;
        let currentDate = new Date();
        const maxDays = 365; // Límite para evitar bucles infinitos
        
        // Cache de fechas de tareas completadas para evitar recálculos
        const completedDates = new Set(
            this.tasks
                .filter(task => task.completed && task.completedAt)
                .map(task => Utils.getStartOfDay(new Date(task.completedAt)).getTime())
        );
        
        while (streak < maxDays) {
            const dayStart = Utils.getStartOfDay(currentDate);
            
            if (completedDates.has(dayStart.getTime())) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    calculateProductivity() {
        const today = Utils.getStartOfDay(new Date());
        const todayTasks = this.tasks.filter(task => 
            task.createdAt && Utils.isSameDay(new Date(task.createdAt), today) ||
            task.dueDate && Utils.isSameDay(new Date(task.dueDate), today)
        );
        
        if (todayTasks.length === 0) return 0;
        
        const completedTasks = todayTasks.filter(task => task.completed).length;
        return Math.round((completedTasks / todayTasks.length) * 100);
    }
    
    renderRecentActivity() {
        const container = document.getElementById('recentActivities');
        if (!container) return;
        
        const recentItems = [];
        const today = Utils.getStartOfDay(new Date());
        
        // Contar tareas agregadas hoy
        const tasksAddedToday = this.tasks.filter(task => 
            task.createdAt && Utils.isSameDay(new Date(task.createdAt), today)
        ).length;
        
        if (tasksAddedToday > 0) {
            recentItems.push({
                type: 'tasks_added',
                icon: '📝',
                text: `Se agregaron ${tasksAddedToday} tarea${tasksAddedToday > 1 ? 's' : ''}`,
                time: new Date()
            });
        }
        
        // Contar tareas completadas hoy
        const tasksCompletedToday = this.tasks.filter(task => 
            task.completed && task.completedAt && Utils.isSameDay(new Date(task.completedAt), today)
        ).length;
        
        if (tasksCompletedToday > 0) {
            recentItems.push({
                type: 'tasks_completed',
                icon: '✅',
                text: `Se completaron ${tasksCompletedToday} tarea${tasksCompletedToday > 1 ? 's' : ''}`,
                time: new Date()
            });
        }
        
        // Contar tareas eliminadas hoy
        const deletedTasks = this.storage.get('deletedTasks') || [];
        const tasksDeletedToday = deletedTasks.filter(task => 
            task.deletedAt && Utils.isSameDay(new Date(task.deletedAt), today)
        ).length;
        
        if (tasksDeletedToday > 0) {
            recentItems.push({
                type: 'tasks_deleted',
                icon: '🗑️',
                text: `Se eliminaron ${tasksDeletedToday} tarea${tasksDeletedToday > 1 ? 's' : ''}`,
                time: new Date()
            });
        }
        
        // Sesiones de Pomodoro completadas hoy
        const pomodorosToday = this.timeEntries.filter(entry => 
            entry.type === 'pomodoro' && Utils.isSameDay(new Date(entry.date), today)
        ).length;
        
        if (pomodorosToday > 0) {
            recentItems.push({
                type: 'pomodoros_completed',
                icon: '🍅',
                text: `Se completaron ${pomodorosToday} sesión${pomodorosToday > 1 ? 'es' : ''} de Pomodoro`,
                time: new Date()
            });
        }
        
        // Recordatorios agregados hoy
        const remindersAddedToday = this.reminders.filter(reminder => 
            reminder.createdAt && Utils.isSameDay(new Date(reminder.createdAt), today)
        ).length;
        
        if (remindersAddedToday > 0) {
            recentItems.push({
                type: 'reminders_added',
                icon: '🔔',
                text: `Se agregaron ${remindersAddedToday} recordatorio${remindersAddedToday > 1 ? 's' : ''}`,
                time: new Date()
            });
        }
        
        // Metas creadas hoy
        const goalsAddedToday = this.goals.filter(goal => 
            goal.createdAt && Utils.isSameDay(new Date(goal.createdAt), today)
        ).length;
        
        if (goalsAddedToday > 0) {
            recentItems.push({
                type: 'goals_added',
                icon: '🎯',
                text: `Se agregaron ${goalsAddedToday} meta${goalsAddedToday > 1 ? 's' : ''}`,
                time: new Date()
            });
        }
        
        // Contar tareas editadas hoy
        const tasksEditedToday = this.tasks.filter(task =>
            task.editedAt && Utils.isSameDay(new Date(task.editedAt), today)
        ).length;

        if (tasksEditedToday > 0) {
            recentItems.push({
                type: 'tasks_edited',
                icon: '✏️',
                text: `Se editaron ${tasksEditedToday} tarea${tasksEditedToday > 1 ? 's' : ''}`,
                time: new Date()
            });
        }
        
        if (recentItems.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay actividad reciente hoy</p>';
            return;
        }
        
        container.innerHTML = recentItems.slice(0, 5).map(item => `
            <div class="activity-item">
                <span class="activity-icon">${item.icon}</span>
                <div class="activity-content">
                    <p>${item.text}</p>
                    <small>Hoy</small>
                </div>
            </div>
        `).join('');
    }
    
    renderUpcomingTasks() {
        const container = document.getElementById('upcomingTasks');
        if (!container) return;

        const today = Utils.getStartOfDay(new Date());

        // Mostrar tareas no completadas con dueDate hoy o en el futuro, ordenadas por fecha
        const upcomingTasks = this.tasks
            .filter(task => {
                if (task.completed) return false;
                if (task.dueDate) {
                    const dueDate = Utils.getStartOfDay(new Date(task.dueDate));
                    return dueDate >= today;
                }
                return false;
            })
            .sort((a, b) => {
                // Ordenar por dueDate más próxima, luego por prioridad
                const aDue = new Date(a.dueDate);
                const bDue = new Date(b.dueDate);
                if (aDue.getTime() !== bDue.getTime()) {
                    return aDue - bDue;
                }
                if (a.priority && !b.priority) return -1;
                if (!a.priority && b.priority) return 1;
                return 0;
            })
            .slice(0, 5);

        if (upcomingTasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay tareas programadas próximas</p>';
            return;
        }

        container.innerHTML = upcomingTasks.map(task => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
            const timeText = task.dueDate && task.dueTime
                ? `${task.dueTime} hs`
                : (task.dueDate ? 'Sin hora específica' : 'Sin fecha');
            return `
                <div class="upcoming-task ${isOverdue ? 'overdue' : ''} ${task.priority ? 'priority' : ''}">
                    <div class="task-header">
                        <h4>${Utils.sanitizeHTML(task.title)}</h4>
                        ${task.priority ? '<span class="priority-badge">Alta prioridad</span>' : ''}
                    </div>
                    <p class="task-time">${timeText}</p>
                    <p class="task-category">${task.category || 'Sin categoría'}</p>
                </div>
            `;
        }).join('');
    }
    
    renderGoalsProgress() {
        // Actualizar metas desde storage antes de renderizar
        this.goals = this.storage.get('goals') || [];

        const container = document.getElementById('goalsProgress');
        if (!container) return;

        // Filtrar metas activas (no completadas y no vencidas)
        const activeGoals = this.goals.filter(goal =>
            !goal.completed && new Date(goal.deadline) >= new Date()
        );

        if (activeGoals.length === 0) {
            container.innerHTML = '<p class="empty-state">No tienes metas activas</p>';
            return;
        }

        container.innerHTML = activeGoals.map(goal => {
            // Usar progreso manual si existe, si no calcular automáticamente
            const currentValue = (typeof goal.progress === 'number' && goal.progress >= 0)
                ? goal.progress
                : this.calculateGoalCurrentValue(goal);
            const targetValue = goal.target || 1;
            const progress = Math.min((currentValue / targetValue) * 100, 100);

            // Determinar el texto de progreso según el tipo de meta
            let progressText = '';
            switch (goal.type) {
                case 'time':
                    progressText = `${currentValue} de ${targetValue} horas`;
                    break;
                case 'tasks':
                    progressText = `${currentValue} de ${targetValue} tareas`;
                    break;
                case 'streak':
                    progressText = `${currentValue} de ${targetValue} días`;
                    break;
                default:
                    progressText = `${currentValue} de ${targetValue}`;
            }

            // Calcular días restantes
            const endDate = new Date(goal.deadline);
            const currentDate = new Date();
            const remainingDays = Math.max(0, Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)));

            // Barra de progreso y porcentaje
            return `
                <div class="goal-progress">
                    <div class="goal-header">
                        <h4>${Utils.sanitizeHTML(goal.title)}</h4>
                        <span class="goal-category">${goal.category || 'General'}</span>
                    </div>
                    <div class="progress-bar" style="background:#eee; border-radius:8px; height:18px; margin:8px 0; position:relative;">
                        <div class="progress-fill" style="
                            width: ${progress}%;
                            background: linear-gradient(90deg,#4ade80,#3b82f6);
                            height: 100%;
                            border-radius:8px;
                            transition: width 0.4s;
                            position:absolute;
                            left:0; top:0;
                        "></div>
                        <span style="
                            position:absolute;
                            right:8px; top:0;
                            height:100%;
                            display:flex; align-items:center;
                            font-weight:bold; color:#222;
                            z-index:2;
                        ">${Math.round(progress)}%</span>
                    </div>
                    <div class="goal-stats">
                        <p class="progress-text">${progressText}</p>
                        <p class="remaining-time">${remainingDays} días restantes</p>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    calculateGoalCurrentValue(goal) {
        if (!goal) return 0;
        
        const startDate = new Date(goal.createdAt || goal.startDate || Date.now());
        const currentDate = new Date();
        
        switch (goal.type) {
            case 'time':
                // Calcular horas trabajadas desde el inicio de la meta
                const timeEntries = this.timeEntries.filter(entry => 
                    new Date(entry.date) >= startDate && new Date(entry.date) <= currentDate
                );
                const totalSeconds = timeEntries.reduce((sum, entry) => sum + (entry.seconds || entry.duration || 0), 0);
                return Math.floor(totalSeconds / 3600); // Convertir a horas
                
            case 'tasks':
                // Contar tareas completadas desde el inicio de la meta
                return this.tasks.filter(task => 
                    task.completed && 
                    task.completedAt && 
                    new Date(task.completedAt) >= startDate &&
                    new Date(task.completedAt) <= currentDate &&
                    (!goal.category || task.category === goal.category)
                ).length;
                
            case 'streak':
                // Calcular racha actual
                return this.calculateStreakForGoal(goal);
                
            default:
                return 0;
        }
    }
    
    calculateStreakForGoal(goal) {
        let streak = 0;
        let currentDate = new Date();
        const startDate = new Date(goal.createdAt || goal.startDate || Date.now());
        
        while (currentDate >= startDate && streak < 365) {
            const dayStart = Utils.getStartOfDay(currentDate);
            const hasActivityThatDay = this.tasks.some(task => 
                task.completed && 
                task.completedAt && 
                Utils.isSameDay(new Date(task.completedAt), dayStart) &&
                (!goal.category || task.category === goal.category)
            );
            
            if (hasActivityThatDay) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    getGoalUnit(type) {
        switch (type) {
            case 'time': return 'horas';
            case 'tasks': return 'tareas';
            case 'streak': return 'días';
            default: return 'unidades';
        }
    }
    
    getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return 'hace un momento';
    }
    
    performGlobalSearch(query) {
        if (!query || query.length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }
        
        const results = [];
        const searchTerm = query.toLowerCase();
        
        this.tasks.forEach(task => {
            if (task.title.toLowerCase().includes(searchTerm) || 
                task.description.toLowerCase().includes(searchTerm)) {
                results.push({
                    type: 'Tarea',
                    title: task.title,
                    description: task.description,
                    action: () => {
                        this.showSection('tareas');
                        window.tasksModule.highlightTask(task.id);
                    }
                });
            }
        });
        
        this.reminders.forEach(reminder => {
            if (reminder.title.toLowerCase().includes(searchTerm) || 
                reminder.description.toLowerCase().includes(searchTerm)) {
                results.push({
                    type: 'Recordatorio',
                    title: reminder.title,
                    description: reminder.description,
                    action: () => {
                        this.showSection('recordatorios');
                        window.remindersModule.highlightReminder(reminder.id);
                    }
                });
            }
        });
        
        this.goals.forEach(goal => {
            if (goal.title.toLowerCase().includes(searchTerm) || 
                goal.description.toLowerCase().includes(searchTerm)) {
                results.push({
                    type: 'Meta',
                    title: goal.title,
                    description: goal.description,
                    action: () => {
                        this.showSection('metas');
                        window.goalsModule.highlightGoal(goal.id);
                    }
                });
            }
        });
        
        this.renderSearchResults(results);
    }
    
    renderSearchResults(results) {
        const container = document.getElementById('search-results');
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = '<div class="search-result">No se encontraron resultados</div>';
            return;
        }
        
        container.innerHTML = results.map((result, index) => `
            <div class="search-result" onclick="window.app.executeSearchAction(${index})">
                <div class="search-result-type">${result.type}</div>
                <h4>${Utils.sanitizeHTML(result.title)}</h4>
                <p>${Utils.sanitizeHTML(result.description || '')}</p>
            </div>
        `).join('');
        
        this.searchActions = results.map(r => r.action);
    }
    
    executeSearchAction(index) {
        if (this.searchActions && this.searchActions[index]) {
            this.searchActions[index]();
            document.getElementById('search-overlay').classList.add('hidden');
        }
    }
    
    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        document.body.classList.toggle('focus-mode', this.focusMode);
        
        const btn = document.getElementById('focus-mode');
        if (btn) {
            btn.textContent = this.focusMode ? '🎯 Salir del Enfoque' : '🎯 Modo Enfoque';
        }
        
        Utils.showToast(
            this.focusMode ? 'Modo enfoque activado' : 'Modo enfoque desactivado',
            'info'
        );
    }
    
    setupModalListeners() {
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="flex"]');
                if (openModal) {
                    this.hideModal(openModal.id);
                }
            }
        });
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    }
    
    setupConfigListeners() {
        const configElements = {
            themeSelect: 'theme',
            fontSize: 'fontSize',
            soundEnabled: 'soundEnabled',
            animationsEnabled: 'animationsEnabled',
            notificationsEnabled: 'notificationsEnabled',
            reminderAdvance: 'reminderAdvance'
        };
        
        Object.keys(configElements).forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('change', () => {
                    const value = element.type === 'checkbox' ? element.checked : element.value;
                    this.updateSetting(configElements[elementId], value);
                });
            }
        });
        
        const exportAllBtn = document.getElementById('exportAllData');
        const importAllBtn = document.getElementById('importAllData');
        const clearAllBtn = document.getElementById('clearAllData');
        const importFileInput = document.getElementById('importFileInput');
        
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => {
                this.exportAllData();
            });
        }
        
        if (importAllBtn && importFileInput) {
            importAllBtn.addEventListener('click', () => {
                importFileInput.click();
            });
            
            importFileInput.addEventListener('change', (e) => {
                this.importAllData(e.target.files[0]);
            });
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.confirmClearAllData();
            });
        }

        // Handle feedback form submission
        const feedbackForm = document.getElementById('feedbackForm');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitFeedback(feedbackForm);
            });
        }
    }
    
    exportAllData() {
        const data = this.storage.exportAllData();
        Utils.downloadFile(
            JSON.stringify(data, null, 2),
            `cogeme_el_paso_backup_${Utils.formatDateShort(new Date()).replace(/\s/g, '_')}.json`,
            'application/json'
        );
        Utils.showToast('Datos exportados correctamente', 'success');
    }
    
    async importAllData(file) {
        if (!file) return;
        
        try {
            const content = await Utils.readFile(file);
            const data = JSON.parse(content);
            
            if (await this.storage.importAllData(data)) {
                // La página se recargará automáticamente
            }
        } catch (error) {
            console.error('Error importando datos:', error);
            Utils.showToast('Error al importar datos: archivo inválido', 'error');
        }
    }
    
    confirmClearAllData(callback = null, message = '¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.') {
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        const yesBtn = document.getElementById('confirmYes');
        const noBtn = document.getElementById('confirmNo');

        if (!modal || !messageElement || !yesBtn || !noBtn) {
            Utils.showToast('No se pudo mostrar el diálogo de confirmación.', 'error');
            return;
        }

        messageElement.textContent = message;
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');

        // Funciones nombradas para poder remover los listeners correctamente
        function handleYes() {
            yesBtn.disabled = true;
            noBtn.disabled = true;
            try {
                if (callback) {
                    callback();
                } else {
                    this.storage.clearAllData();
                }
            } catch (err) {
                Utils.showToast('Error al eliminar datos.', 'error');
                console.error(err);
            }
            closeModal();
        }

        function handleNo() {
            closeModal();
        }

        const closeModal = () => {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            yesBtn.disabled = false;
            noBtn.disabled = false;
            yesBtn.removeEventListener('click', handleYes);
            noBtn.removeEventListener('click', handleNo);
        };

        // Limpiar listeners previos
        yesBtn.removeEventListener('click', handleYes);
        noBtn.removeEventListener('click', handleNo);

        // Usar bind para que this apunte correctamente
        yesBtn.addEventListener('click', handleYes.bind(this));
        noBtn.addEventListener('click', handleNo);
    }

    submitFeedback(form) {
        const name = form.querySelector('#feedbackName').value;
        const email = form.querySelector('#feedbackEmail').value;
        const type = form.querySelector('#feedbackType').value;
        const message = form.querySelector('#feedbackMessage').value;

        if (!type || !message) {
            Utils.showToast('Por favor, selecciona un tipo de comentario y escribe tu mensaje.', 'error');
            return;
        }

        // Simulate sending feedback
        console.log('Feedback enviado:', { name, email, type, message });
        Utils.showToast('¡Gracias por tu comentario! Lo valoramos mucho.', 'success');
        form.reset();
        this.showInfoSection('inicio'); // Go back to home after submitting
    }
}

// ==================== INICIALIZACIÓN ====================
// Crear instancias globales
const storage = new StorageManager();
const auth = new AuthManager();
const tutorial = new TutorialManager();

// Hacer disponibles globalmente
window.Utils = Utils;
window.StorageManager = StorageManager;
window.storage = storage;
window.TutorialManager = TutorialManager;
window.tutorial = tutorial;
window.AuthManager = AuthManager;
window.auth = auth;

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TimeManagementApp();
    window.app.showSection('inicio'); // <-- Solución: fuerza la lógica de visibilidad al cargar
});
// Inicializar módulos después de que la aplicación principal y todos los scripts estén disponibles
// Este bloque se ejecuta después de que todos los archivos JS anteriores se hayan cargado.
window.addEventListener('load', () => {
    if (window.app) { // Asegúrate de que window.app ya esté inicializado
        window.tasksModule = new TasksModule(window.app);
        window.tasksModule.setupListeners(); 
        window.timerModule = new TimerModule(window.app);
        window.timerModule.setupListeners();
        window.calendarModule = new CalendarModule(window.app);
        window.calendarModule.setupListeners();
        window.remindersModule = new RemindersModule(window.app);
        window.remindersModule.setupListeners();
        window.goalsModule = new GoalsModule(window.app);
        window.goalsModule.setupListeners();
        window.reportsModule = new ReportsModule(window.app);
        window.reportsModule.init(); 
        
    } else {
        console.error("Error: La instancia de la aplicación no está disponible.");
    }
});

// Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}
