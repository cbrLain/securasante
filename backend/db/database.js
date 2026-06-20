// db/database.js — Initialise SQLite via sql.js (pur JS, zéro compilation native)
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'securasante.db');
const SCHEMA  = path.join(__dirname, 'schema.sql');

let db;

class Statement {
  constructor(sqlJsStmt) {
    this._stmt = sqlJsStmt;
  }
  get(...params) {
    if (params.length) this._stmt.bind(params);
    if (this._stmt.step()) {
      const row = this._stmt.getAsObject();
      this._stmt.reset();
      return row;
    }
    this._stmt.reset();
    return undefined;
  }
  all(...params) {
    if (params.length) this._stmt.bind(params);
    const rows = [];
    while (this._stmt.step()) rows.push(this._stmt.getAsObject());
    this._stmt.reset();
    return rows;
  }
  run(...params) {
    if (params.length) this._stmt.bind(params);
    this._stmt.step();
    this._stmt.reset();
    const lastId = Number(db.exec("SELECT last_insert_rowid() AS id")[0]?.values[0]?.[0] || 0);
    const changes = Number(db.exec("SELECT changes() AS n")[0]?.values[0]?.[0] || 0);
    return { lastInsertRowid: lastId, changes };
  }
}

function transaction(fn) {
  return function(...args) {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch(e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };
}

// ── Initialisation unique ─────────────────────────────────
async function initDb() {
  const SQL = await initSqlJs();
  let buffer = null;
  try { buffer = fs.readFileSync(DB_PATH); } catch(e) { /* première fois */ }
  db = new SQL.Database(buffer);

  const schema = fs.readFileSync(SCHEMA, 'utf8');
  db.exec(schema);

  // Stocke et retourne l'interface compatible better-sqlite3
  _api = getApi();
  return _api;
}

function getApi() {
  return {
    prepare: (sql) => new Statement(db.prepare(sql)),
    exec: (sql) => db.exec(sql),
    transaction,
    save: () => {
      try {
        fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
      } catch(e) { console.error('⚠️  Save error:', e.message); }
    },
  };
}

// getDb retourne le db synchronously une fois initialisé
let _api = null;
function getDb() {
  if (!_api) throw new Error('Database not initialized. Call initDb() first.');
  return _api;
}

module.exports = { getDb, initDb };
