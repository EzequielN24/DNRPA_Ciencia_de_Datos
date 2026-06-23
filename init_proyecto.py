import os
import subprocess
import sys

def run_cmd(cmd, cwd=None):
    print(f"\n=== Ejecutando: {cmd} ===")
    res = subprocess.run(cmd, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"\nERROR: El comando '{cmd}' falló con código de salida {res.returncode}.")
        sys.exit(res.returncode)

def main():
    # Obtener el directorio del script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("=== INICIANDO PROYECTO ===")
    
    # 1. Aplicar migraciones de Django para crear la base de datos y sus tablas
    run_cmd("python backend/manage.py migrate", cwd=script_dir)
    
    # 2. Correr el pipeline de unificación y sanitización (guarda registros limpios en base de datos)
    run_cmd("python backend/api/scripts/unificar_datos.py", cwd=script_dir)
    
    # 3. Entrenar el modelo K-Means y guardar resultados en base de datos
    run_cmd("python backend/api/scripts/generar_modelo.py", cwd=script_dir)
    
    print("\n=== INICIALIZACIÓN COMPLETADA ===")
    print("Para iniciar la aplicación debemos ejecutar los siguientes comandos:")
    print(" - Backend: python -m pipenv run python backend/manage.py runserver")
    print(" - Frontend: cd frontend && npm start")

if __name__ == "__main__":
    main()
