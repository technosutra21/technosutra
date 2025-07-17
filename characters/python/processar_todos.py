#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para processar todos os arquivos .txt da pasta atual
e salvar os resultados em uma subpasta nova
"""

import os
import glob
import json
from pathlib import Path
from parse import PersonagemParser

def main():
    # Inicializa o parser
    parser = PersonagemParser()
    
    # Obtém a pasta atual do script
    pasta_atual = Path(__file__).parent
    
    # Cria subpasta para os resultados
    pasta_resultados = pasta_atual / "resultados_parsing"
    pasta_resultados.mkdir(exist_ok=True)
    
    print(f"📁 Pasta atual: {pasta_atual}")
    print(f"💾 Resultados serão salvos em: {pasta_resultados}")
    print("-" * 50)
    
    # Busca todos os arquivos .txt na pasta atual
    arquivos_txt = list(pasta_atual.glob("*.txt"))
    
    if not arquivos_txt:
        print("❌ Nenhum arquivo .txt encontrado na pasta atual!")
        return
    
    print(f"📋 Encontrados {len(arquivos_txt)} arquivo(s) .txt:")
    for arquivo in arquivos_txt:
        print(f"   • {arquivo.name}")
    print("-" * 50)
    
    # Processa cada arquivo
    resultados_gerais = []
    
    for arquivo in arquivos_txt:
        print(f"🔄 Processando: {arquivo.name}")
        
        try:
            # Faz o parsing do arquivo
            resultado = parser.parse_arquivo(str(arquivo))
            
            # Adiciona metadados
            resultado['arquivo_origem'] = arquivo.name
            resultado['caminho_completo'] = str(arquivo)
            
            # Salva resultado individual em JSON
            nome_json = arquivo.stem + "_parsed.json"
            caminho_json = pasta_resultados / nome_json
            
            with open(caminho_json, 'w', encoding='utf-8') as f:
                json.dump(resultado, f, ensure_ascii=False, indent=2)
            
            # Adiciona ao resultado geral
            resultados_gerais.append(resultado)
            
            print(f"   ✅ Salvo como: {nome_json}")
            
            # Mostra informações básicas extraídas
            nome = resultado.get('nome_completo', 'Nome não encontrado')
            titulo = resultado.get('titulo_completo', '')
            print(f"   📝 Nome: {nome}")
            if titulo:
                print(f"   📄 Título: {titulo}")
            
        except Exception as e:
            print(f"   ❌ Erro ao processar {arquivo.name}: {str(e)}")
            # Salva erro em arquivo de log
            erro = {
                'arquivo_origem': arquivo.name,
                'erro': str(e),
                'tipo_erro': type(e).__name__
            }
            resultados_gerais.append(erro)
        
        print()
    
    # Salva resultado consolidado
    arquivo_consolidado = pasta_resultados / "todos_personagens.json"
    with open(arquivo_consolidado, 'w', encoding='utf-8') as f:
        json.dump({
            'total_arquivos': len(arquivos_txt),
            'data_processamento': str(Path().cwd()),
            'personagens': resultados_gerais
        }, f, ensure_ascii=False, indent=2)
    
    print(f"📊 Resultado consolidado salvo em: todos_personagens.json")
    print(f"✨ Processamento concluído! {len(resultados_gerais)} arquivo(s) processado(s)")
    
    # Mostra resumo
    print("\n" + "=" * 50)
    print("📈 RESUMO:")
    print(f"   • Arquivos encontrados: {len(arquivos_txt)}")
    print(f"   • Arquivos processados: {len(resultados_gerais)}")
    print(f"   • Pasta de resultados: {pasta_resultados.name}")
    print("=" * 50)

if __name__ == "__main__":
    main()
