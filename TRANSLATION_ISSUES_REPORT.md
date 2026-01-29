# Relatório de Problemas de Tradução - galeria.html

## Resumo
O sistema de tradução EN/PT-BR não está funcionando completamente porque:
1. Muitos textos estão hardcoded sem `data-lang-key`
2. Traduções faltando no dicionário `translations` em utils.js
3. Conteúdo gerado dinamicamente em gallery.js não usa o sistema de tradução
4. Placeholders, tooltips e atributos não estão sendo traduzidos

---

## Problemas Identificados

### 1. galeria.html - Textos sem data-lang-key

**Linha ~1040-1060 - Gallery Stats:**
```html
<div class="stat-item">
    <span class="stat-number" id="filtered-models">9</span>
    <span class="stat-label">Deusas da Noite</span>  <!-- ❌ SEM data-lang-key -->
</div>
<div class="stat-item">
    <span class="stat-number" id="filtered-models">4</span>
    <span class="stat-label">Monges</span>  <!-- ❌ SEM data-lang-key -->
</div>
<div class="stat-item">
    <span class="stat-number" id="filtered-models">4</span>
    <span class="stat-label">Bodhisattvas</span>  <!-- ❌ SEM data-lang-key -->
</div>
<div class="stat-item">
    <span class="stat-number" id="filtered-models">+29</span>
    <span class="stat-label">Outros</span>  <!-- ❌ SEM data-lang-key -->
</div>
```

**Linha ~1000 - Quick Actions Tooltips:**
```html
<button class="quick-action-btn tooltip" data-tooltip="Voltar ao topo" onclick="scrollToTop()">
    <!-- ❌ data-tooltip não é traduzido -->
</button>
<button class="quick-action-btn tooltip" data-tooltip="Compartilhar" onclick="UIUtils.sharePage()">
    <!-- ❌ data-tooltip não é traduzido -->
</button>
```

**Linha ~950 - Desktop Back Button:**
```html
<a href="index.html" class="desktop-back-btn" data-lang-key="back">
    ← Voltar  <!-- ✅ TEM data-lang-key mas texto inicial está hardcoded -->
</a>
```

**Linha ~960 - Theme Toggle Tooltip:**
```html
<button class="theme-toggle tooltip" data-tooltip="Alternar tema claro/escuro" onclick="toggleTheme()">
    <!-- ❌ data-tooltip não é traduzido -->
</button>
```

**Linha ~965 - Language Toggle Tooltip:**
```html
<button class="theme-toggle language-toggle tooltip" data-tooltip="Switch language / Mudar idioma" onclick="toggleLanguage()">
    <!-- ❌ data-tooltip não é traduzido -->
</button>
```

---

### 2. js/gallery.js - Conteúdo Gerado Dinamicamente

**Linha ~60-80 - Método t() incompleto:**
```javascript
t(key) {
    const lang = this.getCurrentLang();
    const dict = {
        chapter: { pt: 'Capítulo', en: 'Chapter' },
        part: { pt: 'Parte', en: 'Part' },
        view_in_ar: { pt: 'Ver em AR', en: 'View in AR' },
        view_more: { pt: 'Ver Mais', en: 'View More' },
        share: { pt: 'Compartilhar', en: 'Share' },
        coming_soon: { pt: 'Em breve', en: 'Coming soon' },
        // ❌ FALTAM MUITAS TRADUÇÕES
    };
    return (dict[key] && dict[key][lang]) || (dict[key] && dict[key]['pt']) || key;
}
```

**Linha ~550-600 - renderGallery() com textos hardcoded:**
```javascript
modelCard.innerHTML = `
    <div class="model-header">
        <div class="model-number">${this.t('chapter')} ${model.id}</div>
        <h3 class="model-title">${model.title}</h3>
        <div class="model-subtitle">${model.subtitle}</div>
    </div>
    <!-- ... -->
    <div class="unavailable-overlay">
        <div class="unavailable-icon">🔒</div>
        <div class="unavailable-text">${this.t('coming_soon')}</div>
    </div>
    <!-- ... -->
    <button class="action-btn primary ar-button">
        <span>🥽</span>
        <span>${this.t('view_in_ar')}</span>  <!-- ✅ USA t() -->
    </button>
    <button class="action-btn info-btn">
        <span>⁜</span>
        <span>${this.t('view_more')}</span>  <!-- ✅ USA t() -->
    </button>
    <button class="action-btn">
        <span>🛞</span>
        <span>${this.t('share')}</span>  <!-- ✅ USA t() -->
    </button>
`;
```

**Linha ~1000-1400 - showModelInfo() com textos hardcoded:**
```javascript
function showModelInfo(modelId) {
    // ...
    modalContent.innerHTML = `
        <h2>
            <span>🧘</span> Ensinamento Principal  <!-- ❌ HARDCODED -->
        </h2>
        <!-- ... -->
        <h2>
            <span>👤</span> Descrição do Personagem  <!-- ❌ HARDCODED -->
        </h2>
        <!-- ... -->
        <h2>
            <span>💫</span> Significado  <!-- ❌ HARDCODED -->
        </h2>
        <!-- ... -->
        <h2>
            <span>📍</span> Local  <!-- ❌ HARDCODED -->
        </h2>
        <!-- ... -->
        <h2>
            <span>📚</span> Resumo do Capítulo  <!-- ❌ HARDCODED -->
        </h2>
        <!-- ... -->
        <button>
            <span>📱</span>
            <span>Ver em AR</span>  <!-- ❌ HARDCODED -->
        </button>
        <button>
            <span>🛞</span>
            <span>Compartilhar</span>  <!-- ❌ HARDCODED -->
        </button>
    `;
}
```

**Linha ~1100 - shareModel() com textos hardcoded:**
```javascript
function shareModel(modelId) {
    if (navigator.share) {
        navigator.share({
            title: `Techno Sutra AR - Capítulo ${modelId}`,  <!-- ❌ HARDCODED -->
            text: `Confira este modelo 3D do capítulo ${modelId} do Avatamsaka Sutra em realidade aumentada!`,  <!-- ❌ HARDCODED -->
            url: `${window.location.origin}/AR.html?model=${modelId}`
        })
    } else {
        // ...
        toast.textContent = 'Link copiado para a área de transferência';  <!-- ❌ HARDCODED -->
    }
}
```

---

### 3. js/utils.js - Traduções Faltando

**Linha ~120-170 - Dicionário translations incompleto:**
```javascript
const translations = {
    'home': { 'pt': 'Início', 'en': 'Home' },
    'gallery': { 'pt': 'Galeria', 'en': 'Gallery' },
    'map': { 'pt': 'Mapa', 'en': 'Map' },
    'search_placeholder': { 'pt': '🔍 Buscar por nome ou descrição...', 'en': '🔍 Search by name or description...' },
    'ar': { 'pt': 'Realidade Aumentada', 'en': 'Augmented Reality' },
    'back': { 'pt': '← Voltar', 'en': '← Back' },
    'view_in_ar': { 'pt': 'Ver em AR', 'en': 'View in AR' },
    'loading': { 'pt': 'Carregando...', 'en': 'Loading...' },
    'offline_mode': { 'pt': '⚫ MODO OFFLINE', 'en': '⚫ OFFLINE MODE' },
    'system_cached': { 'pt': '🟢 SISTEMA TOTALMENTE ARMAZENADO', 'en': '🟢 SYSTEM FULLY CACHED' }
    // ❌ FALTAM: gallery_title, gallery_subtitle, loading_gallery, stats labels, tooltips, etc.
};
```

---

## Traduções Necessárias (Faltando)

### Para utils.js:
- `gallery_title`
- `gallery_subtitle`
- `loading_gallery`
- `night_goddesses` (Deusas da Noite)
- `monks` (Monges)
- `bodhisattvas` (Bodhisattvas)
- `others` (Outros)
- `scroll_to_top` (Voltar ao topo)
- `share` (Compartilhar)
- `toggle_theme` (Alternar tema)
- `switch_language` (Mudar idioma)

### Para gallery.js método t():
- `main_teaching` (Ensinamento Principal)
- `character_description` (Descrição do Personagem)
- `meaning` (Significado)
- `location` (Local)
- `chapter_summary` (Resumo do Capítulo)
- `share_title` (título do compartilhamento)
- `share_text` (texto do compartilhamento)
- `link_copied` (Link copiado)

---

## Solução Recomendada

1. **Adicionar data-lang-key em todos os elementos HTML**
2. **Expandir o dicionário translations em utils.js**
3. **Expandir o método t() em gallery.js**
4. **Modificar funções que geram HTML dinamicamente para usar traduções**
5. **Implementar tradução de atributos (data-tooltip, placeholder)**
6. **Garantir que o evento 'language-changed' atualize todo o conteúdo**

---

## Prioridade de Correção

1. 🔴 **ALTA**: Textos visíveis na interface (stats, botões, títulos)
2. 🟡 **MÉDIA**: Tooltips e placeholders
3. 🟢 **BAIXA**: Mensagens de erro e toasts
