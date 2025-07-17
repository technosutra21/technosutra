#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parser melhorado para perfis de personagens
Suporta múltiplos formatos e estruturas de dados
"""

import re
import json
from typing import Dict, List, Optional, Any

class PersonagemParser:
    def __init__(self):
        self.campos_comuns = [
            'NOME DO PERSONAGEM',
            'INFORMAÇÕES BÁSICAS', 
            'DESCRIÇÃO FÍSICA',
            'CARACTERÍSTICAS ESPIRITUAIS',
            'PROMPT PARA IA GENERATIVA'
        ]
        
        # Padrões para diferentes formatos de título
        self.padroes_titulo = [
            r'═+\s*PERFIL DE PERSONAGEM[^═]*═+',  # Formato com ═
            r'PERFIL DE PERSONAGEM\s*-\s*([^\n=]+)',  # Formato simples
            r'═+\s*([^═]+)\s*═+',  # Qualquer título entre ═
        ]
    
    def parse(self, conteudo: str) -> Dict[str, Any]:
        """Parse principal que detecta formato e extrai dados"""
        # Normaliza quebras de linha
        conteudo = conteudo.replace('\r\n', '\n').replace('\r', '\n')
        
        personagem = {
            'titulo_completo': self.extrair_titulo_completo(conteudo),
            'nome_completo': self.extrair_nome(conteudo),
            'informacoes': self.extrair_informacoes(conteudo),
            'descricao_fisica': self.extrair_descricao_fisica(conteudo),
            'caracteristicas_espirituais': self.extrair_caracteristicas(conteudo),
            'experiencia_mistica': self.extrair_experiencia_mistica(conteudo),
            'historia_origem': self.extrair_historia_origem(conteudo),
            'localizacao_contexto': self.extrair_localizacao_contexto(conteudo),
            'manifestacoes_cosmicas': self.extrair_manifestacoes_cosmicas(conteudo),
            'prompt_ia': self.extrair_prompt(conteudo),
            'campos_especificos': self.extrair_campos_especificos(conteudo)
        }

        return self.limpar_dados(personagem)

    def extrair_titulo_completo(self, texto: str) -> str:
        """Extrai o título completo do perfil"""
        for padrao in self.padroes_titulo:
            match = re.search(padrao, texto, re.IGNORECASE | re.MULTILINE)
            if match:
                if match.groups():
                    return match.group(1).strip()
                else:
                    return match.group(0).strip()
        return ''
    
    def extrair_nome(self, texto: str) -> str:
        """Múltiplos padrões para extrair nomes"""
        padroes = [
            r'NOME DO PERSONAGEM[:\s]*\n?([^\n═]+)',
            r'PERFIL DE PERSONAGEM[:\s]*-\s*([^\n═]+)',
            r'NOME DO PERSONAGEM[:\s]*([^\n]+)',
            r'^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s]{3,})$',  # Linha com só maiúsculas
            r'═+\s*([^═\n]+)\s*═+',  # Entre símbolos
        ]

        for padrao in padroes:
            match = re.search(padrao, texto, re.IGNORECASE | re.MULTILINE)
            if match:
                nome = match.group(1).strip()
                # Filtra nomes muito longos ou com palavras chave inválidas
                if (len(nome) < 100 and 
                    'CAPÍTULO' not in nome.upper() and
                    'PERFIL DE' not in nome.upper()):
                    return nome
        return 'Nome não encontrado'

    def extrair_informacoes(self, texto: str) -> Dict[str, str]:
        """Extrai informações básicas"""
        secao = self.extrair_secao(texto, 'INFORMAÇÕES BÁSICAS')
        if not secao:
            return {}

        return {
            'nome_traducao': self.extrair_linha(secao, r'Nome e Tradução:'),
            'tipo': self.extrair_linha(secao, r'Tipo:'),
            'localizacao': self.extrair_linha(secao, r'Localização:'),
            'status': self.extrair_linha(secao, r'Status:')
        }

    def extrair_descricao_fisica(self, texto: str) -> Dict[str, str]:
        """Extrai descrição física completa"""
        secao = self.extrair_secao(texto, 'DESCRIÇÃO FÍSICA')
        if not secao:
            return {}

        descricao = {
            'cor_corpo': self.extrair_linha(secao, r'Cor do Corpo:'),
            'cabelo': self.extrair_linha(secao, r'Cabelo:'),
            'olhos': self.extrair_linha(secao, r'Olhos:'),
            'beleza_geral': self.extrair_linha(secao, r'Beleza Geral:'),
            'adornos': self.extrair_linha(secao, r'Adornos:'),
            'vestimentas': self.extrair_linha(secao, r'Vestimentas:'),
            'aparencia_visual': self.extrair_aparencia_visual(secao)
        }
        
        return descricao
    
    def extrair_aparencia_visual(self, secao: str) -> List[str]:
        """Extrai lista de características da aparência visual"""
        # Procura por seção "Aparência Visual" ou lista com bullets
        aparencia_match = re.search(r'Aparência Visual[:\s]*\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)', secao, re.IGNORECASE)
        if aparencia_match:
            aparencia_texto = aparencia_match.group(1)
            return self.processar_lista(aparencia_texto)
        return []

    def extrair_caracteristicas(self, texto: str) -> List[str]:
        """Extrai características espirituais"""
        padroes = [
            'CARACTERÍSTICAS ESPIRITUAIS DISTINTIVAS',
            'CARACTERÍSTICAS ESPIRITUAIS',
            'PODERES ESPIRITUAIS'
        ]

        for padrao in padroes:
            secao = self.extrair_secao(texto, padrao)
            if secao:
                return self.processar_lista(secao)
        return []

    def extrair_experiencia_mistica(self, texto: str) -> str:
        """Extrai experiência mística central"""
        return self.extrair_secao(texto, 'EXPERIÊNCIA MÍSTICA CENTRAL') or ''
    
    def extrair_historia_origem(self, texto: str) -> str:
        """Extrai história de origem"""
        return self.extrair_secao(texto, 'HISTÓRIA DE ORIGEM') or ''
    
    def extrair_localizacao_contexto(self, texto: str) -> str:
        """Extrai localização e contexto"""
        padroes = ['LOCALIZAÇÃO E CONTEXTO', 'LOCALIZAÇÃO']
        for padrao in padroes:
            secao = self.extrair_secao(texto, padrao)
            if secao:
                return secao
        return ''
    
    def extrair_manifestacoes_cosmicas(self, texto: str) -> str:
        """Extrai manifestações cósmicas se existirem"""
        return self.extrair_secao(texto, 'MANIFESTAÇÕES CÓSMICAS') or ''
    
    def extrair_prompt(self, texto: str) -> str:
        """Extrai prompt para IA generativa com múltiplos padrões"""
        padroes = [
            r'PROMPT PARA IA GENERATIVA[^\n]*\n[=]+\n([\s\S]*?)(?=\n\n|$)',
            r'\{PROMPT PARA IA GENERATIVA[^}]*:\s*([^}]+)\}',
            r'PROMPT PARA IA GENERATIVA[^\n]*[:\n]([\s\S]*?)(?=\n\n|$)',
        ]

        for padrao in padroes:
            match = re.search(padrao, texto, re.IGNORECASE | re.MULTILINE)
            if match:
                prompt = match.group(1).strip()
                # Remove quebras de linha desnecessárias
                prompt = re.sub(r'\n+', ' ', prompt)
                return prompt
        return ''

    def extrair_campos_especificos(self, texto: str) -> Dict[str, str]:
        """Captura seções únicas que não são comuns"""
        campos = {}
        secoes = self.encontrar_todas_secoes(texto)
        
        # Lista expandida de campos comuns para filtrar
        campos_comuns_expandidos = self.campos_comuns + [
            'EXPERIÊNCIA MÍSTICA CENTRAL',
            'HISTÓRIA DE ORIGEM', 
            'LOCALIZAÇÃO E CONTEXTO',
            'MANIFESTAÇÕES CÓSMICAS',
            'ANÁLISE ESPECIAL',
            'CARACTERÍSTICAS ESPECIAIS',
            'MÉTODOS DE ENSINO',
        ]
        
        for secao in secoes:
            eh_comum = any(
                comum.upper() in secao['titulo'].upper() 
                for comum in campos_comuns_expandidos
            )
            if not eh_comum and secao['conteudo'].strip():
                # Limpa nome da seção para usar como chave
                chave = re.sub(r'[^a-zA-Z0-9\s]', '', secao['titulo']).strip().lower().replace(' ', '_')
                campos[chave] = secao['conteudo']

        return campos

    # Métodos auxiliares
    def extrair_secao(self, texto: str, titulo: str) -> Optional[str]:
        """Extrai seção específica do texto"""
        # Escapa caracteres especiais do regex
        titulo_escaped = re.escape(titulo)
        
        # Múltiplos padrões para diferentes formatos
        padroes = [
            # Título seguido de linha de hífens
            rf'{titulo_escaped}\s*\n-+\s*\n([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z]{{3,}}|$)',
            # Título seguido de conteúdo direto
            rf'{titulo_escaped}[\s]*\n([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z]{{3,}}|$)',
            # Título com dois pontos
            rf'{titulo_escaped}[:\s]*\n([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z]{{3,}}|$)',
        ]
        
        for padrao in padroes:
            match = re.search(padrao, texto, re.IGNORECASE | re.MULTILINE)
            if match:
                conteudo = match.group(1).strip()
                if conteudo:  # Só retorna se há conteúdo
                    return conteudo
        return None

    def extrair_linha(self, texto: str, campo: str) -> str:
        """Extrai linha específica com campo"""
        # Remove caracteres especiais do regex se necessário
        campo_escaped = re.escape(campo) if ':' in campo else campo
        
        padrao = rf'{campo_escaped}\s*([^\n]*)'
        match = re.search(padrao, texto, re.IGNORECASE)
        return match.group(1).strip() if match else ''

    def processar_lista(self, texto: str) -> List[str]:
        """Processa texto em lista, removendo bullets e numeração"""
        linhas = texto.split('\n')
        lista = []
        
        for linha in linhas:
            linha = linha.strip()
            if linha:
                # Remove bullets, numeração e hífens
                linha_limpa = re.sub(r'^[-•*\d+\.\)\s]+', '', linha).strip()
                if linha_limpa:
                    lista.append(linha_limpa)
        
        return lista

    def encontrar_todas_secoes(self, texto: str) -> List[Dict[str, str]]:
        """Encontra todas as seções do texto"""
        secoes = []
        linhas = texto.split('\n')
        secao_atual = None

        for linha in linhas:
            # Detecta títulos de seção
            if self.eh_titulo_secao(linha):
                if secao_atual:
                    # Finaliza seção anterior
                    secao_atual['conteudo'] = secao_atual['conteudo'].strip()
                    if secao_atual['conteudo']:  # Só adiciona se tem conteúdo
                        secoes.append(secao_atual)
                
                # Inicia nova seção
                secao_atual = {
                    'titulo': linha.strip(),
                    'conteudo': ''
                }
            elif secao_atual:
                secao_atual['conteudo'] += linha + '\n'

        # Adiciona última seção se existir
        if secao_atual:
            secao_atual['conteudo'] = secao_atual['conteudo'].strip()
            if secao_atual['conteudo']:
                secoes.append(secao_atual)

        return secoes

    def eh_titulo_secao(self, linha: str) -> bool:
        """Detecta se linha é título de seção"""
        linha = linha.strip()
        
        # Ignora linhas vazias
        if not linha:
            return False
            
        # Verifica se linha tem símbolos decorativos
        if re.match(r'^[═=\-_]{3,}', linha):
            return False
            
        # Detecta títulos em maiúsculas
        if (re.match(r'^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s]{3,}$', linha) and
            3 < len(linha) < 100 and
            not re.match(r'^\d+\|', linha)):  # Não é numeração de linha
            return True
            
        return False

    def limpar_dados(self, personagem: Dict[str, Any]) -> Dict[str, Any]:
        """Remove campos vazios e limpa dados"""
        dados_limpos = {}
        
        for chave, valor in personagem.items():
            if isinstance(valor, str):
                # Limpa espaços extras
                valor = re.sub(r'\s+', ' ', valor).strip()
                # Remove valores inválidos
                if valor and valor not in ['', 'Não especificado', 'Não especificado detalhadamente']:
                    dados_limpos[chave] = valor
            elif isinstance(valor, dict):
                # Limpa dicionários recursivamente
                valor_limpo = self.limpar_dados(valor)
                if valor_limpo:
                    dados_limpos[chave] = valor_limpo
            elif isinstance(valor, list):
                # Filtra listas vazias
                if valor:
                    dados_limpos[chave] = valor
            elif valor is not None:
                dados_limpos[chave] = valor
        
        return dados_limpos

    def to_json(self, personagem: Dict[str, Any], indent: int = 2) -> str:
        """Converte dados para JSON formatado"""
        return json.dumps(personagem, ensure_ascii=False, indent=indent)

    def parse_arquivo(self, caminho_arquivo: str) -> Dict[str, Any]:
        """Parse de arquivo específico"""
        try:
            with open(caminho_arquivo, 'r', encoding='utf-8') as f:
                conteudo = f.read()
            return self.parse(conteudo)
        except Exception as e:
            return {'erro': f'Erro ao ler arquivo: {str(e)}'}

# Função utilitária para uso direto
def parse_personagem(texto_ou_arquivo: str) -> Dict[str, Any]:
    """Função utilitária para parse rápido"""
    parser = PersonagemParser()
    
    # Verifica se é arquivo ou texto
    if len(texto_ou_arquivo) < 500 and ('.' in texto_ou_arquivo or '/' in texto_ou_arquivo or '\\' in texto_ou_arquivo):
        return parser.parse_arquivo(texto_ou_arquivo)
    else:
        return parser.parse(texto_ou_arquivo)

if __name__ == "__main__":
    # Teste básico
    parser = PersonagemParser()
    print("Parser de Personagens carregado com sucesso!")
    print("Use: parser.parse(texto) ou parse_personagem(arquivo)")
