#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parser COMPLETO e SIMPLES que preserva TODA a informação
sem qualquer fragmentação ou perda de dados.
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any, Tuple

class PersonagemParserFinal:
    def __init__(self):
        # Títulos de seções conhecidos
        self.secoes_principais = [
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
    
    def parse_arquivo(self, caminho_arquivo: str) -> Dict[str, Any]:
        """Parse de arquivo específico preservando TODA a informação"""
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
        
        # Divide em seções de forma inteligente
        secoes = self.dividir_em_secoes_inteligente(conteudo)
        
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
                if 'PERFIL' in linha.upper() or (len(linha) > 10 and linha.isupper()):
                    return linha
        return "Título não identificado"
    
    def dividir_em_secoes_inteligente(self, texto: str) -> List[Dict[str, Any]]:
        """Divide o texto em seções de forma inteligente sem fragmentação"""
        linhas = texto.split('\n')
        secoes = []
        secao_atual = None
        
        for i, linha in enumerate(linhas):
            linha_limpa = linha.strip()
            
            # Verifica se é uma nova seção
            if self.eh_inicio_secao(linha_limpa, linhas, i):
                # Salva seção anterior se existir
                if secao_atual:
                    secao_atual['conteudo_completo'] = '\n'.join(secao_atual['conteudo_bruto'])
                    secao_atual['linha_fim'] = i
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
                secao_atual['conteudo_bruto'].append(linha)
        
        # Adiciona última seção
        if secao_atual:
            secao_atual['conteudo_completo'] = '\n'.join(secao_atual['conteudo_bruto'])
            secao_atual['linha_fim'] = len(linhas)
            secoes.append(secao_atual)
        
        return secoes
    
    def eh_inicio_secao(self, linha: str, todas_linhas: List[str], indice: int) -> bool:
        """Determina se uma linha é o início de uma nova seção"""
        if not linha:
            return False
        
        # Ignora linhas decorativas
        if re.match(r'^[=\-_]{3,}$', linha):
            return False
        
        # Verifica seções principais conhecidas
        for secao_nome in self.secoes_principais:
            if secao_nome in linha.upper():
                return True
        
        # Verifica se é um título seguido de linha de hífens
        if (indice + 1 < len(todas_linhas) and 
            re.match(r'^-{3,}$', todas_linhas[indice + 1].strip()) and
            linha.isupper() and len(linha) > 3):
            return True
        
        # Verifica títulos em maiúsculas específicos
        titulos_especiais = [
            'AJITASENA', 'NOME DO PERSONAGEM', 'APARÊNCIA VISUAL',
            'SIMBOLISMO', 'TESOURO', 'ANÁLISE', 'MÉTODOS'
        ]
        
        for titulo in titulos_especiais:
            if titulo in linha.upper():
                return True
        
        return False

def processar_todos_final():
    """Processa todos os arquivos .txt com correções finais"""
    parser = PersonagemParserFinal()
    pasta_atual = Path(__file__).parent
    pasta_resultados = pasta_atual / "resultados_parsing_final"
    pasta_resultados.mkdir(exist_ok=True)

    print(f"📁 Pasta atual: {pasta_atual}")
    print(f"💾 Resultados serão salvos em: {pasta_resultados}")
    print("🔄 MODO FINAL: Preservando TODA a informação sem fragmentação.")
    print("-" * 60)

    arquivos_txt = list(pasta_atual.glob("*.txt"))

    if not arquivos_txt:
        print("❌ Nenhum arquivo .txt encontrado na pasta atual!")
        return

    print(f"📋 Encontrados {len(arquivos_txt)} arquivo(s) .txt")
    print("-" * 60)

    for i, arquivo in enumerate(arquivos_txt, 1):
        print(f"🔄 [{i:2d}/{len(arquivos_txt)}] Processando: {arquivo.name}")

        try:
            resultado = parser.parse_arquivo(str(arquivo))
            resultado['arquivo_origem'] = arquivo.name
            resultado['caminho_completo'] = str(arquivo)
            resultado['indice_processamento'] = i

            nome_json = arquivo.stem + "_final.json"
            caminho_json = pasta_resultados / nome_json
            with open(caminho_json, 'w', encoding='utf-8') as f:
                json.dump(resultado, f, ensure_ascii=False, indent=2)

            print(f"   ✅ Salvo: {nome_json}")
            print(f"   📄 Título: {resultado.get('titulo_principal', '')[:50]}...")
            print(f"   📊 Seções: {len(resultado.get('secoes_organizadas', []))}")
            print(f"   📝 Caracteres: {resultado.get('metadados', {}).get('total_caracteres', 0)}")

        except Exception as e:
            print(f"   ❌ Erro: {str(e)}")

        print()

    print("=" * 60)
    print("✨ PROCESSAMENTO FINALIZADO!")
    print(f"📁 Pasta: {pasta_resultados.name}")
    print(f"📊 Total: {len(arquivos_txt)} arquivos")
    print("🔍 TODA informação original é preservada e o processamento está completo!")
    print("=" * 60)

if __name__ == "__main__":
    processar_todos_final()
