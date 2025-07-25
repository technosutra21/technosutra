$w.onReady(function () {
    // Dev: console.log("Versão simples carregada");
    
    // REMOVER COMPLETAMENTE as atualizações de dataset
    // Manter apenas a comunicação com o modelo 3D
    
    $w('#html2').onMessage((event) => {
        if (event.data && event.data.type === 'chapterUpdate') {
            const chapterId = event.data.chapterId;
            // Dev: console.log(`Capítulo selecionado: ${chapterId}`);
            
            // APENAS atualizar o modelo 3D
            if ($w('#html1')) {
                $w('#html1').postMessage({
                    type: 'chapterUpdate',
                    chapterId: chapterId
                });
            }
        }
    });
});
