---
name: creador-de-skills
description: Diseña y estructura Skills para Antigravity, asegurando que sean predecibles, reutilizables y fáciles de mantener.
---

# Creador de Skills

## Cuándo usar este skill
- Cuando el usuario pida crear un skill nuevo.
- Cuando se necesite estandarizar un proceso repetitivo.
- Cuando haya que convertir un prompt largo en un procedimiento ejecutable.

## Inputs necesarios
- **Objetivo**: Qué debe lograr el skill (ej: "crear un skill para auditar código").
- **Contexto**: Información sobre el proyecto o entorno donde se usará.
- **Requisitos**: Formatos específicos, herramientas o restricciones adicionales.

## Workflow
1. **Análisis**: Entender el objetivo final y los inputs necesarios.
2. **Diseño**: Definir el nombre (slug) y la descripción en tercera persona.
3. **Estructura**: Determinar si requiere carpetas adicionales (`recursos/`, `scripts/`, `ejemplos/`).
4. **Generación**: Redactar el `SKILL.md` siguiendo la plantilla obligatoria.
5. **Validación**: Verificar que el skill cumple con la checklist de calidad.

## Checklist de Calidad
- [x] Nombre corto, minúsculas y con guiones (máx 40 carac.).
- [x] Descripción clara en español y tercera persona (máx 220 carac.).
- [x] Triggers de activación específicos y fáciles de reconocer.
- [x] Flujo de trabajo lógico (3–6 pasos para simples, fases para complejos).
- [x] Formato de salida definido (lista, tabla, JSON, markdown).
- [x] Sin "marketing" o relleno innecesario.

## Instrucciones
- Mantén la lógica simple y operativa. El skill es un manual de ejecución, no un blog.
- Usa `agent/skills/<nombre-del-skill>/` como ruta base.
- Asegúrate de que el frontmatter YAML sea lo primero en el archivo.
- Si faltan datos críticos, pídelos antes de proceder.

## Output (formato exacto)
1. **Ruta de carpeta**: `agent/skills/<nombre-del-skill>/`
2. **SKILL.md**: Contenido completo con frontmatter y secciones requeridas.
3. **Recursos adicionales**: Solo si aportan valor real (plantillas, scripts, etc.).
