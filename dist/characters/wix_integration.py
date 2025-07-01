#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
INTEGRAÇÃO WIX CMS - Conversão de JSONs para formato CSV importável
Converte todos os personagens para um formato compatível com Wix
"""

import json
import csv
import os
import re
from pathlib import Path
from typing import Dict, List, Any

def extrair_nome_personagem(dados: Dict) -> str:
    """Extrai o nome principal do personagem"""
    # Primeiro tenta dos dados estruturados
    if 'dados_estruturados' in dados and 'informacoes_basicas' in dados['dados_estruturados']:
        nome_traducao = dados['dados_estruturados']['informacoes_basicas'].get('nome_e_traducao', '')
        if nome_traducao:
            # Extrai apenas o nome antes do hífen
            nome = nome_traducao.split(' - ')[0].split('(')[0].strip()
            return nome
    
    # Se não encontrar, tenta do título principal
    titulo = dados.get('titulo_principal', '')
    if 'PERFIL DE PERSONAGEM' in titulo:
        # Remove "PERFIL DE PERSONAGEM" e pega o que resta
        nome = titulo.replace('PERFIL DE PERSONAGEM', '').replace('-', '').replace('CAPÍTULO', '').strip()
        # Remove números de capítulo
        nome = re.sub(r'\d+', '', nome).strip()
        return nome if nome else 'Personagem Desconhecido'
    
    return 'Personagem Desconhecido'

def limpar_texto_para_wix(texto) -> str:
    """Limpa texto para formato compatível com Wix"""
    if not texto:
        return ''
    
    # Se for uma lista, converte para string
    if isinstance(texto, list):
        texto = ' '.join(str(item) for item in texto if item)
    
    # Converte para string se não for
    texto = str(texto)
    
    # Remove caracteres especiais problemáticos
    texto = texto.replace('\n', ' ').replace('\r', '')
    texto = texto.replace('"', "'").replace(';', ',')
    
    # Remove decorações
    texto = re.sub(r'[═=\-]{3,}', '', texto)
    texto = re.sub(r'\{.*?\}', '', texto)
    
    # Limpa espaços extras
    texto = ' '.join(texto.split())
    
    return texto.strip()

def extrair_categoria(dados: Dict) -> str:
    """Determina a categoria do personagem"""
    nome = extrair_nome_personagem(dados)
    
    # Busca por indicadores de categoria
    tipo = dados.get('dados_estruturados', {}).get('informacoes_basicas', {}).get('tipo', '').upper()
    
    if 'BODHISATTVA' in tipo:
        return 'Bodhisattva'
    elif 'REI' in nome.upper() or 'KING' in tipo:
        return 'Rei'
    elif 'BHIKṢUṆĪ' in nome or 'MONJA' in tipo:
        return 'Monja'
    elif 'CORTESÃ' in tipo or 'COURTESAN' in tipo:
        return 'Cortesã'
    elif 'CHEFE' in tipo or 'HOUSEHOLDER' in tipo:
        return 'Chefe de Família'
    elif 'UPĀSIKĀ' in nome:
        return 'Praticante Leiga'
    elif 'PERFUMEIRO' in nome:
        return 'Comerciante'
    else:
        return 'Mestre Espiritual'

def extrair_slug(nome: str) -> str:
    """Cria um slug único para URL"""
    slug = nome.lower()
    slug = re.sub(r'[^a-z0-9\s]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    return slug.strip('-')

def converter_para_csv_wix(pasta_jsons: str, arquivo_csv: str):
    """Converte todos os JSONs para um CSV compatível com Wix"""
    
    # Campos do CSV para Wix
    campos_csv = [
        'title',           # Nome do personagem
        'slug',            # URL slug
        'category',        # Categoria
        'chapter',         # Capítulo
        'description',     # Descrição curta
        'content',         # Conteúdo principal
        'location',        # Localização
        'type',           # Tipo
        'spiritual_characteristics', # Características espirituais
        'mystical_experience',      # Experiência mística
        'origin_story',            # História de origem
        'special_analysis',        # Análise especial
        'symbolism',               # Simbolismo
        'treasure',                # Tesouro
        'generative_description',  # Descrição generativa
        'physical_description',    # Descrição física
        'status',                  # Status
        'featured',               # Destacado (para controle)
        'date_created'            # Data de criação
    ]
    
    personagens = []
    pasta = Path(pasta_jsons)
    
    print("🔄 Convertendo JSONs para formato Wix CSV...")
    print(f"📁 Pasta: {pasta}")
    
    for arquivo_json in pasta.glob("*_otimizado.json"):
        print(f"   📋 Processando: {arquivo_json.name}")
        
        try:
            with open(arquivo_json, 'r', encoding='utf-8') as f:
                dados = json.load(f)
            
            nome = extrair_nome_personagem(dados)
            categoria = extrair_categoria(dados)
            slug = extrair_slug(nome)
            
            # Extrai número do capítulo
            titulo = dados.get('titulo_principal', '')
            capitulo = ''
            match = re.search(r'CAPÍTULO (\d+)', titulo)
            if match:
                capitulo = match.group(1)
            
            # Dados estruturados
            dados_est = dados.get('dados_estruturados', {})
            info_basicas = dados_est.get('informacoes_basicas', {})
            desc_fisica = dados_est.get('descricao_fisica', {})
            
            # Monta descrição física resumida
            fisica_resumo = []
            for key, value in desc_fisica.items():
                if value:
                    # Converte value para string se for lista
                    if isinstance(value, list):
                        value_str = ' '.join(str(item) for item in value if item)
                    else:
                        value_str = str(value)
                    
                    # Verifica se não é "não especificado"
                    if value_str and 'não especificad' not in value_str.lower():
                        fisica_resumo.append(f"{key.replace('_', ' ').title()}: {value_str}")
            
            personagem = {
                'title': nome,
                'slug': slug,
                'category': categoria,
                'chapter': capitulo,
                'description': limpar_texto_para_wix(info_basicas.get('nome_e_traducao', nome)[:200]),
                'content': limpar_texto_para_wix(dados.get('conteudo_completo', '')[:2000]),
                'location': limpar_texto_para_wix(info_basicas.get('localizacao', '')),
                'type': limpar_texto_para_wix(info_basicas.get('tipo', '')),
                'spiritual_characteristics': limpar_texto_para_wix(' '.join(dados_est.get('caracteristicas_espirituais', []))),
                'mystical_experience': limpar_texto_para_wix(dados_est.get('experiencia_mistica', '')),
                'origin_story': limpar_texto_para_wix(dados_est.get('historia_origem', '')),
                'special_analysis': limpar_texto_para_wix(dados_est.get('analise_especial', '')),
                'symbolism': limpar_texto_para_wix(dados_est.get('simbolismo', '')),
                'treasure': limpar_texto_para_wix(dados_est.get('tesouro', '')),
                'generative_description': limpar_texto_para_wix(dados_est.get('prompt_ia', '')),
                'physical_description': limpar_texto_para_wix('; '.join(fisica_resumo)),
                'status': limpar_texto_para_wix(info_basicas.get('status', '')),
                'featured': 'false',  # Padrão não destacado
                'date_created': '2025-01-26'  # Data atual
            }
            
            personagens.append(personagem)
            
        except Exception as e:
            print(f"   ❌ Erro ao processar {arquivo_json.name}: {e}")
    
    # Salva CSV
    print(f"\n💾 Salvando CSV: {arquivo_csv}")
    with open(arquivo_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=campos_csv)
        writer.writeheader()
        writer.writerows(personagens)
    
    print(f"✅ Conversão concluída! {len(personagens)} personagens exportados")
    return len(personagens)

def criar_estrutura_colecao_wix():
    """Cria a estrutura de coleção recomendada para o Wix"""
    estrutura = {
        "collection_name": "Personagens",
        "fields": [
            {"name": "title", "type": "text", "required": True, "description": "Nome do personagem"},
            {"name": "slug", "type": "text", "required": True, "description": "URL slug único"},
            {"name": "category", "type": "text", "required": False, "description": "Categoria do personagem"},
            {"name": "chapter", "type": "text", "required": False, "description": "Número do capítulo"},
            {"name": "description", "type": "text", "required": False, "description": "Descrição curta"},
            {"name": "content", "type": "richText", "required": False, "description": "Conteúdo principal"},
            {"name": "location", "type": "text", "required": False, "description": "Localização"},
            {"name": "type", "type": "text", "required": False, "description": "Tipo de personagem"},
            {"name": "spiritual_characteristics", "type": "richText", "required": False, "description": "Características espirituais"},
            {"name": "mystical_experience", "type": "richText", "required": False, "description": "Experiência mística"},
            {"name": "origin_story", "type": "richText", "required": False, "description": "História de origem"},
            {"name": "special_analysis", "type": "richText", "required": False, "description": "Análise especial"},
            {"name": "symbolism", "type": "richText", "required": False, "description": "Simbolismo"},
            {"name": "treasure", "type": "richText", "required": False, "description": "Tesouro espiritual"},
            {"name": "generative_description", "type": "richText", "required": False, "description": "Descrição para IA generativa"},
            {"name": "physical_description", "type": "text", "required": False, "description": "Descrição física"},
            {"name": "status", "type": "text", "required": False, "description": "Status atual"},
            {"name": "featured", "type": "boolean", "required": False, "description": "Personagem destacado"},
            {"name": "date_created", "type": "date", "required": False, "description": "Data de criação"}
        ]
    }
    
    with open('wix_collection_structure.json', 'w', encoding='utf-8') as f:
        json.dump(estrutura, f, ensure_ascii=False, indent=2)
    
    return estrutura

def main():
    """Função principal"""
    print("🚀 WIX CMS INTEGRATION - Conversão para CSV")
    print("=" * 60)
    
    # Pasta com os JSONs otimizados
    pasta_jsons = "resultados_otimizados"
    arquivo_csv = "personagens_wix.csv"
    
    if not Path(pasta_jsons).exists():
        print(f"❌ Pasta {pasta_jsons} não encontrada!")
        return
    
    # Cria estrutura de coleção
    print("📋 Criando estrutura de coleção Wix...")
    estrutura = criar_estrutura_colecao_wix()
    print("✅ Estrutura salva em: wix_collection_structure.json")
    
    # Converte para CSV
    total = converter_para_csv_wix(pasta_jsons, arquivo_csv)
    
    print("\n" + "=" * 60)
    print("✨ INTEGRAÇÃO WIX CONCLUÍDA!")
    print(f"📄 CSV gerado: {arquivo_csv}")
    print(f"📊 Total de personagens: {total}")
    print(f"📋 Estrutura da coleção: wix_collection_structure.json")
    print("\n🔗 PRÓXIMOS PASSOS:")
    print("1. Acesse seu painel Wix")
    print("2. Vá em Content Manager > Collections")
    print("3. Crie uma nova coleção chamada 'Personagens'")
    print("4. Configure os campos conforme wix_collection_structure.json")
    print("5. Importe o arquivo personagens_wix.csv")
    print("=" * 60)

if __name__ == "__main__":
    main()
