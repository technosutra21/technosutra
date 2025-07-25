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
            }).catch((error) => {
                // Dev: console.error("Erro ao filtrar dataset5:", error);
            });
            
            // Filtrar dataset6 (characters) - usando capitulo
            $w('#dataset6').setFilter(
                wixData.filter().eq('capitulo', chapterId)
            ).then(() => {
                // Dev: console.log(`Dataset6 (characters) filtrado para capítulo ${chapterId}`);
            }).catch((error) => {
                // Dev: console.error("Erro ao filtrar dataset6:", error);
            });
            
            // Enviar mensagem para o iframe do modelo 3D (#html1) se existir
            if ($w('#html1')) {
                $w('#html1').postMessage({
                    type: 'chapterUpdate',
                    chapterId: chapterId
                });
                // Dev: console.log(`Mensagem enviada para modelo 3D (html1) - capítulo ${chapterId}`);
            }
            
        } catch (error) {
            // Dev: console.error("Erro geral ao aplicar filtros:", error);
        }
    }
    
    // Listener para mensagens do iframe navegador
    $w('#html2').onMessage((event) => {
        // Dev: console.log("Mensagem recebida do iframe navegador:", event);
        
        if (event.data && event.data.type === 'chapterUpdate') {
            const chapterId = event.data.chapterId;
            
            if (chapterId && typeof chapterId === 'number') {
                // Dev: console.log(`Processando atualização para capítulo: ${chapterId}`);
                applyChapterFilter(chapterId);
            } else {
                // Dev: console.error("chapterId inválido ou ausente:", chapterId);
            }
        } else {
            // Dev: console.log("Mensagem recebida não é do tipo 'chapterUpdate'");
        }
    });
    
    // Inicialização - aplicar filtros para capítulo 1
    // Dev: console.log("Inicializando com capítulo 1...");
    applyChapterFilter(1);
    
    // Dev: console.log("Setup completo - sistema pronto para receber mensagens");
});
