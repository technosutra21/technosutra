# 🚀 GUIA COMPLETO DE INTEGRAÇÃO WIX API

## 📋 Visão Geral

Este guia fornece instruções completas para integrar seu projeto de personagens com o Wix CMS usando a API REST oficial. Você pode optar por:

1. **Integração Automática via API** - Upload direto via script Python
2. **Importação Manual** - Upload via CSV no Content Manager

## 🔧 OPÇÃO 1: INTEGRAÇÃO AUTOMÁTICA VIA API

### Pré-requisitos

1. **Conta Wix Business** (necessária para usar APIs)
2. **Site Wix publicado**
3. **Python 3.7+** instalado
4. **Biblioteca requests**: `pip install requests`

### Passo 1: Configurar Aplicação no Wix

1. **Acesse o Wix Dev Center**
   - Vá para: https://dev.wix.com/
   - Faça login com sua conta Wix

2. **Crie uma Nova Aplicação**
   ```
   - Clique em "Create New App"
   - Nome: "Technosutra Characters"
   - Tipo: "Server-side App"
   - Categoria: "Content Management"
   ```

3. **Configure Permissões**
   ```
   Vá em "OAuth" → "Permissions":
   ✅ Wix Data (Full Access)
   ✅ Site Content (Read & Write)
   ✅ CMS (Full Access)
   ```

4. **Obtenha Credenciais**
   ```
   Em "OAuth" → "App Keys":
   - App ID: [salve este valor]
   - App Secret: [salve este valor]
   ```

### Passo 2: Autorizar Aplicação

1. **Construa URL de Autorização**
   ```
   https://www.wix.com/oauth/authorize?client_id=SEU_APP_ID&response_type=code&scope=offline_access&redirect_uri=https://your-domain.com/callback
   ```

2. **Acesse a URL e autorize**
   - Use seu App ID na URL
   - Autorize a aplicação
   - Salve o código de autorização retornado

3. **Obtenha Access Token**
   ```bash
   curl -X POST https://www.wix.com/oauth/access \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "client_id": "SEU_APP_ID",
       "client_secret": "SEU_APP_SECRET",
       "code": "CODIGO_DE_AUTORIZACAO"
     }'
   ```

### Passo 3: Configurar Script Python

1. **Instale dependências**
   ```bash
   pip install requests
   ```

2. **Configure variáveis de ambiente**
   ```powershell
   # PowerShell
   $env:WIX_API_KEY="seu_access_token_aqui"
   $env:WIX_SITE_ID="seu_site_id_aqui"
   ```

   ```bash
   # Bash/Linux
   export WIX_API_KEY="seu_access_token_aqui"
   export WIX_SITE_ID="seu_site_id_aqui"
   ```

3. **Execute o script**
   ```bash
   python wix_api_integration.py
   ```

### Obter Site ID

Para encontrar seu Site ID:

1. **Via Wix Dashboard**
   - Vá para Settings → General Info
   - Site ID aparece no final da página

2. **Via API**
   ```bash
   curl -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
        https://www.wixapis.com/site-list/v2/sites
   ```

## 🔧 OPÇÃO 2: IMPORTAÇÃO MANUAL VIA CSV

Se a integração automática for complexa demais, use esta opção:

### Passo 1: Gerar CSV

Execute o script de conversão existente:
```bash
python wix_integration.py
```

Isso gera:
- `personagens_wix.csv` - Dados para importar
- `wix_collection_structure.json` - Estrutura da coleção

### Passo 2: Criar Coleção no Wix

1. **Acesse Content Manager**
   - Dashboard Wix → Content → Content Manager
   - Clique em "Create Collection"

2. **Configure a Coleção**
   ```
   Nome: Personagens
   Tipo: Custom Collection
   Permissões: Admin can add/edit, Site visitors can view
   ```

3. **Adicione Campos** (copie do arquivo JSON de estrutura):
   ```
   - title (Text, Required) - Nome
   - slug (Text, Required) - URL Slug  
   - category (Text) - Categoria
   - chapter (Text) - Capítulo
   - description (Text) - Descrição
   - content (Rich Text) - Conteúdo Principal
   - location (Text) - Localização
   - type (Text) - Tipo
   - spiritualCharacteristics (Rich Text) - Características Espirituais
   - mysticalExperience (Rich Text) - Experiência Mística
   - originStory (Rich Text) - História de Origem
   - specialAnalysis (Rich Text) - Análise Especial
   - symbolism (Rich Text) - Simbolismo
   - treasure (Rich Text) - Tesouro Espiritual
   - generativeDescription (Rich Text) - Descrição Generativa
   - physicalDescription (Text) - Descrição Física
   - status (Text) - Status
   - featured (Boolean) - Destacado
   ```

### Passo 3: Importar CSV

1. **Na coleção criada**
   - Clique em "Import" (ícone de upload)
   - Selecione `personagens_wix.csv`

2. **Mapear campos**
   - Wix detectará automaticamente os campos
   - Confirme o mapeamento
   - Clique em "Import"

3. **Verificar importação**
   - Revise os dados importados
   - Teste algumas páginas de personagens

## 🔍 ESTRUTURA DA API WIX

### Endpoints Principais

```http
# Criar coleção
POST https://www.wixapis.com/wix-data/v2/sites/{siteId}/collections

# Listar coleções  
GET https://www.wixapis.com/wix-data/v2/sites/{siteId}/collections

# Inserir item
POST https://www.wixapis.com/wix-data/v2/sites/{siteId}/collections/{collectionId}/items

# Atualizar item
PUT https://www.wixapis.com/wix-data/v2/sites/{siteId}/collections/{collectionId}/items/{itemId}

# Buscar itens
GET https://www.wixapis.com/wix-data/v2/sites/{siteId}/collections/{collectionId}/items
```

### Headers Necessários

```http
Authorization: Bearer {access_token}
Content-Type: application/json
wix-site-id: {site_id}
```

### Exemplo de Payload

```json
{
  "item": {
    "data": {
      "title": "Manjushri",
      "slug": "manjushri",
      "category": "Bodhisattva",
      "chapter": "1",
      "description": "Bodhisattva da Sabedoria...",
      "content": "Conteúdo completo...",
      "featured": false
    }
  }
}
```

## 🔐 SEGURANÇA E BOAS PRÁTICAS

### Autenticação

1. **Use HTTPS sempre**
2. **Armazene tokens de forma segura**
3. **Implemente refresh tokens**
4. **Configure rate limiting**

### Variáveis de Ambiente

```bash
# NUNCA commit estes valores!
WIX_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
WIX_SITE_ID=12345678-abcd-1234-efgh-123456789012
WIX_APP_ID=12345678-abcd-1234-efgh-123456789012
WIX_APP_SECRET=abcdef123456-7890-1234-5678-123456789012
```

### Rate Limits

```
- 500 requests/minute por app
- 100 requests/minute por site
- Burst limit: 10 requests/second
```

## 🚨 SOLUÇÃO DE PROBLEMAS

### Erro 401 - Unauthorized

```json
{
  "message": "Unauthorized",
  "details": {
    "applicationError": {
      "code": "UNAUTHORIZED"
    }
  }
}
```

**Soluções:**
1. Verifique se o access token está correto
2. Confirme se o token não expirou
3. Verifique as permissões da aplicação

### Erro 403 - Forbidden

```json
{
  "message": "Forbidden",
  "details": {
    "applicationError": {
      "code": "FORBIDDEN"
    }
  }
}
```

**Soluções:**
1. Verifique permissões da aplicação
2. Confirme se o site ID está correto
3. Verifique se a coleção existe

### Erro 429 - Rate Limit

```json
{
  "message": "Rate limit exceeded",
  "details": {
    "applicationError": {
      "code": "RATE_LIMIT_EXCEEDED"
    }
  }
}
```

**Soluções:**
1. Implemente delays entre requests
2. Use exponential backoff
3. Reduza frequência de requests

### Erro 422 - Validation Error

```json
{
  "message": "Validation error",
  "details": {
    "fieldViolations": [
      {
        "field": "title",
        "description": "Field is required"
      }
    ]
  }
}
```

**Soluções:**
1. Verifique campos obrigatórios
2. Valide formato dos dados
3. Verifique limites de caracteres

## 📊 MONITORAMENTO

### Logs da API

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fazer_request(url, data):
    try:
        response = requests.post(url, json=data, headers=headers)
        logger.info(f"Request para {url}: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Erro na request: {e}")
        raise
```

### Métricas

- Acompanhe taxa de sucesso/erro
- Monitore tempo de resposta
- Verifique rate limits restantes

## 🎯 PRÓXIMOS PASSOS

Após configurar a integração:

1. **Teste com dados pequenos primeiro**
2. **Configure backup automático**  
3. **Implemente sincronização bidirecional**
4. **Configure webhooks para mudanças**
5. **Adicione validação de dados**

## 📞 SUPORTE

- **Documentação Wix API**: https://dev.wix.com/api/rest/
- **Wix Developers Forum**: https://www.wix.com/corvid/forum
- **Status da API**: https://status.wix.com/

## 📝 CHECKLIST FINAL

### Antes de usar a API:
- [ ] Conta Wix Business ativa
- [ ] Site publicado
- [ ] Aplicação criada no Dev Center
- [ ] Permissões configuradas
- [ ] Access token obtido
- [ ] Site ID identificado
- [ ] Variáveis de ambiente configuradas

### Antes da importação:
- [ ] Dados JSON otimizados
- [ ] Script testado em ambiente local
- [ ] Backup dos dados originais
- [ ] Coleção criada (se manual)
- [ ] Rate limits compreendidos

### Após importação:
- [ ] Dados verificados no Wix
- [ ] URLs testadas
- [ ] Permissões conferidas
- [ ] Performance avaliada
- [ ] Backup realizado

---

**🎉 Sua integração com Wix está pronta!**

Use o script `wix_api_integration.py` para upload automático ou siga o processo manual com CSV. Ambas as opções são totalmente funcionais e atendem diferentes necessidades de complexidade e controle.
