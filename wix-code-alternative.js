import wixData from 'wix-data';

$w.onReady(function () {
    // Dev: console.log("Página carregada - versão alternativa");
    
    let isUpdating = false;
    let currentChapterId = 1;
    
    // Função simplificada que evita conflitos de hydração
    async function updateChapterData(chapterId) {
        // Evitar múltiplas atualizações simultâneas
        if (isUpdating) {
            // Dev: console.log("Atualização em andamento, ignorando...");
            return;
        }
        
        if (chapterId === currentChapterId) {
            // Dev: console.log("Capítulo já é o atual, ignorando...");
            return;
        }
        
        isUpdating = true;
        currentChapterId = chapterId;
        
        try {
            // Dev: console.log(`Iniciando atualização para capítulo: ${chapterId}`);
            
            // Método alternativo: usar query direta em vez de setFilter
            const chaptersQuery = wixData.query('chapters')
                .eq('chapter_number', chapterId);
                
            const charactersQuery = wixData.query('characters')
                .eq('capitulo', chapterId);
            
            // Executar queries em paralelo
            const [chaptersResult, charactersResult] = await Promise.all([
                chaptersQuery.find(),
                charactersQuery.find()
            ]);
            
            // Dev: console.log(`Chapters encontrados: ${chaptersResult.items.length}`);
            // Dev: console.log(`Characters encontrados: ${charactersResult.items.length}`);
            
            // Atualizar datasets com os resultados, mas de forma mais segura
            if (chaptersResult.items.length > 0) {
                // Usar setTimeout para evitar conflitos de renderização
                setTimeout(() => {
                    try {
                        $w('#dataset5').setData(chaptersResult.items);
                        // Dev: console.log("Dataset5 atualizado com sucesso");
                    } catch (e) {
                        // Dev: console.error("Erro ao atualizar dataset5:", e);
                    }
                }, 50);
            }
            
            if (charactersResult.items.length > 0) {
                setTimeout(() => {
                    try {
                        $w('#dataset6').setData(charactersResult.items);
                        // Dev: console.log("Dataset6 atualizado com sucesso");
                    } catch (e) {
                        // Dev: console.error("Erro ao atualizar dataset6:", e);
                    }
                }, 100);
            }
            
            // Comunicar com o modelo 3D após um delay maior
            setTimeout(() => {
                if ($w('#html1')) {
                    try {
                        $w('#html1').postMessage({
                            type: 'chapterUpdate',
                            chapterId: chapterId
                        });
                        // Dev: console.log(`Mensagem enviada para modelo 3D - capítulo ${chapterId}`);
                    } catch (e) {
                        // Dev: console.error("Erro ao enviar mensagem para html1:", e);
                    }
                }
            }, 200);
            
        } catch (error) {
            // Dev: console.error("Erro na atualização de dados:", error);
        } finally {
            // Liberar o lock após um delay
            setTimeout(() => {
                isUpdating = false;
            }, 500);
        }
    }
    
    // Listener simplificado
    $w('#html2').onMessage((event) => {
        // Dev: console.log("Mensagem recebida:", event);
        
        try {
            if (event.data && 
                event.data.type === 'chapterUpdate' && 
                typeof event.data.chapterId === 'number' &&
                event.data.chapterId >= 1 && 
                event.data.chapterId <= 56) {
                
                const chapterId = event.data.chapterId;
                // Dev: console.log(`Processando capítulo: ${chapterId}`);
                
                // Usar requestAnimationFrame para melhor timing
                requestAnimationFrame(() => {
                    updateChapterData(chapterId);
                });
            }
        } catch (error) {
            // Dev: console.error("Erro no listener de mensagens:", error);
        }
    });
    
    // Inicialização mais segura
    setTimeout(() => {
        // Dev: console.log("Inicializando sistema...");
        updateChapterData(1);
    }, 1000); // Delay maior para evitar conflitos de hydração
    
    // Dev: console.log("Sistema alternativo inicializado");
});
