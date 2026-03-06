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

  // Extract CREATE TABLE statements
  const createRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"\[]?(\w+)[`"\]]?\s*\(([\s\S]*?)\)\s*(?:ENGINE\s*=\s*\w+\s*)?(?:DEFAULT\s+CHARSET\s*=\s*\w+\s*)?(?:COLLATE\s*=\s*\w+\s*)?;/gi;

  let match;
  while ((match = createRegex.exec(cleaned)) !== null) {
    try {
      const tableName = match[1];
      const body = match[2];
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

    // CONSTRAINT only
    if (/^CONSTRAINT/i.test(trimmed)) continue;

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
  // Match: column_name TYPE(params) [constraints...]
  const colMatch = line.match(/^[`"\[]?(\w+)[`"\]]?\s+(\w[\w\s]*?)(?:\(([^)]*)\))?\s*(.*?)$/i);
  if (!colMatch) return null;

  const name = colMatch[1];
  let type = colMatch[2].trim().toUpperCase();
  const params = colMatch[3] || '';
  const rest = colMatch[4] || '';

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
