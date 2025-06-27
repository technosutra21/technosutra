#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parser COMPLETO que preserva TODA a informação original
Apenas organiza em JSON sem resumir ou cortar nada
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any

class PersonagemParserCompleto:
    def __init__(self):
        pass
    
    def parse_arquivo(self, caminho_arquivo: str) -> Dict[str, Any]:
        """Parse de arquivo específico preservando TODA informação"""
        try:
            with open(caminho_arquivo, 'r', encoding='utf-8') as f:
                conteudo = f.read()
            return self.parse(conteudo)
        except Exception as e:
            return {'erro': f'Erro ao ler arquivo: {str(e)}'}
    
    def parse(self, conteudo: str) -> Dict[str, Any]:
        """Parse principal que preserva TODA a informação"""
        # Normaliza quebras de linha
        conteudo = conteudo.replace('\r\n', '\n').replace('\r', '\n')
        
        # Extrai título principal
        titulo = self.extrair_titulo_principal(conteudo)
        
        # Divide em seções preservando TODO o conteúdo
        secoes = self.dividir_em_secoes(conteudo)
        
        # Organiza dados preservando tudo
        personagem = {
            'titulo_principal': titulo,
            'conteudo_completo': conteudo,
            'secoes_organizadas': secoes,
            'metadados': {
                'total_linhas': len(conteudo.split('\n')),
                'total_caracteres': len(conteudo),
                'secoes_encontradas': len(secoes)
            }
        }
        
        return personagem
    
    def extrair_titulo_principal(self, texto: str) -> str:
        """Extrai o título principal do documento"""
        linhas = texto.split('\n')
        for linha in linhas[:10]:  # Busca nas primeiras 10 linhas
            linha = linha.strip()
            if linha and not linha.startswith('=') and not linha.startswith('-'):
                if 'PERFIL' in linha.upper() or len(linha) > 10:
                    return linha
        return "Título não identificado"
    
    def dividir_em_secoes(self, texto: str) -> List[Dict[str, Any]]:
        """Divide o texto em seções preservando TODO o conteúdo"""
        linhas = texto.split('\n')
        secoes = []
        secao_atual = None
        
        for i, linha in enumerate(linhas):
            linha_original = linha
            linha_limpa = linha.strip()
            
            # Detecta início de nova seção
            if self.eh_titulo_secao(linha_limpa):
                # Salva seção anterior se existir
                if secao_atual:
                    secoes.append(secao_atual)
                
                # Inicia nova seção
                secao_atual = {
                    'titulo': linha_limpa,
                    'linha_inicio': i + 1,
                    'conteudo_bruto': [],
                    'conteudo_completo': ''
                }
            elif secao_atual:
                # Adiciona linha à seção atual
                secao_atual['conteudo_bruto'].append(linha_original)
        
        # Adiciona última seção
        if secao_atual:
            secoes.append(secao_atual)
        
        # Processa conteúdo completo de cada seção
        for secao in secoes:
            secao['conteudo_completo'] = '\n'.join(secao['conteudo_bruto'])
            secao['linha_fim'] = secao['linha_inicio'] + len(secao['conteudo_bruto'])
            
            # Se a seção tem subsections, processa elas também
            if secao['conteudo_completo']:
                secao['subsecoes'] = self.extrair_subsecoes(secao['conteudo_completo'])
        
        return secoes
    
    def eh_titulo_secao(self, linha: str) -> bool:
        """Detecta se uma linha é título de seção"""
        if not linha:
            return False
        
        # Ignora linhas decorativas
        if re.match(r'^[═=\-_]{3,}$', linha):
            return False
        
        # Títulos principais
        titulos_principais = [
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
            'PROMPT PARA IA'
        ]
        
        for titulo in titulos_principais:
            if titulo in linha.upper():
                return True
        
        # Títulos em maiúsculas (mas não muito longos)
        if (re.match(r'^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s]{3,}$', linha) and 
            3 < len(linha) < 100 and
            'PERFIL' not in linha):
            return True
        
        return False
    
    def extrair_subsecoes(self, conteudo: str) -> List[Dict[str, str]]:
        """Extrai subseções dentro de uma seção maior"""
        subsecoes = []
        linhas = conteudo.split('\n')
        
        subsecao_atual = None
        
        for linha in linhas:
            linha_limpa = linha.strip()
            
            # Detecta subseções (linhas que terminam com :)
            if linha_limpa.endswith(':') and len(linha_limpa) > 3:
                if subsecao_atual:
                    subsecoes.append(subsecao_atual)
                
                subsecao_atual = {
                    'subtitulo': linha_limpa,
                    'conteudo': ''
                }
            elif subsecao_atual and linha_limpa:
                if subsecao_atual['conteudo']:
                    subsecao_atual['conteudo'] += '\n' + linha
                else:
                    subsecao_atual['conteudo'] = linha
        
        # Adiciona última subseção
        if subsecao_atual:
            subsecoes.append(subsecao_atual)
        
        return subsecoes

def processar_todos_completo():
    """Processa todos os arquivos .txt preservando TODA informação"""
    # Inicializa o parser
    parser = PersonagemParserCompleto()
    
    # Obtém a pasta atual do script
    pasta_atual = Path(__file__).parent
    
    # Cria subpasta para os resultados
    pasta_resultados = pasta_atual / "resultados_parsing_completo"
    pasta_resultados.mkdir(exist_ok=True)
    
    print(f"📁 Pasta atual: {pasta_atual}")
    print(f"💾 Resultados serão salvos em: {pasta_resultados}")
    print("🔄 MODO COMPLETO: Preservando TODA a informação original")
    print("-" * 60)
    
    # Busca todos os arquivos .txt na pasta atual
    arquivos_txt = list(pasta_atual.glob("*.txt"))
    
    if not arquivos_txt:
        print("❌ Nenhum arquivo .txt encontrado na pasta atual!")
        return
    
    print(f"📋 Encontrados {len(arquivos_txt)} arquivo(s) .txt")
    print("-" * 60)
    
    # Processa cada arquivo
    resultados_gerais = []
    
    for i, arquivo in enumerate(arquivos_txt, 1):
        print(f"🔄 [{i:2d}/{len(arquivos_txt)}] Processando: {arquivo.name}")
        
        try:
            # Faz o parsing do arquivo preservando TUDO
            resultado = parser.parse_arquivo(str(arquivo))
            
            # Adiciona metadados
            resultado['arquivo_origem'] = arquivo.name
            resultado['caminho_completo'] = str(arquivo)
            resultado['indice_processamento'] = i
            
            # Salva resultado individual em JSON
            nome_json = arquivo.stem + "_completo.json"
            caminho_json = pasta_resultados / nome_json
            
            with open(caminho_json, 'w', encoding='utf-8') as f:
                json.dump(resultado, f, ensure_ascii=False, indent=2)
            
            # Adiciona ao resultado geral
            resultados_gerais.append({
                'arquivo': arquivo.name,
                'titulo': resultado.get('titulo_principal', ''),
                'secoes': len(resultado.get('secoes_organizadas', [])),
                'tamanho': resultado.get('metadados', {}).get('total_caracteres', 0)
            })
            
            print(f"   ✅ Salvo: {nome_json}")
            print(f"   📄 Título: {resultado.get('titulo_principal', '')[:50]}...")
            print(f"   📊 Seções: {len(resultado.get('secoes_organizadas', []))}")
            print(f"   📝 Caracteres: {resultado.get('metadados', {}).get('total_caracteres', 0)}")
            
        except Exception as e:
            print(f"   ❌ Erro: {str(e)}")
            resultados_gerais.append({
                'arquivo': arquivo.name,
                'erro': str(e)
            })
        
        print()
    
    # Salva índice consolidado
    arquivo_indice = pasta_resultados / "indice_completo.json"
    with open(arquivo_indice, 'w', encoding='utf-8') as f:
        json.dump({
            'total_arquivos': len(arquivos_txt),
            'processados_com_sucesso': len([r for r in resultados_gerais if 'erro' not in r]),
            'pasta_origem': str(pasta_atual),
            'arquivos': resultados_gerais
        }, f, ensure_ascii=False, indent=2)
    
    print("=" * 60)
    print("✨ PROCESSAMENTO COMPLETO FINALIZADO!")
    print(f"📁 Pasta: {pasta_resultados.name}")
    print(f"📊 Total: {len(arquivos_txt)} arquivos")
    print(f"✅ Sucesso: {len([r for r in resultados_gerais if 'erro' not in r])}")
    print("🔍 TODA informação original foi preservada!")
    print("=" * 60)

if __name__ == "__main__":
    processar_todos_completo()
