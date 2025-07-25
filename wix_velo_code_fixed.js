import wixData from 'wix-data';

$w.onReady(function () {
    // Dev: console.log("Página carregada - sistema aprimorado");
    
    let isUpdating = false;
    let currentChapterId = 1;
    let updateTimeout;
    
    // Função principal para atualizar dados do capítulo
    async function updateChapterData(chapterId) {
        // Evitar atualizações duplicadas
        if (isUpdating || chapterId === currentChapterId) {
            // Dev: console.log(`Ignorando atualização - isUpdating: ${isUpdating}, mesmo capítulo: ${chapterId === currentChapterId}`);
            return;
        }
        
        // Validação de entrada
        if (!chapterId || typeof chapterId !== 'number' || chapterId < 1 || chapterId > 56) {
            // Dev: console.error("ChapterId inválido:", chapterId);
            return;
        }
        
        isUpdating = true;
        currentChapterId = chapterId;
        
        try {
            // Dev: console.log(`🔄 Atualizando para capítulo: ${chapterId}`);
            
            // Aplicar filtros nos datasets usando setFilter (método correto para Wix)
            await Promise.all([
                updateDataset('#dataset5', 'chapter_number', chapterId, 'chapters'),
                updateDataset('#dataset6', 'capitulo', chapterId, 'characters')
            ]);
            
            // Comunicar com o modelo 3D (se existir)
            updateModel3D(chapterId);
            
            // Dev: console.log(`✅ Capítulo ${chapterId} atualizado com sucesso`);
            
        } catch (error) {
            // Dev: console.error("❌ Erro na atualização:", error);
        } finally {
            // Liberar flag após delay para evitar spam
            setTimeout(() => {
                isUpdating = false;
            }, 300);
        }
    }
    
    // Função helper para atualizar datasets individuais
    async function updateDataset(datasetId, fieldName, value, collectionName) {
        try {
            if (!$w(datasetId)) {
                // Dev: console.warn(`Dataset ${datasetId} não encontrado`);
                return;
            }
            
            // Dev: console.log(`Filtrando ${datasetId} (${collectionName}) por ${fieldName} = ${value}`);
            
            // Aplicar filtro
            await $w(datasetId).setFilter(
                wixData.filter().eq(fieldName, value)
            );
            
            // Forçar refresh do dataset
            await $w(datasetId).refresh();
            
            // Dev: console.log(`✅ ${datasetId} atualizado`);
            
        } catch (error) {
            // Dev: console.error(`❌ Erro ao atualizar ${datasetId}:`, error);
        }
    }
    
    // Função para atualizar modelo 3D
    function updateModel3D(chapterId) {
        try {
            if ($w('#html1')) {
                // Delay pequeno para evitar conflitos
                setTimeout(() => {
                    $w('#html1').postMessage({
                        type: 'chapterUpdate',
                        chapterId: chapterId
                    });
                    // Dev: console.log(`📤 Mensagem enviada para modelo 3D - capítulo ${chapterId}`);
                }, 100);
            }
        } catch (error) {
            // Dev: console.error("❌ Erro ao comunicar com modelo 3D:", error);
        }
    }
    
    // Função debounced para evitar múltiplas atualizações
    function debouncedUpdateChapter(chapterId) {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            updateChapterData(chapterId);
        }, 150);
    }
    
    // Listener principal para mensagens do iframe navegador
    $w('#html2').onMessage((event) => {
        // Dev: console.log("📨 Mensagem recebida do navegador:", event);
        
        try {
            if (event.data && event.data.type === 'chapterUpdate') {
                const chapterId = event.data.chapterId;
                
                if (chapterId && typeof chapterId === 'number' && chapterId >= 1 && chapterId <= 56) {
                    // Dev: console.log(`📖 Processando capítulo: ${chapterId}`);
                    debouncedUpdateChapter(chapterId);
                } else {
                    // Dev: console.warn("❌ ChapterId inválido recebido:", chapterId);
                }
            } else {
                // Dev: console.log("ℹ️ Mensagem não é de atualização de capítulo");
            }
        } catch (error) {
            // Dev: console.error("❌ Erro no listener:", error);
        }
    });
    
    // Inicialização robusta
    function initialize() {
        // Dev: console.log("🚀 Inicializando sistema com capítulo 1...");
        
        // Aguardar elementos carregarem completamente
        setTimeout(() => {
            updateChapterData(1);
        }, 1000);
    }
    
    // Verificar se a página está completamente carregada
    if (document.readyState === 'complete') {
        initialize();
    } else {
        // Aguardar carregamento completo
        setTimeout(initialize, 1500);
    }
    
    // Dev: console.log("🎯 Sistema de navegação de capítulos inicializado");
});
