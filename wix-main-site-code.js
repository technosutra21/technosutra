// Código para o site Wix PRINCIPAL (que vai conter o iframe)

$w.onReady(function () {
    // Dev: console.log("Site principal carregado");
    
    // ID do elemento HTML que contém o iframe wrapper
    const IFRAME_ELEMENT_ID = '#html3'; // Ajuste conforme necessário
    
    let currentChapter = 1;
    
    // Função para enviar comandos para o site dentro do iframe
    function sendMessageToEmbeddedSite(message) {
        try {
            if ($w(IFRAME_ELEMENT_ID)) {
                $w(IFRAME_ELEMENT_ID).postMessage(message);
                // Dev: console.log('Mensagem enviada para iframe:', message);
            }
        } catch (error) {
            // Dev: console.error('Erro ao enviar mensagem para iframe:', error);
        }
    }
    
    // Listener para mensagens vindas do iframe
    $w(IFRAME_ELEMENT_ID).onMessage((event) => {
        // Dev: console.log('Mensagem recebida do iframe:', event);
        
        // Processar mensagens do site embarcado
        if (event.data && event.data.type) {
            switch (event.data.type) {
                case 'chapterUpdate':
                    handleChapterUpdate(event.data);
                    break;
                case 'wrapperReady':
                    handleWrapperReady();
                    break;
                default:
                    // Dev: console.log('Tipo de mensagem não reconhecido:', event.data.type);
            }
        }
    });
    
    // Manipular atualizações de capítulo vindas do iframe
    function handleChapterUpdate(data) {
        if (data.chapterId && typeof data.chapterId === 'number') {
            currentChapter = data.chapterId;
            // Dev: console.log(`Capítulo atualizado no site principal: ${currentChapter}`);
            
            // Aqui você pode atualizar elementos do site principal
            // Por exemplo, atualizar um texto ou indicador
            if ($w('#chapterIndicator')) {
                $w('#chapterIndicator').text = `Capítulo ${currentChapter}`;
            }
            
            // Ou disparar outras ações necessárias no site principal
            onChapterChanged(currentChapter);
        }
    }
    
    // Quando o wrapper do iframe estiver pronto
    function handleWrapperReady() {
        // Dev: console.log('Wrapper do iframe está pronto');
        
        // Enviar configurações iniciais se necessário
        sendMessageToEmbeddedSite({
            type: 'initialize',
            config: {
                theme: 'default',
                language: 'pt-BR'
            }
        });
    }
    
    // Função customizada para quando o capítulo mudar
    function onChapterChanged(chapterId) {
        // Dev: console.log(`Processando mudança para capítulo ${chapterId} no site principal`);
        
        // Adicione aqui qualquer lógica específica do seu site principal
        // Por exemplo:
        
        // Atualizar URL sem recarregar a página
        if (history.replaceState) {
            const newUrl = `${window.location.pathname}?chapter=${chapterId}`;
            history.replaceState(null, '', newUrl);
        }
        
        // Disparar eventos personalizados se necessário
        const customEvent = new CustomEvent('chapterChanged', {
            detail: { chapterId: chapterId }
        });
        document.dispatchEvent(customEvent);
    }
    
    // Função pública para navegar para um capítulo específico (se necessário)
    // Pode ser chamada de outros lugares do site principal
    function navigateToChapter(chapterId) {
        if (chapterId >= 1 && chapterId <= 56) {
            sendMessageToEmbeddedSite({
                type: 'navigateToChapter',
                chapterId: chapterId
            });
        }
    }
    
    // Exportar função para uso global (opcional)
    if (typeof window !== 'undefined') {
        window.navigateToChapter = navigateToChapter;
    }
    
    // Verificar se há um capítulo na URL ao carregar
    const urlParams = new URLSearchParams(window.location.search);
    const initialChapter = urlParams.get('chapter');
    if (initialChapter) {
        const chapterNum = parseInt(initialChapter);
        if (chapterNum >= 1 && chapterNum <= 56) {
            setTimeout(() => {
                navigateToChapter(chapterNum);
            }, 1000);
        }
    }
    
    // Dev: console.log("Site principal configurado para comunicação com iframe");
});
