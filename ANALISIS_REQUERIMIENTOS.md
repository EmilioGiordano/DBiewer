# Analisis de Requerimientos - Clon Libre de DrawSQL

## 1. Que es DrawSQL

DrawSQL es una herramienta web SaaS para disenar, visualizar y colaborar en diagramas de esquemas de bases de datos relacionales (Entity Relationship Diagrams). Su propuesta de valor es la simplicidad, el diseno visual limpio y la colaboracion en tiempo real.

---

## 2. Funcionalidades Completas Identificadas

### 2.1 Editor de Canvas (Core)

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Canvas infinito con zoom/pan | Lienzo 2D con scroll, zoom (rueda/trackpad/pinch), pan con drag | CRITICA |
| Tablas como nodos | Cada tabla es un nodo visual arrastrable con nombre, columnas e indices | CRITICA |
| Relaciones (FK lines) | Lineas que conectan columnas FK entre tablas con notacion de cardinalidad | CRITICA |
| Snap to grid | Alineacion automatica a una grilla invisible | ALTA |
| Lasso/multi-select | Herramienta de seleccion por region rectangular | ALTA |
| Resize de tablas | Ajustar ancho de tablas manualmente | MEDIA |
| Highlight de relaciones | Al seleccionar una tabla, resaltar sus FK y tablas relacionadas | ALTA |
| Zoom controls | Botones +/- y porcentaje visible, zoom to fit | ALTA |
| Traer tabla al frente | Al seleccionar, se pone encima de las demas | MEDIA |

### 2.2 Gestion de Tablas

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Crear tabla | Click en boton o toolbar "Add new" | CRITICA |
| Editar nombre de tabla | Inline editing del nombre | CRITICA |
| Duplicar tabla | Copiar tabla con todas sus columnas e indices | ALTA |
| Eliminar tabla | Borrar tabla y sus relaciones asociadas | CRITICA |
| Comentario de tabla | Campo de texto opcional para documentar la tabla | MEDIA |
| Mover tabla | Drag & drop en el canvas | CRITICA |
| Tabla colapsable | Mostrar/ocultar columnas para reducir ruido visual | MEDIA |

### 2.3 Gestion de Columnas

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Agregar columna | A una tabla, con nombre y tipo de dato | CRITICA |
| Tipo de dato | Selector con tipos especificos por DBMS (VARCHAR, INT, TEXT, ENUM, etc.) | CRITICA |
| Parametro de tipo | Longitud/precision (ej: VARCHAR(255), DECIMAL(10,2)) | CRITICA |
| Primary Key (PK) | Marcar columna como clave primaria | CRITICA |
| Foreign Key (FK) | Definir relacion a otra tabla/columna | CRITICA |
| Nullable | Toggle nullable/not null | CRITICA |
| Unique | Constraint de unicidad | ALTA |
| Auto-increment / IDENTITY | Columna autoincremental | ALTA |
| Default value | Valor por defecto con deteccion de tipo (funcion SQL, numerico, string) | ALTA |
| Comentario de columna | Documentacion inline de cada columna | MEDIA |
| Reordenar columnas | Drag & drop para cambiar orden | ALTA |
| Valores ENUM/SET | Definir valores posibles para tipos ENUM y SET | ALTA |
| Array types (PostgreSQL) | Soporte para tipos array como integer[], text[] | MEDIA |

### 2.4 Relaciones / Foreign Keys

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Crear relacion | Conectar columna FK a columna PK de otra tabla | CRITICA |
| Cardinalidad | 1:1, 1:N, N:M visual en la linea | CRITICA |
| Routing de lineas | Lineas ortogonales inteligentes que evitan solapamiento | ALTA |
| Editar relacion | Popup para cambiar columnas o cardinalidad | ALTA |
| Eliminar relacion | Borrar conexion FK | CRITICA |
| Multiples relaciones por columna | Una columna puede tener varias FK | MEDIA |

### 2.5 Indices

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Crear indice | Sobre una o mas columnas | ALTA |
| Indice compuesto | Multiples columnas en un indice | ALTA |
| Tipo de indice | BTREE, HASH, etc. | MEDIA |
| Indice unico | Constraint unique via indice | ALTA |
| Visualizacion en canvas | Mostrar indices en la representacion de la tabla | MEDIA |

### 2.6 Table Groups

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Crear grupo | Agrupar tablas relacionadas en un area visual | ALTA |
| Mover grupo | Arrastrar el grupo mueve todas sus tablas | ALTA |
| Colapsar grupo | Reducir un grupo para menos ruido visual | MEDIA |
| Nombre/color de grupo | Identificacion visual | ALTA |

### 2.7 Sticky Notes

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Crear nota | Colocar nota adhesiva en cualquier parte del canvas | MEDIA |
| Editar contenido | Texto libre con soporte multilinea | MEDIA |
| Mover nota | Drag & drop | MEDIA |
| Eliminar nota | Borrar nota | MEDIA |

### 2.8 Import / Export

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Import SQL (DDL) | Parsear CREATE TABLE, FK constraints, indices -> generar diagrama automatico | CRITICA |
| Auto-layout post-import | Algoritmo para posicionar tablas importadas | ALTA |
| Opcion overwrite en import | Si tabla ya existe, opcion de sobreescribir | MEDIA |
| Export SQL (DDL) | Generar script CREATE TABLE completo por DBMS | CRITICA |
| Export imagen | PNG/JPG del diagrama (Standard fast / High Quality) | ALTA |
| Export JSON | Formato JSON con toda la metadata del schema | ALTA |
| Import JSON | Recrear diagrama desde JSON exportado | ALTA |
| Export Laravel Migrations | Generar archivos de migracion PHP para Laravel | BAJA |
| Comentarios en SQL export | Incluir TABLE/COLUMN comments en el DDL | MEDIA |

### 2.9 DBMS Soportados

| DBMS | Tipos de datos | Export DDL | Import DDL |
|---|---|---|---|
| MySQL / MariaDB | Completo (inc. SET, ENUM, YEAR) | Si | Si |
| PostgreSQL | Completo (inc. arrays, geometry) | Si | Si |
| SQL Server | Completo (inc. IDENTITY) | Si | Si |

Cada DBMS tiene su propio set de tipos de datos disponibles en el editor.

### 2.10 Colaboracion en Tiempo Real

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Multiplayer editing | Multiples usuarios editando simultaneamente | CRITICA |
| Live cursors | Ver cursores de otros usuarios en el canvas | ALTA |
| Cambios en tiempo real | Ver cambios de otros usuarios instantaneamente | CRITICA |
| Indicador de presencia | Ver quien esta conectado al diagrama | ALTA |

### 2.11 Versionado e Historial

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Undo/Redo | Ctrl+Z / Ctrl+Shift+Z para deshacer/rehacer acciones | CRITICA |
| Undo post-import | Deshacer una importacion completa | MEDIA |
| Version history | Crear checkpoints con nombre/tag del estado del diagrama | ALTA |
| Preview version | Ver una version anterior sin aplicarla | ALTA |
| Revert version | Restaurar a una version anterior | ALTA |
| Autosave | Guardado automatico cada 5 minutos | ALTA |

### 2.12 Permisos y Compartir

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Diagramas publicos | Cualquiera con el link puede ver (solo lectura) | ALTA |
| Diagramas privados | Solo accesibles por usuarios autorizados | ALTA |
| Permisos por diagrama | View-only, Edit, Admin por usuario por diagrama | ALTA |
| Guest access | Invitar usuarios externos con acceso de solo lectura | MEDIA |
| Public link sharing | Compartir via URL publica de solo lectura | ALTA |
| Embed (iframe) | Incrustar diagrama en Notion, Confluence, blogs | MEDIA |

### 2.13 Equipos (Teams)

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Crear equipo | Organizacion que agrupa usuarios y diagramas | ALTA |
| Invitar usuarios | Email invite a unirse al equipo | ALTA |
| Roles de equipo | Owner, Admin, Editor, Observer | ALTA |
| User Groups | Agrupar usuarios para asignar permisos en bulk | MEDIA |
| Grupos default | Asignar grupo automatico a nuevos diagramas | BAJA |

### 2.14 UI/UX del Editor

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Left sidebar | Lista de tablas con columnas expandibles | ALTA |
| Inspector panel | Panel de propiedades de la tabla/columna seleccionada | ALTA |
| Locate/Jump to table | Buscar y centrar canvas en una tabla especifica | ALTA |
| Command palette | Cmd+/ para busqueda rapida de acciones y tablas (fuzzy search) | ALTA |
| Presentation mode | Modo pantalla completa para presentaciones | MEDIA |
| Keyboard shortcuts | Atajos completos (ver seccion dedicada) | ALTA |
| Toolbar "Add new" | Barra para agregar tablas/notas con posicionamiento preciso | MEDIA |
| Bulk actions | Acciones sobre multiples tablas seleccionadas | MEDIA |

### 2.15 Keyboard Shortcuts

| Shortcut | Accion |
|---|---|
| T | Agregar nueva tabla (click en canvas para posicionar) |
| N | Agregar sticky note (click en canvas para posicionar) |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Guardar |
| Ctrl+A | Seleccionar todas las tablas |
| Ctrl+C / Ctrl+X / Ctrl+V | Copy / Cut / Paste tablas |
| Ctrl+D | Duplicar seleccion |
| Ctrl+Enter | Agregar columna a tabla (ultima o seleccionada) |
| Ctrl+' | Agregar indice |
| Ctrl+\ | Toggle sidebar |
| Ctrl+/ | Command palette |
| Delete/Backspace | Eliminar seleccion |

### Detalles adicionales de la documentacion

**Columnas - Controles inline**: Cada columna tiene 4 controles: Name, Data Type (buscador), Nullable (boton "N", muestra "?" en canvas), Key Type (dropdown: Primary/Unique/Index/None).

**Indices - Dos formas de crearlos**:
- **Single-column**: via dropdown de Key Type en la columna (Primary=icono llave, Unique=icono copo de nieve, Index=performance)
- **Composite**: via boton "Add Index" con multi-select de columnas + tipo

**Table Groups - Restricciones**:
- No pueden anidarse (flat only)
- Cada tabla solo puede pertenecer a un grupo a la vez
- Resize del grupo NO absorbe tablas automaticamente, hay que arrastrar la tabla dentro

**Sticky Notes**: 8 colores pastel, 4 tamanos de fuente (S=16px, M=18px, L=20px, XL=22px).

**Version History**: Cada version tiene nombre + nota opcional. Preview abre read-only en nueva tab. Restaurar SOBREESCRIBE el diagrama actual.

**Embeds**: Solo diagramas publicos pueden ser embebidos (limitacion de DrawSQL que podemos superar).

### 2.16 Templates / Galeria

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Galeria publica | Coleccion de 200+ schemas de apps reales | BAJA |
| Busqueda de templates | Buscar por nombre | BAJA |
| Tags/categorias | Filtrar por framework, tecnologia, tipo | BAJA |
| Clonar template | Copiar un template a tu cuenta | BAJA |
| Variaciones por DBMS | Mismo schema en MySQL/PgSQL/SQL Server | BAJA |

### 2.17 Dashboard / Gestion de Diagramas

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Lista de diagramas | Dashboard con preview, nombre, fecha | ALTA |
| Crear nuevo diagrama | Seleccionando DBMS target | CRITICA |
| Clonar diagrama | Duplicar diagrama existente | MEDIA |
| Eliminar diagrama | Borrar diagrama | ALTA |
| Sorting | Ordenar por fecha creacion, actualizacion, nombre | MEDIA |
| Preview image | Thumbnail auto-generado del diagrama | MEDIA |

### 2.18 Autenticacion y Cuentas

| Funcionalidad | Descripcion | Prioridad |
|---|---|---|
| Registro | Email/password o OAuth | CRITICA |
| Login | Autenticacion de usuarios | CRITICA |
| Eliminar cuenta | GDPR compliance | MEDIA |
| Perfil de usuario | Avatar, nombre | BAJA |

---

## 3. Arquitectura Tecnica Propuesta para el Clon Libre

### 3.1 Stack Recomendado (100% Free/Open Source)

```
Frontend:
  - React 18+ o Vue 3 (SPA)
  - Canvas: React Flow (MIT) o Konva.js / Fabric.js para el canvas 2D
  - State: Zustand o Pinia
  - Estilos: Tailwind CSS
  - Real-time: Yjs (CRDT) + WebSocket

Backend:
  - Node.js + Express/Fastify o Python + FastAPI
  - Base de datos: PostgreSQL
  - ORM: Prisma o Drizzle (Node) / SQLAlchemy (Python)
  - Auth: Passport.js / Auth.js o implementacion propia JWT
  - WebSocket: Socket.io o ws para real-time
  - CRDT: Yjs para sincronizacion colaborativa

Infraestructura (self-hosted):
  - Docker + Docker Compose
  - Nginx como reverse proxy
  - MinIO o filesystem local para imagenes exportadas
```

### 3.2 Modelo de Datos Principal

```sql
-- Usuarios y autenticacion
users (id, email, password_hash, name, avatar_url, created_at)

-- Equipos
teams (id, name, owner_id, created_at)
team_members (team_id, user_id, role: owner|admin|editor|observer)
user_groups (id, team_id, name)
user_group_members (group_id, user_id)

-- Diagramas
diagrams (id, team_id, name, dbms: mysql|postgresql|sqlserver,
          visibility: public|private, schema_data: JSONB,
          created_by, created_at, updated_at)
diagram_permissions (diagram_id, user_id, permission: view|edit|admin)
diagram_group_permissions (diagram_id, group_id, permission: view|edit|admin)
diagram_versions (id, diagram_id, name, schema_data: JSONB, created_by, created_at)
diagram_guests (diagram_id, email, token, created_at)

-- Schema data (dentro del JSONB de diagrams.schema_data):
{
  "tables": [{
    "id": "uuid",
    "name": "users",
    "comment": "...",
    "position": { "x": 100, "y": 200 },
    "size": { "width": 250, "height": null },
    "columns": [{
      "id": "uuid",
      "name": "id",
      "type": "BIGINT",
      "typeParams": "20",
      "primaryKey": true,
      "autoIncrement": true,
      "nullable": false,
      "unique": false,
      "default": null,
      "comment": "",
      "enumValues": []
    }],
    "indexes": [{
      "id": "uuid",
      "name": "idx_email",
      "columns": ["email_col_id"],
      "unique": true,
      "type": "BTREE"
    }]
  }],
  "relationships": [{
    "id": "uuid",
    "fromTable": "table_id",
    "fromColumn": "col_id",
    "toTable": "table_id",
    "toColumn": "col_id",
    "cardinality": "1:N"
  }],
  "groups": [{
    "id": "uuid",
    "name": "Auth Module",
    "color": "#3B82F6",
    "tables": ["table_id_1", "table_id_2"],
    "collapsed": false
  }],
  "notes": [{
    "id": "uuid",
    "content": "Remember to add indexes",
    "position": { "x": 500, "y": 300 },
    "color": "yellow"
  }],
  "canvas": {
    "zoom": 1.0,
    "panX": 0,
    "panY": 0
  }
}
```

### 3.3 Modulos del Sistema

```
1. AUTH MODULE          - Registro, login, JWT, OAuth
2. TEAM MODULE          - CRUD equipos, miembros, roles, grupos
3. DIAGRAM MODULE       - CRUD diagramas, permisos, versiones
4. CANVAS ENGINE        - Render de tablas, relaciones, zoom/pan, drag
5. TABLE EDITOR         - CRUD tablas, columnas, indices, propiedades
6. RELATION ENGINE      - Crear/editar/borrar FK, routing de lineas
7. SQL PARSER           - Importar DDL -> schema JSON
8. SQL GENERATOR        - Schema JSON -> DDL por DBMS
9. IMAGE EXPORTER       - Canvas -> PNG/JPG
10. JSON IMPORT/EXPORT  - Serializar/deserializar schema completo
11. REALTIME ENGINE     - WebSocket + CRDT para colaboracion
12. COMMAND PALETTE     - Busqueda fuzzy + acciones rapidas
13. VERSION CONTROL     - Snapshots, preview, revert
14. SHARING MODULE      - Links publicos, embeds, guest access
```

---

## 4. Restricciones de DrawSQL (Plan Free) que Eliminamos

| Restriccion DrawSQL Free | Nuestro Clon |
|---|---|
| Solo diagramas publicos | Publicos Y privados, sin limite |
| Max 15 tablas por diagrama | Sin limite de tablas |
| 1 solo usuario | Ilimitado |
| Sin colaboracion real-time | Colaboracion real-time incluida |
| Sin version history | Version history incluido |
| Sin permisos granulares | Permisos completos |
| Sin user groups | User groups incluidos |

---

## 5. Plan de Desarrollo por Fases

### Fase 1 - MVP (Core Editor)
- Canvas con zoom/pan
- CRUD de tablas y columnas
- Relaciones FK con lineas
- Tipos de datos por DBMS (MySQL, PgSQL, SQL Server)
- Import SQL (DDL parser basico)
- Export SQL (DDL generator)
- Guardado local (localStorage) o guardado en backend basico
- Auth basico (registro/login)

### Fase 2 - Colaboracion
- Backend con PostgreSQL
- Teams y miembros
- Permisos por diagrama
- Autosave
- Undo/Redo

### Fase 3 - Real-time
- WebSocket server
- Yjs CRDT integration
- Live cursors
- Presencia de usuarios

### Fase 4 - Features Avanzados
- Version history con snapshots
- Command palette con fuzzy search
- Table groups
- Sticky notes
- Export imagen (PNG)
- Export/Import JSON
- Guest access y embeds
- Presentation mode

### Fase 5 - Comunidad
- Galeria de templates
- Sharing publico
- Beautiful social preview cards

---

## 6. Alternativas Open Source Existentes

Antes de construir desde cero, considerar estas herramientas:

| Herramienta | Pros | Contras |
|---|---|---|
| **dbdiagram.io** | Similar a DrawSQL | No es open source |
| **ERDPlus** | Gratis | No colaborativo, no self-hosted |
| **pgModeler** | Open source, potente | Solo PostgreSQL, desktop app |
| **DBeaver** (ER diagrams) | Open source | Mas un DB client que diagramador |
| **Mermaid.js** | Text-to-diagram, open source | No es visual/drag-drop |
| **chartdb** (github) | Open source, React | Proyecto relativamente nuevo |
| **drawdb** (github) | Open source, similar a DrawSQL | Sin colaboracion real-time |

**Recomendacion**: Evaluar `drawdb` (github.com/drawdb-io/drawdb) como base. Es un clon open source de DrawSQL bastante avanzado con React, pero le falta colaboracion real-time y features de equipo. Podria ser un punto de partida solido en lugar de empezar de cero.

---

## 7. Complejidad Estimada por Modulo

| Modulo | Complejidad | Justificacion |
|---|---|---|
| Canvas engine | MUY ALTA | Rendering 2D performante, zoom, pan, drag, selection |
| SQL Parser (DDL import) | ALTA | Parsear multiples dialectos SQL correctamente |
| SQL Generator | MEDIA-ALTA | Generar DDL valido por cada DBMS |
| Real-time collaboration | MUY ALTA | CRDT, conflict resolution, WebSocket infra |
| Relationship line routing | ALTA | Algoritmo de pathfinding ortogonal |
| Table editor UI | MEDIA | Forms, validacion, drag-reorder |
| Auth + Teams + Permisos | MEDIA | RBAC standard |
| Version history | MEDIA | Snapshots JSONB + diff |
| Image export | BAJA-MEDIA | Canvas to PNG |
| Command palette | BAJA-MEDIA | Fuzzy search sobre lista de items |
