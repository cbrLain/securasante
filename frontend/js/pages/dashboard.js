/* js/pages/dashboard.js */
function calcPct(val, max) {
  return Math.min(Math.round((val / max) * 100), 100);
}

async function loadDashboard(role) {
  try {
    const d = await Api.getStats();
    const grid = document.getElementById('stats-grid');
    let cards = '';

    if (role === 'assureur') {
      const stats = [
        { val: d.totalAssures,  lbl: 'Assurés actifs',         pct: calcPct(d.totalAssures, 10), color: '#007bff' },
        { val: d.totalMedecins, lbl: 'Médecins enregistrés',   pct: calcPct(d.totalMedecins, 10), color: '#28a745' },
        { val: d.totalFeuilles, lbl: 'Feuilles de maladie',    pct: calcPct(d.totalFeuilles, 20), color: '#17a2b8' },
        { val: d.totalRemb,     lbl: 'Total remboursé',        pct: calcPct(d.totalRemb, 20000), color: '#ffc107', fmt: v => fmtMoney(v) },
      ];
      stats.forEach((s, i) => {
        cards += `
          <div class="stat-card">
            <canvas class="stat-chart" id="stat-chart-${i}" width="72" height="72"></canvas>
            <div class="stat-info">
              <div class="stat-val">${s.fmt ? s.fmt(s.val) : s.val}</div>
              <div class="stat-lbl">${s.lbl}</div>
              <div class="stat-bar"><div class="stat-bar-fill" style="width:${s.pct}%;background:${s.color}"></div></div>
            </div>
          </div>`;
      });
      grid.innerHTML = cards;
      stats.forEach((s, i) => drawMiniDonut('stat-chart-' + i, s.pct, s.color));
    } else {
      const stats = [
        { val: d.totalFeuilles,     lbl: 'Mes feuilles',         pct: calcPct(d.totalFeuilles, 20),   color: '#17a2b8' },
        { val: d.totalPrescriptions, lbl: 'Prescriptions émises', pct: calcPct(d.totalPrescriptions, 20), color: '#6610f2' },
      ];
      stats.forEach((s, i) => {
        cards += `
          <div class="stat-card">
            <canvas class="stat-chart" id="stat-chart-${i}" width="72" height="72"></canvas>
            <div class="stat-info">
              <div class="stat-val">${s.val}</div>
              <div class="stat-lbl">${s.lbl}</div>
              <div class="stat-bar"><div class="stat-bar-fill" style="width:${s.pct}%;background:${s.color}"></div></div>
            </div>
          </div>`;
      });
      grid.innerHTML = cards;
      stats.forEach((s, i) => drawMiniDonut('stat-chart-' + i, s.pct, s.color));
    }

    // Activité récente
    const actList = document.getElementById('activity-list');
    actList.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'activity-list';
    const dotColors = { 'Remboursée':'#28a745','Validée':'#6610f2','Refusée':'#dc3545','En cours de traitement':'#17a2b8','Incomplète':'#ffc107','Transmise':'#007bff','Brouillon':'#6c757d','Supprimée':'#adb5bd' };
    if (d.activiteRecente?.length) {
      el.innerHTML = d.activiteRecente.map(a => `
        <div class="act-item">
          <div class="act-dot" style="background:${dotColors[a.statut]||'#6c757d'}"></div>
          <div><div class="act-text">${a.texte} : ${badgeStatut(a.statut)}</div>
          <div class="act-time">${fmtDateTime(a.date)}</div></div>
        </div>
      `).join('');
    } else {
      el.innerHTML = '<div class="empty"><i class="fas fa-inbox"></i><h4>Aucune activité</h4></div>';
    }
    actList.appendChild(el);

    // Chart
    if (d.parStatut?.length) {
      setTimeout(() => drawDonut('chart-statut', d.parStatut), 100);
    }
  } catch(e) {
    console.error(e);
  }
}
