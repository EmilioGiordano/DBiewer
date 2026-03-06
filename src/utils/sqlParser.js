import { DBMS } from '../data/dbTypes';

export function parseDDL(sql, dbms = DBMS.MYSQL) {
  const tables = [];
  const relationships = [];
  const errors = [];

  // Normalize whitespace and remove comments
  let cleaned = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\r\n/g, '\n');

  // Extract CREATE TYPE ... AS ENUM for reference (store enum type names)
  const enumTypes = new Set();
  const typeRegex = /CREATE\s+TYPE\s+(\w+)\s+AS\s+ENUM\s*\(([^)]*)\)/gi;
  let typeMatch;
  while ((typeMatch = typeRegex.exec(cleaned)) !== null) {
    enumTypes.add(typeMatch[1].toLowerCase());
  }

  // Extract CREATE TABLE statements using balanced parenthesis matching
  const createHeaderRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"\[]?(\w+)[`"\]]?\s*\(/gi;

  let match;
  while ((match = createHeaderRegex.exec(cleaned)) !== null) {
    try {
      const tableName = match[1];
      const startIdx = match.index + match[0].length;
      // Find matching closing paren
      let depth = 1;
      let i = startIdx;
      while (i < cleaned.length && depth > 0) {
        if (cleaned[i] === '(') depth++;
        else if (cleaned[i] === ')') depth--;
        if (depth > 0) i++;
      }
      const body = cleaned.substring(startIdx, i);
      const table = parseTableBody(tableName, body, dbms);
      tables.push(table);
    } catch (e) {
      errors.push(`Error parsing table: ${e.message}`);
    }
  }

  // Extract ALTER TABLE ... ADD FOREIGN KEY
  const fkRegex = /ALTER\s+TABLE\s+[`"\[]?(\w+)[`"\]]?\s+ADD\s+(?:CONSTRAINT\s+[`"\[]?\w+[`"\]]?\s+)?FOREIGN\s+KEY\s*\(\s*[`"\[]?(\w+)[`"\]]?\s*\)\s*REFERENCES\s+[`"\[]?(\w+)[`"\]]?\s*\(\s*[`"\[]?(\w+)[`"\]]?\s*\)/gi;

  while ((match = fkRegex.exec(cleaned)) !== null) {
    const fromTableName = match[1];
    const fromColName = match[2];
    const toTableName = match[3];
    const toColName = match[4];

    const fromTable = tables.find(t => t.name.toLowerCase() === fromTableName.toLowerCase());
    const toTable = tables.find(t => t.name.toLowerCase() === toTableName.toLowerCase());

    if (fromTable && toTable) {
      const fromCol = fromTable.columns.find(c => c.name.toLowerCase() === fromColName.toLowerCase());
      const toCol = toTable.columns.find(c => c.name.toLowerCase() === toColName.toLowerCase());

      if (fromCol && toCol) {
        relationships.push({
          id: crypto.randomUUID(),
          fromTable: fromTable.id,
          fromColumn: fromCol.id,
          toTable: toTable.id,
          toColumn: toCol.id,
          cardinality: '1:N',
        });
      }
    }
  }

  // Resolve inline FKs (_inlineFKs from FOREIGN KEY constraints inside CREATE TABLE)
  for (const fromTable of tables) {
    if (fromTable._inlineFKs) {
      for (const fk of fromTable._inlineFKs) {
        const toTable = tables.find(t => t.name.toLowerCase() === fk.toTable.toLowerCase());
        if (!toTable) continue;
        const fromCol = fromTable.columns.find(c => c.name.toLowerCase() === fk.fromCol.toLowerCase());
        const toCol = toTable.columns.find(c => c.name.toLowerCase() === fk.toCol.toLowerCase());
        if (fromCol && toCol) {
          relationships.push({
            id: crypto.randomUUID(),
            fromTable: fromTable.id,
            fromColumn: fromCol.id,
            toTable: toTable.id,
            toColumn: toCol.id,
            cardinality: '1:N',
          });
        }
      }
      delete fromTable._inlineFKs;
    }
  }

  // Resolve column-level REFERENCES (e.g., col_name INT REFERENCES other_table(col))
  for (const fromTable of tables) {
    for (const col of fromTable.columns) {
      if (col._ref) {
        const toTable = tables.find(t => t.name.toLowerCase() === col._ref.toTable.toLowerCase());
        if (toTable) {
          const toCol = toTable.columns.find(c => c.name.toLowerCase() === col._ref.toCol.toLowerCase());
          if (toCol) {
            relationships.push({
              id: crypto.randomUUID(),
              fromTable: fromTable.id,
              fromColumn: col.id,
              toTable: toTable.id,
              toColumn: toCol.id,
              cardinality: '1:N',
            });
          }
        }
        delete col._ref;
      }
    }
  }

  // Auto-layout tables in a grid
  const cols = Math.ceil(Math.sqrt(tables.length));
  tables.forEach((table, i) => {
    table.position = {
      x: (i % cols) * 320 + 50,
      y: Math.floor(i / cols) * 350 + 50,
    };
  });

  return { tables, relationships, errors };
}

function parseTableBody(tableName, body, dbms) {
  const columns = [];
  const indexes = [];
  const inlineFKs = [];
  const TABLE_COLORS = ['#6c63ff', '#3b82f6', '#06b6d4', '#10b981', '#eab308', '#f97316', '#ef4444', '#a855f7'];
  const colorIndex = tableName.length % TABLE_COLORS.length;

  // Split by comma, but respect parentheses
  const lines = splitByComma(body);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // PRIMARY KEY constraint
    if (/^PRIMARY\s+KEY/i.test(trimmed)) {
      const pkCols = extractParenContent(trimmed);
      if (pkCols) {
        pkCols.split(',').forEach(name => {
          const colName = name.trim().replace(/[`"\[\]]/g, '');
          const col = columns.find(c => c.name.toLowerCase() === colName.toLowerCase());
          if (col) col.primaryKey = true;
        });
      }
      continue;
    }

    // UNIQUE KEY / INDEX / KEY
    if (/^(?:UNIQUE\s+)?(?:KEY|INDEX)/i.test(trimmed)) {
      const isUnique = /^UNIQUE/i.test(trimmed);
      const idxCols = extractParenContent(trimmed);
      if (idxCols) {
        const idx = {
          id: crypto.randomUUID(),
          name: '',
          columns: [],
          unique: isUnique,
          type: isUnique ? 'UNIQUE' : 'INDEX',
        };
        idxCols.split(',').forEach(name => {
          const colName = name.trim().replace(/[`"\[\]]/g, '').replace(/\(\d+\)/, '');
          const col = columns.find(c => c.name.toLowerCase() === colName.toLowerCase());
          if (col) idx.columns.push(col.id);
        });
        if (idx.columns.length > 0) indexes.push(idx);
      }
      continue;
    }

    // FOREIGN KEY constraint (inline)
    if (/^(?:CONSTRAINT\s+)?.*?FOREIGN\s+KEY/i.test(trimmed)) {
      const fkMatch = trimmed.match(/FOREIGN\s+KEY\s*\(\s*[`"\[]?(\w+)[`"\]]?\s*\)\s*REFERENCES\s+[`"\[]?(\w+)[`"\]]?\s*\(\s*[`"\[]?(\w+)[`"\]]?\s*\)/i);
      if (fkMatch) {
        inlineFKs.push({
          fromCol: fkMatch[1],
          toTable: fkMatch[2],
          toCol: fkMatch[3],
        });
      }
      continue;
    }

    // CONSTRAINT / CHECK only
    if (/^CONSTRAINT/i.test(trimmed) || /^CHECK\s*\(/i.test(trimmed)) continue;

    // UNIQUE constraint on columns (e.g., UNIQUE (sala_id, numero))
    if (/^UNIQUE\s*\(/i.test(trimmed)) {
      const uqCols = extractParenContent(trimmed);
      if (uqCols) {
        const idx = {
          id: crypto.randomUUID(),
          name: '',
          columns: [],
          unique: true,
          type: 'UNIQUE',
        };
        uqCols.split(',').forEach(name => {
          const colName = name.trim().replace(/[`"\[\]]/g, '');
          const col = columns.find(c => c.name.toLowerCase() === colName.toLowerCase());
          if (col) idx.columns.push(col.id);
        });
        if (idx.columns.length > 0) indexes.push(idx);
      }
      continue;
    }

    // Column definition
    const col = parseColumn(trimmed, dbms);
    if (col) columns.push(col);
  }

  return {
    id: crypto.randomUUID(),
    name: tableName,
    comment: '',
    color: TABLE_COLORS[colorIndex],
    position: { x: 0, y: 0 },
    width: 260,
    columns,
    indexes,
    _inlineFKs: inlineFKs,
  };
}

function parseColumn(line, dbms) {
  // Skip GENERATED ALWAYS AS columns (computed columns)
  if (/GENERATED\s+ALWAYS/i.test(line)) {
    // Still parse the column name and type before GENERATED
    const genMatch = line.match(/^[`"\[]?(\w+)[`"\]]?\s+(\w[\w\s]*?)(?:\(([^)]*)\))?\s+GENERATED/i);
    if (genMatch) {
      return {
        id: crypto.randomUUID(),
        name: genMatch[1],
        type: genMatch[2].trim().toUpperCase(),
        length: genMatch[3] || '',
        primaryKey: false, autoIncrement: false, nullable: true,
        unique: false, default: '(computed)', comment: 'Generated column',
        unsigned: false, enumValues: '', isArray: false,
      };
    }
    return null;
  }

  // Match: column_name TYPE(params) [constraints...]
  // Use a more precise regex that stops the type at known keywords or parens
  const colMatch = line.match(/^[`"\[]?(\w+)[`"\]]?\s+([\w\s]+?)(?:\(([^)]*)\))?\s*((?:NOT|NULL|DEFAULT|PRIMARY|UNIQUE|AUTO_INCREMENT|AUTOINCREMENT|UNSIGNED|REFERENCES|CHECK|COMMENT|CONSTRAINT|ON|SERIAL|IDENTITY|COLLATE).*)?\s*$/i);
  if (!colMatch) {
    // Fallback: simpler regex
    const simpleMatch = line.match(/^[`"\[]?(\w+)[`"\]]?\s+(\w+)(?:\(([^)]*)\))?(.*?)$/i);
    if (!simpleMatch) return null;
    return parseColumnFromParts(simpleMatch[1], simpleMatch[2], simpleMatch[3] || '', simpleMatch[4] || '', line, dbms);
  }

  return parseColumnFromParts(colMatch[1], colMatch[2].trim(), colMatch[3] || '', colMatch[4] || '', line, dbms);
}

function parseColumnFromParts(name, rawType, params, rest, line, dbms) {
  let type = rawType.toUpperCase();

  // Normalize types
  if (type === 'INT4' || type === 'INT') type = dbms === DBMS.POSTGRESQL ? 'INTEGER' : 'INT';
  if (type === 'INT8') type = 'BIGINT';
  if (type === 'INT2') type = 'SMALLINT';
  if (type === 'BOOL') type = 'BOOLEAN';
  if (type === 'DOUBLE PRECISION') type = 'DOUBLE PRECISION';
  if (type === 'CHARACTER VARYING') type = 'VARCHAR';

  const col = {
    id: crypto.randomUUID(),
    name,
    type,
    length: params,
    primaryKey: /PRIMARY\s+KEY/i.test(rest),
    autoIncrement: /AUTO_INCREMENT|AUTOINCREMENT|SERIAL|IDENTITY/i.test(rest) || /SERIAL/.test(type),
    nullable: !/NOT\s+NULL/i.test(rest),
    unique: /UNIQUE/i.test(rest),
    default: '',
    comment: '',
    unsigned: /UNSIGNED/i.test(rest),
    enumValues: '',
    isArray: /\[\]/.test(line),
  };

  // Extract default value
  const defMatch = rest.match(/DEFAULT\s+('(?:[^']*)'|"(?:[^"]*)"|[\w().]+)/i);
  if (defMatch) {
    col.default = defMatch[1].replace(/^['"]|['"]$/g, '');
  }

  // Extract enum values
  if (type === 'ENUM' || type === 'SET') {
    const enumMatch = params.match(/['"]([^'"]+)['"]/g);
    if (enumMatch) {
      col.enumValues = enumMatch.map(v => v.replace(/['"]/g, '')).join(', ');
      col.length = '';
    }
  }

  // Extract inline REFERENCES (e.g., pais_id INT NOT NULL REFERENCES paises(id))
  const refMatch = rest.match(/REFERENCES\s+[`"\[]?(\w+)[`"\]]?\s*\(\s*[`"\[]?(\w+)[`"\]]?\s*\)/i);
  if (refMatch) {
    col._ref = { toTable: refMatch[1], toCol: refMatch[2] };
  }

  // Extract comment
  const commentMatch = rest.match(/COMMENT\s+'([^']*)'/i);
  if (commentMatch) {
    col.comment = commentMatch[1];
  }

  return col;
}

function splitByComma(str) {
  const result = [];
  let depth = 0;
  let current = '';

  for (const char of str) {
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current);
  return result;
}

function extractParenContent(str) {
  const match = str.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}
