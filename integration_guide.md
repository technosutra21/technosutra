# Integration Guide: Synced 3D Model with Chapter Navigation

## Overview
This integration synchronizes a 3D model viewer with chapter navigation, updating the model URL dynamically based on the current chapter number.

## Components

### 1. Updated 3D Model iframe (#html1)
- **File**: `updated_3d_model_iframe.html`
- **Purpose**: Displays 3D models and listens for chapter updates
- **Key Features**:
  - Listens for `postMessage` events from parent window
  - Updates model URL from `modelo1.glb` to `modelo{chapterNumber}.glb`
  - Maintains all original styling and responsiveness

### 2. Navigation iframe (#html2)
- **File**: Keep your existing navigation iframe unchanged
- **Purpose**: Provides chapter navigation buttons
- **Functionality**: Sends chapter updates to parent window

### 3. Updated Wix Script
- **File**: `updated_wix_script.js`
- **Purpose**: Coordinates all components
- **Key Features**:
  - Receives messages from navigation iframe (#html2)
  - Updates both datasets (dataset1 and dataset2)
  - Sends chapter updates to 3D model iframe (#html1)

## Implementation Steps

### Step 1: Update the 3D Model iframe
Replace the content of your #html1 iframe with the content from `updated_3d_model_iframe.html`:

```html
<iframe 
    srcdoc="<!DOCTYPE html>
<html>
<head>
    <meta charset=&quot;UTF-8&quot;>
    <meta name=&quot;viewport&quot; content=&quot;width=device-width, initial-scale=1.0&quot;>
    <script type=&quot;module&quot; src=&quot;https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js&quot;></script>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        html, body { 
            height: 100%; 
            width: 100%;
            overflow: hidden; 
            background: transparent; 
        }
        model-viewer { 
            width: 100%; 
            height: 100%; 
            min-height: 200px;
            background: transparent; 
            --poster-color: transparent; 
            display: block;
            position: relative;
        }
        model-viewer::part(default-progress-bar) { display: none; }
        model-viewer::part(default-progress-mask) { display: none; }
        
        @media (max-width: 768px) {
            model-viewer {
                min-height: 150px;
            }
        }
        
        @media (max-width: 480px) {
            model-viewer {
                min-height: 120px;
            }
        }
    </style>
</head>
<body>
    <model-viewer 
        id=&quot;modelViewer&quot;
        src=&quot;https://raw.githubusercontent.com/technosutra21/technosutra/master/modelo1.glb&quot;
        alt=&quot;Modelo 3D&quot;
        camera-controls
        shadow-intensity=&quot;0&quot;
        environment-image=&quot;neutral&quot;
        exposure=&quot;1&quot;
        shadow-softness=&quot;0&quot;
        tone-mapping=&quot;neutral&quot;
        loading=&quot;eager&quot;
        reveal=&quot;auto&quot;>
    </model-viewer>

    <script>
        const modelViewer = document.getElementById('modelViewer');
        
        function updateModel(chapterNumber) {
            const newSrc = `https://raw.githubusercontent.com/technosutra21/technosutra/master/modelo${chapterNumber}.glb`;
            console.log(`Atualizando modelo 3D para capítulo ${chapterNumber}: ${newSrc}`);
            modelViewer.src = newSrc;
        }
        
        window.addEventListener('message', (event) => {
            console.log('3D Model iframe recebeu mensagem:', event.data);
            
            if (event.data && event.data.type === 'chapterUpdate') {
                const chapterId = event.data.chapterId;
                updateModel(chapterId);
            }
        });
        
        updateModel(1);
    </script>
</body>
</html>" 
    style="width: 100%; height: 100%; min-height: 200px; border: none; display: block;"
    allowfullscreen>
</iframe>
```

### Step 2: Update the Wix Script
Replace your existing Wix script with the content from `updated_wix_script.js`:

```javascript
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
```

### Step 3: Keep Navigation iframe unchanged
Your existing navigation iframe (#html2) doesn't need any changes.

## How it works

1. **User clicks navigation button** in #html2 iframe
2. **Navigation iframe sends message** to parent Wix page with chapter ID
3. **Wix script receives message** and:
   - Updates dataset1 filter
   - Updates dataset2 filter
   - Refreshes both datasets
   - Sends chapter update to #html1 iframe
4. **3D model iframe receives message** and updates model URL from `modelo1.glb` to `modelo{chapterNumber}.glb`

## Expected Model URLs
- Chapter 1: `modelo1.glb`
- Chapter 2: `modelo2.glb`
- Chapter 3: `modelo3.glb`
- ...
- Chapter 56: `modelo56.glb`

## Troubleshooting

### Check Console Logs
All components include console.log statements for debugging:
- Wix script logs chapter updates and filter applications
- 3D model iframe logs when it receives messages and updates models

### Verify Model Files
Ensure all model files exist at:
`https://raw.githubusercontent.com/technosutra21/technosutra/master/modelo{1-56}.glb`

### Test Message Flow
1. Open browser developer tools
2. Navigate chapters using buttons
3. Check console for message flow between components
