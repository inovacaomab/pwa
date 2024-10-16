// Configuração Universal do PWA
const APP_CONFIG = {
    mainUrl: '/',
    defaultRedirect: '/'
};

// Utilitário para detectar ambiente
const ENV = {
    isStandalone: () => window.matchMedia('(display-mode: standalone)').matches 
        || window.navigator.standalone 
        || document.referrer.includes('android-app://'),
    isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isHttps: () => window.location.protocol === 'https:',
    isLocalhost: () => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
};

// Gerenciador de instalação
class InstallManager {
    constructor() {
        this.installButton = document.getElementById('installButton');
        this.deferredPrompt = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.installPWA());
        }

        window.addEventListener('appinstalled', () => {
            this.hideInstallButton();
            this.deferredPrompt = null;
            console.log('PWA instalado com sucesso');
        });
    }

    showInstallButton() {
        if (this.installButton) {
            this.installButton.style.display = 'block';
        }
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }
    }

    async installPWA() {
        if (!this.deferredPrompt) return;

        try {
            const result = await this.deferredPrompt.prompt();
            console.log(`Usuário ${result.outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
            this.deferredPrompt = null;
        } catch (error) {
            console.error('Erro ao instalar PWA:', error);
        }
    }
}

// Gerenciador de navegação
class NavigationManager {
    constructor() {
        this.setupNavigationHandlers();
    }

    setupNavigationHandlers() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                this.navigateTo(link.href);
            }
        });

        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
    }

    navigateTo(url) {
        history.pushState(null, '', url);
        // Implemente aqui a lógica para atualizar o conteúdo da página
    }

    handleConnectionChange(isOnline) {
        if (isOnline && ENV.isStandalone()) {
            this.navigateTo(APP_CONFIG.defaultRedirect);
        }
    }
}

// Service Worker
class ServiceWorkerManager {
    static async register() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registrado:', registration.scope);
            } catch (error) {
                console.error('Erro ao registrar Service Worker:', error);
            }
        }
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    if (!ENV.isHttps() && !ENV.isLocalhost()) {
        window.location.href = window.location.href.replace('http:', 'https:');
        return;
    }

    new InstallManager();
    new NavigationManager();
    ServiceWorkerManager.register();

    if (ENV.isStandalone() && window.location.pathname !== APP_CONFIG.mainUrl) {
        window.location.href = APP_CONFIG.mainUrl;
    }
});