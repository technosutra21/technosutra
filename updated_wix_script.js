import wixData from 'wix-data';

$w.onReady(function () {
    console.log("Página carregada, aguardando mensagens...");
    
    $w('#html2').onMessage((event) => {
        console.log("Mensagem recebida:", event);
        
        if (event.data && event.data.type === 'chapterUpdate') {
            const chapterId = event.data.chapterId;
            console.log(`Tentando filtrar por capitulo: ${chapterId}`);
            
            // Filtrar dataset1 (techosutra)
            $w('#dataset1').setFilter(
                wixData.filter().eq('capitulo', chapterId)
            );
            
            // Filtrar dataset2 (quatro ângulos)
            $w('#dataset2').setFilter(
                wixData.filter().eq('capitulo', chapterId)
            );
            
            // Força refresh de ambos os datasets
            $w('#dataset1').refresh();
            $w('#dataset2').refresh();
            
            // Enviar mensagem para o iframe do modelo 3D (#html1)
            $w('#html1').postMessage({
                type: 'chapterUpdate',
                chapterId: chapterId
            });
            
            console.log(`Filtros aplicados em ambos os datasets e modelo 3D atualizado para capítulo ${chapterId}!`);
        }
    });
    
    // Inicializar ambos os datasets com capítulo 1
    $w('#dataset1').setFilter(
        wixData.filter().eq('capitulo', 1)
    );
    
    $w('#dataset2').setFilter(
        wixData.filter().eq('capitulo', 1)
    );
    
    // Inicializar o modelo 3D com capítulo 1
    $w('#html1').postMessage({
        type: 'chapterUpdate',
        chapterId: 1
    });
    
    console.log("Datasets e modelo 3D inicializados com capítulo 1");
});
