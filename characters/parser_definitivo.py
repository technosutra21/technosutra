#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parser DEFINITIVO - Simples e eficaz
Preserva TODA a informação sem qualquer fragmentação
"""

import json
from pathlib import Path
from typing import Dict, List, Any

def extrair_secoes_simples(texto: str) -> List[Dict[str, Any]]:
    """Extrai seções de forma muito simples e direta"""
    linhas = texto.split('\n')
    secoes = []
    secao_atual = None
    
    # Seções principais conhecidas
    secoes_conhecidas = [
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
        
        # Verifica se é uma seção conhecida
        eh_secao = any(secao in linha_limpa.upper() for secao in secoes_conhecidas)
        
        # Ou se é seguida por linha de hífens
        if (i + 1 < len(linhas) and 
            linhas[i + 1].strip().startswith('---') and 
            linha_limpa and linha_limpa.isupper()):
            eh_secao = True
        
        if eh_secao:
            # Salva seção anterior
            if secao_atual:
                secao_atual['conteudo_completo'] = '\n'.join(secao_atual['linhas'])
                secoes.append(secao_atual)
            
            # Nova seção
            secao_atual = {
                'titulo': linha_limpa,
                'linhas': [],
                'linha_inicio': i + 1
            }
        elif secao_atual:
            secao_atual['linhas'].append(linha)
    
    # Adiciona última seção
    if secao_atual:
        secao_atual['conteudo_completo'] = '\n'.join(secao_atual['linhas'])
        secoes.append(secao_atual)
    
    return secoes

def parser_definitivo(arquivo_path: str) -> Dict[str, Any]:
    """Parser definitivo que funciona"""
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
        
        # Extrai seções
        secoes = extrair_secoes_simples(conteudo)
        
        return {
            'titulo_principal': titulo,
            'conteudo_completo': conteudo,
            'secoes_organizadas': secoes,
            'metadados': {
                'total_linhas': len(linhas),
                'total_caracteres': len(conteudo),
                'secoes_encontradas': len(secoes)
            }
        }
        
    except Exception as e:
        return {'erro': f'Erro: {str(e)}'}

def processar_todos_definitivo():
    """Processa todos os arquivos com o parser definitivo"""
    pasta_atual = Path(__file__).parent
    pasta_resultados = pasta_atual / "resultados_definitivos"
    pasta_resultados.mkdir(exist_ok=True)
    
    print("🚀 PARSER DEFINITIVO - Preservando TODA informação")
    print(f"📁 Resultados em: {pasta_resultados}")
    print("-" * 50)
    
    arquivos_txt = list(pasta_atual.glob("*.txt"))
    
    if not arquivos_txt:
        print("❌ Nenhum arquivo .txt encontrado!")
        return
    
    for i, arquivo in enumerate(arquivos_txt, 1):
        print(f"🔄 [{i:2d}/{len(arquivos_txt)}] {arquivo.name}")
        
        resultado = parser_definitivo(str(arquivo))
        resultado['arquivo_origem'] = arquivo.name
        resultado['caminho_completo'] = str(arquivo)
        
        # Salva
        nome_json = arquivo.stem + "_definitivo.json"
        caminho_json = pasta_resultados / nome_json
        
        with open(caminho_json, 'w', encoding='utf-8') as f:
            json.dump(resultado, f, ensure_ascii=False, indent=2)
        
        print(f"   ✅ {nome_json}")
        print(f"   📊 Seções: {len(resultado.get('secoes_organizadas', []))}")
    
    print("\n" + "=" * 50)
    print("✨ PROCESSAMENTO DEFINITIVO CONCLUÍDO!")
    print("🔍 Toda informação preservada sem fragmentação!")
    print("=" * 50)

if __name__ == "__main__":
    processar_todos_definitivo()
