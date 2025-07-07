#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parser OTIMIZADO - Limpo e bem organizado
Remove linhas em branco, linha_inicio e corrige fragmentação
"""

import json
from pathlib import Path
from typing import Dict, List, Any

def limpar_linhas(linhas: List[str]) -> List[str]:
    """Remove linhas em branco do início e fim, preserva as do meio"""
    # Remove linhas vazias do início
    while linhas and not linhas[0].strip():
        linhas.pop(0)
    
    # Remove linhas vazias do fim
    while linhas and not linhas[-1].strip():
        linhas.pop()
    
    return linhas

def extrair_secoes_otimizado(texto: str) -> List[Dict[str, Any]]:
    """Extrai seções de forma otimizada sem fragmentação"""
    linhas = texto.split('\n')
    secoes = []
    secao_atual = None
    
    # Seções principais conhecidas
    secoes_principais = [
        'NOME DO PERSONAGEM',
        'INFORMAÇÕES BÁSICAS', 
        'DESCRIÇÃO FÍSICA',
        'CARACTERÍSTICAS ESPIRITUAIS',
        'EXPERIÊNCIA MÍSTICA',
        'HISTÓRIA DE ORIGEM',
        'LOCALIZAÇÃO E CONTEXTO',
        'CARACTERÍSTICAS ESPECIAIS',
        'ANÁLISE ESPECIAL',
        'SIMBOLISMO',
        'TESOURO',
        'MÉTODOS DE ENSINO',
        'PROMPT PARA IA'
    ]
    
    for i, linha in enumerate(linhas):
        linha_limpa = linha.strip()
        
        # Verifica se é uma seção principal
        eh_secao_principal = any(secao in linha_limpa.upper() for secao in secoes_principais)
        
        # Ou se é seguida por linha de hífens (formato padrão)
        eh_titulo_com_hifens = (
            i + 1 < len(linhas) and 
            linhas[i + 1].strip().startswith('---') and 
            linha_limpa and 
            linha_limpa.isupper() and
            len(linha_limpa) > 3
        )
        
        if eh_secao_principal or eh_titulo_com_hifens:
            # Salva seção anterior se existir
            if secao_atual:
                secao_atual['linhas'] = limpar_linhas(secao_atual['linhas'])
                secao_atual['conteudo'] = '\n'.join(secao_atual['linhas'])
                if secao_atual['conteudo'].strip():  # Só adiciona se tem conteúdo
                    secoes.append(secao_atual)
            
            # Nova seção
            secao_atual = {
                'titulo': linha_limpa,
                'linhas': []
            }
        elif secao_atual:
            secao_atual['linhas'].append(linha)
    
    # Adiciona última seção
    if secao_atual:
        secao_atual['linhas'] = limpar_linhas(secao_atual['linhas'])
        secao_atual['conteudo'] = '\n'.join(secao_atual['linhas'])
        if secao_atual['conteudo'].strip():
            secoes.append(secao_atual)
    
    return secoes

def extrair_informacoes_estruturadas(secoes: List[Dict]) -> Dict[str, Any]:
    """Extrai informações específicas de forma estruturada"""
    dados = {}
    
    for secao in secoes:
        titulo = secao['titulo'].upper()
        conteudo = secao['conteudo']
        
        if 'INFORMAÇÕES BÁSICAS' in titulo:
            dados['informacoes_basicas'] = extrair_campos_basicos(conteudo)
        elif 'DESCRIÇÃO FÍSICA' in titulo:
            dados['descricao_fisica'] = extrair_descricao_fisica(conteudo)
        elif 'CARACTERÍSTICAS ESPIRITUAIS' in titulo:
            dados['caracteristicas_espirituais'] = conteudo.split('\n')
        elif 'EXPERIÊNCIA MÍSTICA' in titulo:
            dados['experiencia_mistica'] = conteudo
        elif 'HISTÓRIA DE ORIGEM' in titulo:
            dados['historia_origem'] = conteudo
        elif 'LOCALIZAÇÃO E CONTEXTO' in titulo:
            dados['localizacao_contexto'] = conteudo
        elif 'ANÁLISE ESPECIAL' in titulo:
            dados['analise_especial'] = conteudo
        elif 'SIMBOLISMO' in titulo:
            dados['simbolismo'] = conteudo
        elif 'TESOURO' in titulo:
            dados['tesouro'] = conteudo
        elif 'PROMPT PARA IA' in titulo:
            dados['prompt_ia'] = conteudo.replace('{', '').replace('}', '').strip()
    
    return dados

def extrair_campos_basicos(conteudo: str) -> Dict[str, str]:
    """Extrai campos básicos estruturados"""
    campos = {}
    linhas = conteudo.split('\n')
    
    for linha in linhas:
        if ':' in linha:
            chave, valor = linha.split(':', 1)
            chave_limpa = chave.strip().lower().replace(' ', '_').replace('ç', 'c').replace('ã', 'a')
            campos[chave_limpa] = valor.strip()
    
    return campos

def extrair_descricao_fisica(conteudo: str) -> Dict[str, Any]:
    """Extrai descrição física estruturada"""
    descricao = {}
    linhas = conteudo.split('\n')
    
    aparencia_visual = []
    outros_campos = {}
    
    capturando_aparencia = False
    
    for linha in linhas:
        linha = linha.strip()
        if 'Aparência Visual' in linha:
            capturando_aparencia = True
            continue
        
        if capturando_aparencia and linha.startswith('-'):
            aparencia_visual.append(linha)
        elif ':' in linha and not linha.startswith('-'):
            capturando_aparencia = False
            chave, valor = linha.split(':', 1)
            chave_limpa = chave.strip().lower().replace(' ', '_')
            outros_campos[chave_limpa] = valor.strip()
    
    if aparencia_visual:
        descricao['aparencia_visual'] = aparencia_visual
    
    descricao.update(outros_campos)
    return descricao

def parser_otimizado(arquivo_path: str) -> Dict[str, Any]:
    """Parser otimizado e limpo"""
    try:
        with open(arquivo_path, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        # Normaliza
        conteudo = conteudo.replace('\r\n', '\n').replace('\r', '\n')
        
        # Título principal
        linhas = conteudo.split('\n')
        titulo = "Título não identificado"
        for linha in linhas[:10]:
            linha = linha.strip()
            if linha and 'PERFIL' in linha.upper() and not linha.startswith('='):
                titulo = linha
                break
        
        # Extrai seções otimizadas
        secoes = extrair_secoes_otimizado(conteudo)
        
        # Extrai informações estruturadas
        dados_estruturados = extrair_informacoes_estruturadas(secoes)
        
        return {
            'titulo_principal': titulo,
            'conteudo_completo': conteudo,
            'dados_estruturados': dados_estruturados,
            'secoes_organizadas': secoes,
            'metadados': {
                'total_linhas': len(linhas),
                'total_caracteres': len(conteudo),
                'secoes_encontradas': len(secoes),
                'dados_estruturados_extraidos': len(dados_estruturados)
            }
        }
        
    except Exception as e:
        return {'erro': f'Erro: {str(e)}'}

def processar_todos_otimizado():
    """Processa todos os arquivos com o parser otimizado"""
    pasta_atual = Path(__file__).parent
    pasta_resultados = pasta_atual / "resultados_otimizados"
    pasta_resultados.mkdir(exist_ok=True)
    
    print("🚀 PARSER OTIMIZADO - Limpo e bem organizado")
    print(f"📁 Resultados em: {pasta_resultados}")
    print("✨ Removendo linhas em branco e organizando melhor")
    print("-" * 60)
    
    arquivos_txt = list(pasta_atual.glob("*.txt"))
    
    if not arquivos_txt:
        print("❌ Nenhum arquivo .txt encontrado!")
        return
    
    sucessos = 0
    
    for i, arquivo in enumerate(arquivos_txt, 1):
        print(f"🔄 [{i:2d}/{len(arquivos_txt)}] {arquivo.name}")
        
        resultado = parser_otimizado(str(arquivo))
        
        if 'erro' not in resultado:
            resultado['arquivo_origem'] = arquivo.name
            resultado['caminho_completo'] = str(arquivo)
            
            # Salva
            nome_json = arquivo.stem + "_otimizado.json"
            caminho_json = pasta_resultados / nome_json
            
            with open(caminho_json, 'w', encoding='utf-8') as f:
                json.dump(resultado, f, ensure_ascii=False, indent=2)
            
            print(f"   ✅ {nome_json}")
            print(f"   📊 Seções: {len(resultado.get('secoes_organizadas', []))}")
            print(f"   📋 Dados estruturados: {len(resultado.get('dados_estruturados', {}))}")
            sucessos += 1
        else:
            print(f"   ❌ Erro: {resultado['erro']}")
    
    print("\n" + "=" * 60)
    print("✨ PROCESSAMENTO OTIMIZADO CONCLUÍDO!")
    print(f"📁 Pasta: {pasta_resultados.name}")
    print(f"✅ Sucessos: {sucessos}/{len(arquivos_txt)}")
    print("🔍 Estrutura limpa e organizada!")
    print("=" * 60)

if __name__ == "__main__":
    processar_todos_otimizado()
