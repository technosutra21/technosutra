#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
INTEGRAÇÃO WIX API - Upload direto para o CMS via API
Script para integração automática com Wix usando a API REST
"""

import json
import requests
import os
from pathlib import Path
from typing import Dict, List, Any

class WixCMSIntegration:
    def __init__(self, api_key: str, site_id: str):
        """
        Inicializa a integração com Wix CMS
        
        Args:
            api_key: Chave da API do Wix
            site_id: ID do site Wix
        """
        self.api_key = api_key
        self.site_id = site_id
        self.base_url = f"https://www.wixapis.com/wix-data/v2/sites/{site_id}/collections"
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def criar_colecao_personagens(self):
        """Cria a coleção de personagens no Wix CMS"""
        collection_data = {
            "displayName": "Personagens",
            "key": "personagens",
            "permissions": {
                "insert": "ADMIN",
                "update": "ADMIN", 
                "remove": "ADMIN",
                "read": "ANYONE"
            },
            "fields": [
                {
                    "key": "title",
                    "displayName": "Nome",
                    "type": "text",
                    "required": True
                },
                {
                    "key": "slug", 
                    "displayName": "URL Slug",
                    "type": "text",
                    "required": True
                },
                {
                    "key": "category",
                    "displayName": "Categoria", 
                    "type": "text"
                },
                {
                    "key": "chapter",
                    "displayName": "Capítulo",
                    "type": "text"
                },
                {
                    "key": "description",
                    "displayName": "Descrição",
                    "type": "text"
                },
                {
                    "key": "content",
                    "displayName": "Conteúdo Principal",
                    "type": "richText"
                },
                {
                    "key": "location",
                    "displayName": "Localização",
                    "type": "text"
                },
                {
                    "key": "type",
                    "displayName": "Tipo",
                    "type": "text"
                },
                {
                    "key": "spiritualCharacteristics",
                    "displayName": "Características Espirituais",
                    "type": "richText"
                },
                {
                    "key": "mysticalExperience", 
                    "displayName": "Experiência Mística",
                    "type": "richText"
                },
                {
                    "key": "originStory",
                    "displayName": "História de Origem",
                    "type": "richText"
                },
                {
                    "key": "specialAnalysis",
                    "displayName": "Análise Especial", 
                    "type": "richText"
                },
                {
                    "key": "symbolism",
                    "displayName": "Simbolismo",
                    "type": "richText"
                },
                {
                    "key": "treasure",
                    "displayName": "Tesouro Espiritual",
                    "type": "richText"
                },
                {
                    "key": "generativeDescription",
                    "displayName": "Descrição Generativa",
                    "type": "richText"
                },
                {
                    "key": "physicalDescription",
                    "displayName": "Descrição Física",
                    "type": "text"
                },
                {
                    "key": "status",
                    "displayName": "Status",
                    "type": "text"
                },
                {
                    "key": "featured",
                    "displayName": "Destacado",
                    "type": "boolean"
                }
            ]
        }
        
        response = requests.post(
            f"{self.base_url}",
            headers=self.headers,
            json=collection_data
        )
        
        return response.json() if response.status_code == 200 else None
    
    def inserir_personagem(self, dados_personagem: Dict):
        """Insere um personagem na coleção"""
        item_data = {
            "item": {
                "data": dados_personagem
            }
        }
        
        response = requests.post(
            f"{self.base_url}/personagens/items",
            headers=self.headers,
            json=item_data
        )
        
        return response.status_code == 200
    
    def inserir_todos_personagens(self, pasta_jsons: str):
        """Insere todos os personagens da pasta de JSONs"""
        pasta = Path(pasta_jsons)
        sucessos = 0
        erros = 0
        
        print("🚀 Iniciando upload para Wix CMS via API...")
        
        for arquivo_json in pasta.glob("*_otimizado.json"):
            print(f"📤 Enviando: {arquivo_json.name}")
            
            try:
                with open(arquivo_json, 'r', encoding='utf-8') as f:
                    dados = json.load(f)
                
                # Converte dados para formato Wix
                personagem_wix = self.converter_para_formato_wix(dados)
                
                if self.inserir_personagem(personagem_wix):
                    print(f"   ✅ Sucesso")
                    sucessos += 1
                else:
                    print(f"   ❌ Erro no upload")
                    erros += 1
                    
            except Exception as e:
                print(f"   ❌ Erro: {e}")
                erros += 1
        
        print(f"\n📊 Resultados: {sucessos} sucessos, {erros} erros")
        return sucessos, erros
    
    def converter_para_formato_wix(self, dados: Dict) -> Dict:
        """Converte dados JSON para formato compatível com Wix"""
        dados_est = dados.get('dados_estruturados', {})
        info_basicas = dados_est.get('informacoes_basicas', {})
        
        nome = self.extrair_nome(dados)
        
        return {
            "title": nome,
            "slug": self.criar_slug(nome),
            "category": self.extrair_categoria(dados),
            "chapter": self.extrair_capitulo(dados.get('titulo_principal', '')),
            "description": info_basicas.get('nome_e_traducao', nome)[:200],
            "content": dados.get('conteudo_completo', ''),
            "location": info_basicas.get('localizacao', ''),
            "type": info_basicas.get('tipo', ''),
            "spiritualCharacteristics": ' '.join(dados_est.get('caracteristicas_espirituais', [])),
            "mysticalExperience": dados_est.get('experiencia_mistica', ''),
            "originStory": dados_est.get('historia_origem', ''),
            "specialAnalysis": dados_est.get('analise_especial', ''),
            "symbolism": dados_est.get('simbolismo', ''),
            "treasure": dados_est.get('tesouro', ''),
            "generativeDescription": dados_est.get('prompt_ia', ''),
            "physicalDescription": self.montar_descricao_fisica(dados_est.get('descricao_fisica', {})),
            "status": info_basicas.get('status', ''),
            "featured": False
        }
    
    def extrair_nome(self, dados: Dict) -> str:
        """Extrai nome do personagem"""
        if 'dados_estruturados' in dados:
            nome_traducao = dados['dados_estruturados'].get('informacoes_basicas', {}).get('nome_e_traducao', '')
            if nome_traducao:
                return nome_traducao.split(' - ')[0].split('(')[0].strip()
        return "Personagem"
    
    def criar_slug(self, nome: str) -> str:
        """Cria slug para URL"""
        import re
        slug = nome.lower()
        slug = re.sub(r'[^a-z0-9\s]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        return slug.strip('-')
    
    def extrair_categoria(self, dados: Dict) -> str:
        """Extrai categoria do personagem"""
        tipo = dados.get('dados_estruturados', {}).get('informacoes_basicas', {}).get('tipo', '').upper()
        
        if 'BODHISATTVA' in tipo:
            return 'Bodhisattva'
        elif 'REI' in tipo:
            return 'Rei' 
        elif 'CORTESÃ' in tipo:
            return 'Cortesã'
        elif 'CHEFE' in tipo or 'HOUSEHOLDER' in tipo:
            return 'Chefe de Família'
        else:
            return 'Mestre Espiritual'
    
    def extrair_capitulo(self, titulo: str) -> str:
        """Extrai número do capítulo"""
        import re
        match = re.search(r'CAPÍTULO (\d+)', titulo)
        return match.group(1) if match else ''
    
    def montar_descricao_fisica(self, desc_fisica: Dict) -> str:
        """Monta descrição física resumida"""
        resumo = []
        for key, value in desc_fisica.items():
            if value and 'não especificad' not in value.lower():
                resumo.append(f"{key.replace('_', ' ').title()}: {value}")
        return '; '.join(resumo)

def configurar_integracao_wix():
    """Configura a integração com Wix - REQUER CREDENCIAIS"""
    print("🔧 CONFIGURAÇÃO DA INTEGRAÇÃO WIX")
    print("=" * 50)
    print("Para usar a integração automática via API, você precisa:")
    print("1. Criar uma aplicação no Wix Dev Center")
    print("2. Obter as credenciais da API")
    print("3. Configurar as variáveis de ambiente")
    print()
    
    # Verifica se as credenciais estão configuradas
    api_key = os.getenv('WIX_API_KEY')
    site_id = os.getenv('WIX_SITE_ID')
    
    if not api_key or not site_id:
        print("❌ Credenciais não configuradas!")
        print("\nConfigure as variáveis de ambiente:")
        print("$env:WIX_API_KEY='sua_api_key_aqui'")
        print("$env:WIX_SITE_ID='seu_site_id_aqui'")
        return None
    
    return WixCMSIntegration(api_key, site_id)

def main():
    """Função principal"""
    print("🚀 WIX API INTEGRATION")
    print("=" * 60)
    
    # Tenta configurar integração
    wix = configurar_integracao_wix()
    
    if not wix:
        print("\n💡 ALTERNATIVA: Use o arquivo CSV gerado")
        print("Execute: python wix_integration.py")
        print("E importe manualmente no Wix Content Manager")
        return
    
    # Se chegou aqui, as credenciais estão configuradas
    print("✅ Credenciais configuradas!")
    
    # Pergunta se deve criar a coleção
    resposta = input("\n❓ Criar coleção 'Personagens' no Wix? (s/n): ")
    if resposta.lower() == 's':
        print("📋 Criando coleção...")
        resultado = wix.criar_colecao_personagens()
        if resultado:
            print("✅ Coleção criada com sucesso!")
        else:
            print("❌ Erro ao criar coleção")
            return
    
    # Pergunta se deve fazer upload dos dados
    resposta = input("❓ Fazer upload dos personagens? (s/n): ")
    if resposta.lower() == 's':
        pasta_jsons = "resultados_otimizados"
        if Path(pasta_jsons).exists():
            sucessos, erros = wix.inserir_todos_personagens(pasta_jsons)
            print(f"\n✨ Upload concluído! {sucessos} sucessos, {erros} erros")
        else:
            print("❌ Pasta de JSONs não encontrada!")

if __name__ == "__main__":
    main()
