#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para limpar metadados e trocar texto dos JSONs existentes
"""

import json
import os
from pathlib import Path

def limpar_e_atualizar_json(arquivo_path: str):
    """Limpa metadados e atualiza textos do JSON"""
    try:
        with open(arquivo_path, 'r', encoding='utf-8') as f:
            dados = json.load(f)
        
        # Remove campos desnecessários
        campos_para_remover = ['metadados', 'arquivo_origem', 'caminho_completo']
        for campo in campos_para_remover:
            if campo in dados:
                del dados[campo]
        
        # Atualiza textos recursivamente
        def atualizar_textos(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if isinstance(value, str):
                        obj[key] = value.replace('PROMPT PARA IA GENERATIVA DE 3D CHARACTER', 'DESCRIÇÃO GENERATIVA')
                        obj[key] = obj[key].replace('{PROMPT PARA IA GENERATIVA DE 3D CHARACTER:', 'DESCRIÇÃO GENERATIVA:')
                    else:
                        atualizar_textos(value)
            elif isinstance(obj, list):
                for item in obj:
                    atualizar_textos(item)
        
        atualizar_textos(dados)
        
        # Salva o arquivo atualizado
        with open(arquivo_path, 'w', encoding='utf-8') as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
        
        return True
    except Exception as e:
        print(f"Erro ao processar {arquivo_path}: {e}")
        return False

def main():
    """Processa todos os JSONs otimizados"""
    pasta_otimizados = Path("resultados_otimizados")
    
    if not pasta_otimizados.exists():
        print("❌ Pasta resultados_otimizados não encontrada!")
        return
    
    print("🔧 LIMPANDO E ATUALIZANDO JSONs")
    print("📋 Removendo metadados, arquivo_origem, caminho_completo")
    print("✏️  Trocando 'PROMPT PARA IA' → 'DESCRIÇÃO GENERATIVA'")
    print("-" * 60)
    
    arquivos_json = list(pasta_otimizados.glob("*.json"))
    sucessos = 0
    
    for i, arquivo in enumerate(arquivos_json, 1):
        print(f"🔄 [{i:2d}/{len(arquivos_json)}] {arquivo.name}")
        
        if limpar_e_atualizar_json(str(arquivo)):
            print(f"   ✅ Limpo e atualizado")
            sucessos += 1
        else:
            print(f"   ❌ Erro ao processar")
    
    print("\n" + "=" * 60)
    print("✨ LIMPEZA E ATUALIZAÇÃO CONCLUÍDAS!")
    print(f"✅ Sucessos: {sucessos}/{len(arquivos_json)}")
    print("🔍 JSONs agora estão mais limpos e organizados!")
    print("=" * 60)

if __name__ == "__main__":
    main()
