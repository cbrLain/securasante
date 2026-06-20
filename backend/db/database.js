// db/database.js — PostgreSQL uniquement (via pg)
const { initPg, getPgDb } = require('./pg-database');

let _api = null;

async function initDb() {
  _api = await initPg();

  // Seed si base vide
  const row = await _api.prepare('SELECT COUNT(*) AS n FROM utilisateurs').get();
  if (!row || row.n === '0' || row.n === 0) {
    console.log('📦 Base vide — exécution du seed...');
    require('./seed');
  }

  return _api;
}

function getDb() {
  if (!_api) throw new Error('Database not initialized.');
  return _api;
}

module.exports = { getDb, initDb };
