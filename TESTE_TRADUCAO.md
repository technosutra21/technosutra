# 🧪 Guia de Teste - Sistema de Tradução PT-BR/EN

## Como Testar as Correções

### 1️⃣ Preparação
```bash
# Certifique-se de que os arquivos foram atualizados:
# - js/utils.js
# - js/gallery.js  
# - galeria.html
```

### 2️⃣ Abrir a Galeria
1. Abra `galeria.html` no navegador
2. Aguarde o carregamento completo da página

### 3️⃣ Teste Básico de Tradução

#### **Estado Inicial (PT-BR):**
- [ ] Título: "Galeria de Modelos 3D"
- [ ] Subtítulo: "Explore os 56 capítulos do Avatamsaka Sutra..."
- [ ] Stats: "Deusas da Noite", "Monges", "Bodhisattvas", "Outros"
- [ ] Busca: "🔍 Buscar por nome ou descrição..."
- [ ] Botão voltar: "← Voltar"
- [ ] Cards: "Ver em AR", "Ver Mais", "Compartilhar"

#### **Clicar no botão 🌐 PT (trocar para EN):**
- [ ] Título muda para: "3D Models Gallery"
- [ ] Subtítulo muda para: "Explore the 56 chapters of the Avatamsaka Sutra..."
- [ ] Stats mudam para: "Night Goddesses", "Monks", "Bodhisattvas", "Others"
- [ ] Busca muda para: "🔍 Search by name or description..."
- [ ] Botão voltar muda para: "← Back"
- [ ] Cards mudam para: "View in AR", "View More", "Share"

#### **Clicar novamente (voltar para PT):**
- [ ] Todos os textos voltam para português

### 4️⃣ Teste de Tooltips

#### **Passar o mouse sobre os botões:**

**Em PT-BR:**
- [ ] Botão ↑ (scroll to top): "Voltar ao topo"
- [ ] Botão 🛞 (share): "Compartilhar"
- [ ] Botão 🌙 (theme): "Mudar para tema claro"
- [ ] Botão 🌐 (language): "Mudar idioma / Switch language"

**Em EN:**
- [ ] Botão ↑: "Back to top"
- [ ] Botão 🛞: "Share"
- [ ] Botão 🌙: "Switch to light theme"
- [ ] Botão 🌐: "Switch language / Mudar idioma"

### 5️⃣ Teste do Modal de Informações

1. **Clique em "Ver Mais" em qualquer card**

**Em PT-BR, verifique:**
- [ ] Título da seção: "🧘 Ensinamento Principal"
- [ ] Título da seção: "👤 Descrição do Personagem"
- [ ] Título da seção: "💫 Significado"
- [ ] Título da seção: "📍 Local"
- [ ] Título da seção: "📚 Resumo do Capítulo"
- [ ] Botão: "📱 Ver em AR"
- [ ] Botão: "🛞 Compartilhar"

2. **Feche o modal e mude para EN**
3. **Abra o modal novamente**

**Em EN, verifique:**
- [ ] Título da seção: "🧘 Main Teaching"
- [ ] Título da seção: "👤 Character Description"
- [ ] Título da seção: "💫 Meaning"
- [ ] Título da seção: "📍 Location"
- [ ] Título da seção: "📚 Chapter Summary"
- [ ] Botão: "📱 View in AR"
- [ ] Botão: "🛞 Share"

### 6️⃣ Teste de Compartilhamento

1. **Clique em "Compartilhar" em um card**

**Em PT-BR:**
- [ ] Se Web Share API disponível: título "Techno Sutra AR - Capítulo X"
- [ ] Se copiar para clipboard: mensagem "Link copiado para a área de transferência"

**Em EN:**
- [ ] Se Web Share API disponível: título "Techno Sutra AR - Chapter X"
- [ ] Se copiar para clipboard: mensagem "Link copied to clipboard"

### 7️⃣ Teste de Busca

1. **Digite algo no campo de busca**
2. **Mude o idioma**
3. **Verifique se o placeholder atualiza:**
   - PT: "🔍 Buscar por nome ou descrição..."
   - EN: "🔍 Search by name or description..."

### 8️⃣ Teste de Persistência

1. **Mude para EN**
2. **Recarregue a página (F5)**
3. **Verifique se permanece em EN**
4. **Mude para PT**
5. **Recarregue novamente**
6. **Verifique se permanece em PT**

---

## 🐛 Problemas Comuns e Soluções

### Problema: Alguns textos não traduzem
**Solução:** 
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Recarregue com cache limpo (Ctrl+F5)

### Problema: Idioma não persiste após reload
**Solução:**
- Verifique se localStorage está habilitado no navegador
- Abra DevTools > Application > Local Storage
- Procure por `technosutra-lang`

### Problema: Tooltips não aparecem
**Solução:**
- Verifique se o CSS está carregado corretamente
- Alguns navegadores podem bloquear tooltips customizados

### Problema: Modal não traduz
**Solução:**
- Feche e abra o modal novamente após mudar o idioma
- O modal é gerado dinamicamente e usa o idioma atual

---

## 📱 Teste em Dispositivos Móveis

1. **Abra em um smartphone**
2. **Teste todos os itens acima**
3. **Verifique especialmente:**
   - [ ] Navegação inferior traduz
   - [ ] Tooltips funcionam no touch
   - [ ] Modal é responsivo

---

## ✅ Checklist Final

- [ ] Todos os textos visíveis traduzem
- [ ] Tooltips traduzem
- [ ] Placeholders traduzem
- [ ] Modal traduz completamente
- [ ] Compartilhamento traduz
- [ ] Idioma persiste após reload
- [ ] Funciona em desktop
- [ ] Funciona em mobile
- [ ] Sem erros no console

---

## 🎯 Resultado Esperado

**100% dos textos da interface devem traduzir entre PT-BR e EN**, incluindo:
- Títulos e subtítulos
- Labels e estatísticas
- Botões e ações
- Tooltips e dicas
- Modais e popups
- Mensagens de feedback
- Placeholders de inputs

**Exceções (não traduzem por design):**
- Nomes próprios dos personagens (sânscrito)
- Conteúdo dos CSVs (vem de arquivos separados por idioma)
- Números e datas
