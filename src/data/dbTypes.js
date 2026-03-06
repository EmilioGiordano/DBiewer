export const DBMS = {
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql',
  SQLSERVER: 'sqlserver',
};

export const DB_LABELS = {
  [DBMS.MYSQL]: 'MySQL',
  [DBMS.POSTGRESQL]: 'PostgreSQL',
  [DBMS.SQLSERVER]: 'SQL Server',
};

const mysqlTypes = [
  'BIGINT', 'INT', 'MEDIUMINT', 'SMALLINT', 'TINYINT',
  'DECIMAL', 'DOUBLE', 'FLOAT',
  'VARCHAR', 'CHAR', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT', 'TINYTEXT',
  'BLOB', 'MEDIUMBLOB', 'LONGBLOB', 'TINYBLOB',
  'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR',
  'BOOLEAN',
  'ENUM', 'SET',
  'JSON',
  'BINARY', 'VARBINARY',
  'BIT',
  'GEOMETRY', 'POINT', 'LINESTRING', 'POLYGON',
  'UUID',
];

const postgresqlTypes = [
  'BIGINT', 'INTEGER', 'SMALLINT', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
  'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION', 'MONEY',
  'VARCHAR', 'CHAR', 'TEXT',
  'BYTEA',
  'DATE', 'TIMESTAMP', 'TIMESTAMPTZ', 'TIME', 'TIMETZ', 'INTERVAL',
  'BOOLEAN',
  'ENUM',
  'JSON', 'JSONB',
  'UUID',
  'CIDR', 'INET', 'MACADDR',
  'BIT', 'BIT VARYING',
  'XML',
  'POINT', 'LINE', 'LSEG', 'BOX', 'PATH', 'POLYGON', 'CIRCLE',
  'TSVECTOR', 'TSQUERY',
  'INT4RANGE', 'INT8RANGE', 'NUMRANGE', 'TSRANGE', 'TSTZRANGE', 'DATERANGE',
  'GEOGRAPHY', 'GEOMETRY',
];

const sqlserverTypes = [
  'BIGINT', 'INT', 'SMALLINT', 'TINYINT',
  'DECIMAL', 'NUMERIC', 'FLOAT', 'REAL', 'MONEY', 'SMALLMONEY',
  'VARCHAR', 'NVARCHAR', 'CHAR', 'NCHAR', 'TEXT', 'NTEXT',
  'VARBINARY', 'BINARY', 'IMAGE',
  'DATE', 'DATETIME', 'DATETIME2', 'DATETIMEOFFSET', 'SMALLDATETIME', 'TIME',
  'BIT',
  'UNIQUEIDENTIFIER',
  'XML',
  'SQL_VARIANT',
  'GEOGRAPHY', 'GEOMETRY',
];

export const DATA_TYPES = {
  [DBMS.MYSQL]: mysqlTypes,
  [DBMS.POSTGRESQL]: postgresqlTypes,
  [DBMS.SQLSERVER]: sqlserverTypes,
};

export const TYPES_WITH_LENGTH = [
  'VARCHAR', 'NVARCHAR', 'CHAR', 'NCHAR', 'VARBINARY', 'BINARY',
  'BIT', 'BIT VARYING',
];

export const TYPES_WITH_PRECISION = [
  'DECIMAL', 'NUMERIC', 'DOUBLE', 'FLOAT', 'REAL', 'MONEY',
  'DATETIME2', 'DATETIMEOFFSET', 'TIME',
];

export const CARDINALITIES = ['1:1', '1:N', 'N:1', 'N:M'];

export const TABLE_COLORS = [
  '#6c63ff', '#3b82f6', '#06b6d4', '#10b981',
  '#84cc16', '#eab308', '#f97316', '#ef4444',
  '#ec4899', '#a855f7', '#8b5cf6', '#64748b',
];

export const NOTE_COLORS = [
  '#fef08a', '#fed7aa', '#fecaca', '#d9f99d',
  '#a5f3fc', '#c4b5fd', '#fbcfe8', '#e2e8f0',
];

export function getDefaultColumns(dbms) {
  return [{
    id: crypto.randomUUID(),
    name: 'id',
    type: dbms === DBMS.POSTGRESQL ? 'SERIAL' : 'BIGINT',
    length: '',
    primaryKey: true,
    autoIncrement: dbms !== DBMS.POSTGRESQL,
    nullable: false,
    unique: false,
    default: '',
    comment: '',
    unsigned: dbms === DBMS.MYSQL,
    enumValues: '',
    isArray: false,
  }];
}
