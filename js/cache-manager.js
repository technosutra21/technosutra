// Cache Manager UI - Gerenciador visual de cache de modelos 3D
// Mostra progresso de download, permite cancelar e deletar modelos individuais

class CacheManager {
    constructor() {
        this.models = [];
        this.isExpanded = false;
        this.downloadQueue = new Map();
        this.abortControllers = new Map();
        this.cacheStatus = new Map();
        
        this.init();
    }

    init() {
        this.createUI();
        this.setupServiceWorkerListener();
        this.loadCacheStatus();
    }

    createUI() {
        // Container principal
        const container = document.createElement('div');
        container.id = 'cache-manager';
        container.className = 'cache-manager';
        container.innerHTML = `
            <div class="cache-toggle" id="cacheToggle" role="button" tabindex="0" aria-label="Gerenciador de cache">
                <div class="cache-icon">💾</div>
                <div class="cache-summary">
                    <span class="cached-count">0</span>/<span class="total-count">56</span>
                </div>
            </div>
            
            <div class="cache-panel" id="cachePanel" aria-hidden="true">
                <div class="cache-header">
                    <h3>Cache Offline</h3>
                    <div class="cache-actions">
                        <button class="cache-btn cache-all" id="cacheAllBtn" title="Baixar todos os modelos">
                            <span class="icon">⬇️</span> Baixar Todos
                        </button>
                        <button class="cache-btn delete-all" id="deleteAllBtn" title="Deletar todos os modelos">
                            <span class="icon">🗑️</span> Limpar Tudo
                        </button>
                    </div>
                </div>
                
                <div class="cache-list" id="cacheList">
                    <!-- Lista de modelos será inserida aqui -->
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Event listeners
        document.getElementById('cacheToggle').addEventListener('click', () => this.togglePanel());
        document.getElementById('cacheAllBtn').addEventListener('click', () => this.cacheAllModels());
        document.getElementById('deleteAllBtn').addEventListener('click', () => this.deleteAllModels());
        
        // Keyboard support
        document.getElementById('cacheToggle').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.togglePanel();
            }
        });
    }

    togglePanel() {
        this.isExpanded = !this.isExpanded;
        const panel = document.getElementById('cachePanel');
        const toggle = document.getElementById('cacheToggle');
        
        if (this.isExpanded) {
            panel.classList.add('expanded');
            toggle.classList.add('active');
            panel.setAttribute('aria-hidden', 'false');
            this.renderModelList();
        } else {
            panel.classList.remove('expanded');
            toggle.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
        }
    }

    async loadCacheStatus() {
        try {
            const cache = await caches.open('techno-sutra-models-v1.0.2');
            const keys = await cache.keys();
            
            // Extrair números dos modelos em cache
            keys.forEach(request => {
                const match = request.url.match(/modelo(\d+)\.glb/);
                if (match) {
                    const modelNum = parseInt(match[1]);
                    this.cacheStatus.set(modelNum, 'cached');
                }
            });
            
            this.updateSummary();
        } catch (error) {
            console.error('Erro ao carregar status do cache:', error);
        }
    }

    updateSummary() {
        const cachedCount = this.cacheStatus.size;
        document.querySelector('.cached-count').textContent = cachedCount;
        
        // Atualizar cor do ícone baseado no progresso
        const toggle = document.getElementById('cacheToggle');
        const percentage = (cachedCount / 56) * 100;
        
        if (percentage === 100) {
            toggle.classList.add('complete');
        } else if (percentage > 0) {
            toggle.classList.add('partial');
        } else {
            toggle.classList.remove('complete', 'partial');
        }
    }

    renderModelList() {
        const list = document.getElementById('cacheList');
        list.innerHTML = '';
        
        // Carregar dados dos personagens
        this.loadCharacterData().then(characters => {
            for (let i = 1; i <= 56; i++) {
                const character = characters[i] || { name: `Modelo ${i}` };
                const status = this.cacheStatus.get(i) || 'not-cached';
                const progress = this.downloadQueue.get(i) || 0;
                
                const item = document.createElement('div');
                item.className = `cache-item ${status}`;
                item.dataset.model = i;
                
                item.innerHTML = `
                    <div class="model-info">
                        <span class="model-number">${i}</span>
                        <span class="model-name">${character.name}</span>
                    </div>
                    
                    <div class="model-status">
                        ${this.renderStatusIndicator(i, status, progress)}
                    </div>
                    
                    <div class="model-actions">
                        ${this.renderActions(i, status)}
                    </div>
                `;
                
                list.appendChild(item);
            }
        });
    }

    renderStatusIndicator(modelNum, status, progress) {
        if (status === 'downloading') {
            return `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="status-text">${progress}%</span>
            `;
        } else if (status === 'cached') {
            return `<span class="status-icon synced">✓ Synced</span>`;
        } else {
            return `<span class="status-icon not-cached">○ Offline</span>`;
        }
    }

    renderActions(modelNum, status) {
        if (status === 'downloading') {
            return `
                <button class="action-btn cancel" data-action="cancel" data-model="${modelNum}" title="Cancelar download">
                    <span class="icon">✕</span>
                </button>
            `;
        } else if (status === 'cached') {
            return `
                <button class="action-btn delete" data-action="delete" data-model="${modelNum}" title="Deletar do cache">
                    <span class="icon">🗑️</span>
                </button>
            `;
        } else {
            return `
                <button class="action-btn download" data-action="download" data-model="${modelNum}" title="Baixar modelo">
                    <span class="icon">⬇️</span>
                </button>
            `;
        }
    }

    async loadCharacterData() {
        try {
            const response = await fetch('/trail.json');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao carregar dados dos personagens:', error);
            return {};
        }
    }

    setupServiceWorkerListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { type, data } = event.data;
                
                switch (type) {
                    case 'CACHE_PROGRESS':
                        this.updateDownloadProgress(data.model, data.progress);
                        break;
                    case 'CACHE_COMPLETE':
                        this.markAsCached(data.model);
                        break;
                    case 'CACHE_ERROR':
                        this.markAsError(data.model);
                        break;
                    case 'MODELS_PREFETCH_SUMMARY':
                        this.handlePrefetchSummary(data);
                        break;
                }
            });
        }
        
        // Delegação de eventos para ações
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const model = parseInt(actionBtn.dataset.model);
                
                switch (action) {
                    case 'download':
                        this.downloadModel(model);
                        break;
                    case 'cancel':
                        this.cancelDownload(model);
                        break;
                    case 'delete':
                        this.deleteModel(model);
                        break;
                }
            }
        });
    }

    async cacheAllModels() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Enviar mensagem para o service worker
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_ALL_MODELS'
            });
            
            // Marcar todos como downloading
            for (let i = 1; i <= 56; i++) {
                if (!this.cacheStatus.has(i)) {
                    this.cacheStatus.set(i, 'downloading');
                    this.downloadQueue.set(i, 0);
                }
            }
            
            this.renderModelList();
        }
    }

    async downloadModel(modelNum) {
        try {
            this.cacheStatus.set(modelNum, 'downloading');
            this.downloadQueue.set(modelNum, 0);
            this.renderModelList();
            
            const controller = new AbortController();
            this.abortControllers.set(modelNum, controller);
            
            const url = `/models/modelo${modelNum}.glb`;
            const response = await fetch(url, { signal: controller.signal });
            
            if (!response.ok) throw new Error('Download falhou');
            
            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');
            
            let receivedLength = 0;
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                receivedLength += value.length;
                
                const progress = Math.round((receivedLength / contentLength) * 100);
                this.downloadQueue.set(modelNum, progress);
                this.updateModelProgress(modelNum, progress);
            }
            
            // Salvar no cache
            const blob = new Blob(chunks);
            const cache = await caches.open('techno-sutra-models-v1.0.2');
            await cache.put(url, new Response(blob));
            
            this.markAsCached(modelNum);
            this.abortControllers.delete(modelNum);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`Download cancelado: modelo ${modelNum}`);
                this.cacheStatus.delete(modelNum);
            } else {
                console.error(`Erro ao baixar modelo ${modelNum}:`, error);
                this.markAsError(modelNum);
            }
            this.downloadQueue.delete(modelNum);
            this.renderModelList();
        }
    }

    cancelDownload(modelNum) {
        const controller = this.abortControllers.get(modelNum);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(modelNum);
        }
        
        this.cacheStatus.delete(modelNum);
        this.downloadQueue.delete(modelNum);
        this.renderModelList();
    }

    async deleteModel(modelNum) {
        try {
            const cache = await caches.open('techno-sutra-models-v1.0.2');
            const url = `/models/modelo${modelNum}.glb`;
            await cache.delete(url);
            
            this.cacheStatus.delete(modelNum);
            this.updateSummary();
            this.renderModelList();
            
        } catch (error) {
            console.error(`Erro ao deletar modelo ${modelNum}:`, error);
        }
    }

    async deleteAllModels() {
        if (!confirm('Tem certeza que deseja deletar todos os modelos do cache?')) {
            return;
        }
        
        try {
            // Cancelar todos os downloads em andamento
            this.abortControllers.forEach(controller => controller.abort());
            this.abortControllers.clear();
            
            // Deletar cache
            await caches.delete('techno-sutra-models-v1.0.2');
            
            // Recriar cache vazio
            await caches.open('techno-sutra-models-v1.0.2');
            
            this.cacheStatus.clear();
            this.downloadQueue.clear();
            this.updateSummary();
            this.renderModelList();
            
        } catch (error) {
            console.error('Erro ao deletar todos os modelos:', error);
        }
    }

    updateDownloadProgress(modelNum, progress) {
        this.downloadQueue.set(modelNum, progress);
        this.updateModelProgress(modelNum, progress);
    }

    updateModelProgress(modelNum, progress) {
        const item = document.querySelector(`.cache-item[data-model="${modelNum}"]`);
        if (item) {
            const progressFill = item.querySelector('.progress-fill');
            const statusText = item.querySelector('.status-text');
            
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (statusText) statusText.textContent = `${progress}%`;
        }
    }

    markAsCached(modelNum) {
        this.cacheStatus.set(modelNum, 'cached');
        this.downloadQueue.delete(modelNum);
        this.updateSummary();
        
        const item = document.querySelector(`.cache-item[data-model="${modelNum}"]`);
        if (item) {
            item.className = 'cache-item cached';
            item.querySelector('.model-status').innerHTML = this.renderStatusIndicator(modelNum, 'cached', 0);
            item.querySelector('.model-actions').innerHTML = this.renderActions(modelNum, 'cached');
        }
    }

    markAsError(modelNum) {
        this.cacheStatus.delete(modelNum);
        this.downloadQueue.delete(modelNum);
        
        const item = document.querySelector(`.cache-item[data-model="${modelNum}"]`);
        if (item) {
            item.className = 'cache-item error';
            setTimeout(() => {
                item.className = 'cache-item not-cached';
                item.querySelector('.model-status').innerHTML = this.renderStatusIndicator(modelNum, 'not-cached', 0);
                item.querySelector('.model-actions').innerHTML = this.renderActions(modelNum, 'not-cached');
            }, 2000);
        }
    }

    handlePrefetchSummary(data) {
        const { cached, already, failed, total } = data;
        
        // Atualizar status de todos os modelos
        for (let i = 1; i <= 56; i++) {
            if (cached > 0 || already > 0) {
                this.cacheStatus.set(i, 'cached');
            }
        }
        
        this.updateSummary();
        this.renderModelList();
        
        // Mostrar notificação
        if (window.showNotification) {
            window.showNotification(
                '✅ Cache Completo',
                `${cached + already} modelos disponíveis offline. ${failed > 0 ? `${failed} falharam.` : ''}`,
                failed > 0 ? 'warning' : 'success',
                5000
            );
        }
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cacheManager = new CacheManager();
    });
} else {
    window.cacheManager = new CacheManager();
}
