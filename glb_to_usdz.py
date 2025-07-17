#!/usr/bin/env python3
import sys
import os
import subprocess

def convert_glb_to_usdz(input_file, output_file):
    """
    Converte GLB para USDZ usando USD Tools
    """
    try:
        # Verificar se o arquivo de entrada existe
        if not os.path.exists(input_file):
            print(f"❌ Arquivo não encontrado: {input_file}")
            return False
        
        # Criar diretório de saída se não existir
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        # Comando para conversão usando USD Tools
        cmd = [
            "usdcat",
            "--flatten",
            input_file,
            "-o",
            output_file
        ]
        
        print(f"🔄 Executando: {' '.join(cmd)}")
        
        # Executar comando
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Conversão bem-sucedida: {output_file}")
            return True
        else:
            print(f"❌ Erro na conversão: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python glb_to_usdz.py <input.glb> <output.usdz>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    success = convert_glb_to_usdz(input_file, output_file)
    sys.exit(0 if success else 1)
