import wixData from 'wix-data';

$w.onReady(function () {
    // Dev: console.log("Página carregada, aguardando mensagens...");
    
    // Função para aplicar filtros nos datasets
    function applyChapterFilter(chapterId) {
        try {
            // Dev: console.log(`Aplicando filtros para capítulo: ${chapterId}`);
            
            // Filtrar dataset5 (chapters) - usando chapter_number
            $w('#dataset5').setFilter(
                wixData.filter().eq('chapter_number', chapterId)
            ).then(() => {
                // Dev: console.log(`Dataset5 (chapters) filtrado para capítulo ${chapterId}`);
                
                // CORRIGIDO: Aguardar o filtro ser aplicado antes de atualizar
                return $w('#dataset5').refresh();
            }).then(() => {
                // Dev: console.log(`Dataset5 refreshed para capítulo ${chapterId}`);
            }).catch((error) => {
                // Dev: console.error("Erro ao filtrar dataset5:", error);
            });
            
            // Filtrar dataset6 (characters) - usando capitulo
            $w('#dataset6').setFilter(
                wixData.filter().eq('capitulo', chapterId)
            ).then(() => {
                // Dev: console.log(`Dataset6 (characters) filtrado para capítulo ${chapterId}`);
                
                // CORRIGIDO: Aguardar o filtro ser aplicado antes de atualizar
                return $w('#dataset6').refresh();
            }).then(() => {
                // Dev: console.log(`Dataset6 refreshed para capítulo ${chapterId}`);
            }).catch((error) => {
                // Dev: console.error("Erro ao filtrar dataset6:", error);
            });
            
            // Enviar mensagem para o iframe do modelo 3D (#html1) se existir
            if ($w('#html1')) {
                // CORRIGIDO: Adicionar delay para evitar conflitos de renderização
                setTimeout(() => {
                    $w('#html1').postMessage({
                        type: 'chapterUpdate',
                        chapterId: chapterId
                    });
                    // Dev: console.log(`Mensagem enviada para modelo 3D (html1) - capítulo ${chapterId}`);
                }, 100);
            }
            
        } catch (error) {
            // Dev: console.error("Erro geral ao aplicar filtros:", error);
        }
    }
    
    // CORRIGIDO: Usar debounce para evitar múltiplas atualizações simultâneas
    let updateTimeout;
    function debouncedApplyFilter(chapterId) {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            applyChapterFilter(chapterId);
        }, 150);
    }
    
    // Listener para mensagens do iframe navegador
    $w('#html2').onMessage((event) => {
        // Dev: console.log("Mensagem recebida do iframe navegador:", event);
        
        if (event.data && event.data.type === 'chapterUpdate') {
            const chapterId = event.data.chapterId;
            
            if (chapterId && typeof chapterId === 'number' && chapterId >= 1 && chapterId <= 56) {
                // Dev: console.log(`Processando atualização para capítulo: ${chapterId}`);
                // CORRIGIDO: Usar função debounced
                debouncedApplyFilter(chapterId);
            } else {
                // Dev: console.error("chapterId inválido ou ausente:", chapterId);
            }
        } else {
            // Dev: console.log("Mensagem recebida não é do tipo 'chapterUpdate'");
        }
    });
    
    // CORRIGIDO: Inicialização com delay para evitar conflitos de hydração
    setTimeout(() => {
        // Dev: console.log("Inicializando com capítulo 1...");
        applyChapterFilter(1);
    }, 500);
    
    // Dev: console.log("Setup completo - sistema pronto para receber mensagens");
});
