# ⚡ Guia Rápido - Sistema de Tradução

## 🎯 Para Adicionar Nova Tradução

### 1. Texto Estático no HTML

```html
<!-- ANTES (não traduz) -->
<span>Meu Texto</span>

<!-- DEPOIS (traduz) -->
<span data-lang-key="my_text">Meu Texto</span>
```

Depois adicione em `js/utils.js`:
```javascript
const translations = {
    'my_text': {
        'pt': 'Meu Texto',
        'en': 'My Text'
    }
};
```

### 2. Tooltip

```html
<!-- ANTES (não traduz) -->
<button data-tooltip="Minha Dica">Botão</button>

<!-- DEPOIS (traduz) -->
<button data-tooltip-key="my_tooltip" data-tooltip="Minha Dica">Botão</button>
```

Depois adicione em `js/utils.js`:
```javascript
const translations = {
    'my_tooltip': {
        'pt': 'Minha Dica',
        'en': 'My Tooltip'
    }
};
```

### 3. Placeholder de Input

```html
<!-- ANTES (não traduz) -->
<input placeholder="Digite aqui...">

<!-- DEPOIS (traduz) -->
<input data-lang-key="my_placeholder" placeholder="Digite aqui...">
```

Depois adicione em `js/utils.js`:
```javascript
const translations = {
    'my_placeholder': {
        'pt': 'Digite aqui...',
        'en': 'Type here...'
    }
};
```

### 4. Texto Dinâmico em JavaScript

Em `js/gallery.js`, adicione no método `t()`:
```javascript
t(key) {
    const lang = this.getCurrentLang();
    const dict = {
        // ... traduções existentes ...
        my_dynamic_text: { 
            pt: 'Meu Texto Dinâmico', 
            en: 'My Dynamic Text' 
        }
    };
    return (dict[key] && dict[key][lang]) || key;
}
```

Depois use no código:
```javascript
const text = this.t('my_dynamic_text');
element.textContent = text;
```

---

## 📚 Dicionários de Tradução

### utils.js (Textos Globais)
```javascript
const translations = {
    'home': { 'pt': 'Início', 'en': 'Home' },
    'gallery': { 'pt': 'Galeria', 'en': 'Gallery' },
    // ... adicione aqui traduções globais
};
```

### gallery.js método t() (Textos da Galeria)
```javascript
t(key) {
    const dict = {
        chapter: { pt: 'Capítulo', en: 'Chapter' },
        view_in_ar: { pt: 'Ver em AR', en: 'View in AR' },
        // ... adicione aqui traduções específicas da galeria
    };
}
```

---

## 🔧 Funções Úteis

### Obter Idioma Atual
```javascript
const currentLang = localStorage.getItem('technosutra-lang') || 'pt';
```

### Mudar Idioma Programaticamente
```javascript
LanguageManager.setLanguage('en'); // ou 'pt'
```

### Escutar Mudanças de Idioma
```javascript
window.addEventListener('language-changed', (e) => {
    const newLang = e.detail.lang;
    console.log('Idioma mudou para:', newLang);
    // Faça algo quando o idioma mudar
});
```

### Traduzir Elemento Manualmente
```javascript
const element = document.getElementById('myElement');
const key = 'my_translation_key';
const lang = localStorage.getItem('technosutra-lang') || 'pt';

if (translations[key] && translations[key][lang]) {
    element.textContent = translations[key][lang];
}
```

---

## 🎨 Padrões de Código

### HTML com Tradução
```html
<!-- Texto simples -->
<h1 data-lang-key="title">Título</h1>

<!-- Tooltip -->
<button data-tooltip-key="save_tooltip" data-tooltip="Salvar">💾</button>

<!-- Placeholder -->
<input data-lang-key="search" placeholder="Buscar...">

<!-- Múltiplos atributos -->
<button 
    data-lang-key="submit_button"
    data-tooltip-key="submit_tooltip"
    data-tooltip="Enviar formulário">
    Enviar
</button>
```

### JavaScript com Tradução
```javascript
// Usando método t() do GalleryController
const text = this.t('my_key');

// Gerando HTML com tradução
const html = `
    <h2>${this.t('title')}</h2>
    <p>${this.t('description')}</p>
    <button>${this.t('action')}</button>
`;

// Atualizando elemento existente
element.textContent = this.t('new_text');
```

---

## 🐛 Troubleshooting

### Texto não traduz?

1. **Verifique se tem `data-lang-key`**
   ```html
   <!-- ❌ Errado -->
   <span>Texto</span>
   
   <!-- ✅ Correto -->
   <span data-lang-key="text">Texto</span>
   ```

2. **Verifique se a tradução existe**
   ```javascript
   // Abra DevTools Console e digite:
   console.log(translations['sua_chave']);
   // Deve retornar: { pt: '...', en: '...' }
   ```

3. **Limpe o cache**
   ```
   Ctrl+Shift+Delete → Limpar cache
   Ctrl+F5 → Recarregar sem cache
   ```

### Tooltip não traduz?

1. **Use `data-tooltip-key` em vez de só `data-tooltip`**
   ```html
   <!-- ❌ Errado -->
   <button data-tooltip="Dica">Botão</button>
   
   <!-- ✅ Correto -->
   <button data-tooltip-key="tip" data-tooltip="Dica">Botão</button>
   ```

2. **Adicione tradução em utils.js**
   ```javascript
   'tip': { 'pt': 'Dica', 'en': 'Tip' }
   ```

### Conteúdo dinâmico não traduz?

1. **Use método `t()` do GalleryController**
   ```javascript
   // ❌ Errado
   element.textContent = 'Texto fixo';
   
   // ✅ Correto
   element.textContent = this.t('text_key');
   ```

2. **Adicione tradução no método `t()`**
   ```javascript
   t(key) {
       const dict = {
           text_key: { pt: 'Texto', en: 'Text' }
       };
   }
   ```

---

## 📋 Checklist para Nova Tradução

- [ ] Adicionei `data-lang-key` no HTML (se aplicável)
- [ ] Adicionei `data-tooltip-key` no HTML (se tooltip)
- [ ] Adicionei tradução em `utils.js` (se global)
- [ ] Adicionei tradução em `gallery.js` método `t()` (se específico)
- [ ] Testei em PT-BR
- [ ] Testei em EN
- [ ] Verifiquei que persiste após reload
- [ ] Sem erros no console

---

## 🎯 Exemplos Rápidos

### Adicionar novo botão traduzível
```html
<!-- HTML -->
<button data-lang-key="new_button" data-tooltip-key="new_button_tip" data-tooltip="Dica">
    Novo Botão
</button>
```

```javascript
// utils.js
const translations = {
    'new_button': { 'pt': 'Novo Botão', 'en': 'New Button' },
    'new_button_tip': { 'pt': 'Dica do botão', 'en': 'Button tip' }
};
```

### Adicionar nova seção no modal
```javascript
// gallery.js - dentro de showModelInfo()
modalContent.innerHTML = `
    <h2>${t('new_section_title')}</h2>
    <p>${t('new_section_content')}</p>
`;

// Adicionar no método t()
t(key) {
    const dict = {
        new_section_title: { pt: 'Nova Seção', en: 'New Section' },
        new_section_content: { pt: 'Conteúdo', en: 'Content' }
    };
}
```

---

## 🚀 Dicas de Performance

1. **Evite traduzir em loops**
   ```javascript
   // ❌ Ruim
   items.forEach(item => {
       item.text = this.t('label'); // Traduz N vezes
   });
   
   // ✅ Bom
   const label = this.t('label'); // Traduz 1 vez
   items.forEach(item => {
       item.text = label;
   });
   ```

2. **Cache traduções usadas frequentemente**
   ```javascript
   const translations = {
       chapter: this.t('chapter'),
       view: this.t('view_in_ar'),
       share: this.t('share')
   };
   ```

3. **Use `data-lang-key` para conteúdo estático**
   - Mais performático que JavaScript
   - Atualiza automaticamente

---

## 📖 Referências

- **Arquivo principal**: `js/utils.js` (traduções globais)
- **Arquivo galeria**: `js/gallery.js` (traduções específicas)
- **Documentação completa**: `TRANSLATION_FIXES_SUMMARY.md`
- **Guia de teste**: `TESTE_TRADUCAO.md`
- **Exemplos visuais**: `EXEMPLOS_TRADUCAO.md`
