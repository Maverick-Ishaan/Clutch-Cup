// Initial Tournament State
const defaultData = {
  groups: {
    A: ['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5'],
    B: ['Team 6', 'Team 7', 'Team 8', 'Team 9', 'Team 10'],
    C: ['Team 11', 'Team 12', 'Team 13', 'Team 14', 'Team 15'],
    D: ['Team 16', 'Team 17', 'Team 18', 'Team 19', 'Team 20']
  },
  matches: generateRoundRobinMatches()
};

function generateRoundRobinMatches() {
  const groups = {
    A: ['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5'],
    B: ['Team 6', 'Team 7', 'Team 8', 'Team 9', 'Team 10'],
    C: ['Team 11', 'Team 12', 'Team 13', 'Team 14', 'Team 15'],
    D: ['Team 16', 'Team 17', 'Team 18', 'Team 19', 'Team 20']
  };

  let matches = [];
  let matchId = 1;

  Object.keys(groups).forEach(g => {
    const teams = groups[g];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          id: matchId++,
          group: g,
          t1: teams[i],
          t2: teams[j],
          s1: null,
          s2: null,
          played: false
        });
      }
    }
  });

  return matches;
}

// Load or Initialize State
let state = JSON.parse(localStorage.getItem('clutch_cup_data')) || defaultData;

function saveState() {
  localStorage.setItem('clutch_cup_data', JSON.stringify(state));
  render();
}

function toggleAdmin() {
  const panel = document.getElementById('adminPanel');
  panel.classList.toggle('hidden');
  loadGroupMatches();
}

function loadGroupMatches() {
  const grp = document.getElementById('adminGroup').value;
  const select = document.getElementById('adminMatchSelect');
  select.innerHTML = '';
  
  const grpMatches = state.matches.filter(m => m.group === grp);
  grpMatches.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.t1} vs ${m.t2} ${m.played ? `(${m.s1}-${m.s2})` : ''}`;
    select.appendChild(opt);
  });
}

function saveScore() {
  const matchId = parseInt(document.getElementById('adminMatchSelect').value);
  const s1 = parseInt(document.getElementById('score1').value);
  const s2 = parseInt(document.getElementById('score2').value);

  if (isNaN(s1) || isNaN(s2)) {
    alert('Please enter valid numeric scores for both teams.');
    return;
  }

  const match = state.matches.find(m => m.id === matchId);
  if (match) {
    match.s1 = s1;
    match.s2 = s2;
    match.played = true;
    saveState();
    document.getElementById('score1').value = '';
    document.getElementById('score2').value = '';
    loadGroupMatches();
  }
}

function calculateStandings(groupKey) {
  const teams = state.groups[groupKey];
  const groupMatches = state.matches.filter(m => m.group === groupKey && m.played);

  let stats = {};
  teams.forEach(t => {
    stats[t] = { name: t, w: 0, l: 0, rw: 0, rl: 0, rd: 0, pts: 0 };
  });

  groupMatches.forEach(m => {
    stats[m.t1].rw += m.s1;
    stats[m.t1].rl += m.s2;
    stats[m.t2].rw += m.s2;
    stats[m.t2].rl += m.s1;

    if (m.s1 > m.s2) {
      stats[m.t1].w += 1;
      stats[m.t1].pts += 3;
      stats[m.t2].l += 1;
    } else if (m.s2 > m.s1) {
      stats[m.t2].w += 1;
      stats[m.t2].pts += 3;
      stats[m.t1].l += 1;
    }
  });

  Object.values(stats).forEach(t => t.rd = t.rw - t.rl);

  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.rd !== a.rd) return b.rd - a.rd;
    return b.rw - a.rw;
  });
}

function render() {
  // Render Standings Tables
  const standingsContainer = document.getElementById('standingsContainer');
  standingsContainer.innerHTML = '';

  ['A', 'B', 'C', 'D'].forEach(g => {
    const standings = calculateStandings(g);
    let html = `
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 class="text-xl font-teko uppercase text-red-500 mb-2">Group ${g}</h3>
        <table class="w-full text-left text-xs text-slate-300">
          <thead>
            <tr class="border-b border-slate-800 text-slate-500">
              <th class="p-1">Team</th>
              <th class="p-1 text-center">W-L</th>
              <th class="p-1 text-center">RD</th>
              <th class="p-1 text-right">PTS</th>
            </tr>
          </thead>
          <tbody>
    `;

    standings.forEach((t, i) => {
      const isTop2 = i < 2;
      html += `
        <tr class="border-b border-slate-800/50 ${isTop2 ? 'bg-red-500/5 font-semibold text-white' : ''}">
          <td class="p-2">${t.name} ${isTop2 ? '<span class="text-[10px] text-red-400">QUAL</span>' : ''}</td>
          <td class="p-2 text-center text-slate-400">${t.w}-${t.l}</td>
          <td class="p-2 text-center ${t.rd >= 0 ? 'text-green-400' : 'text-red-400'}">${t.rd > 0 ? '+' + t.rd : t.rd}</td>
          <td class="p-2 text-right font-bold text-red-400">${t.pts}</td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    standingsContainer.innerHTML += html;
  });

  // Render Matches List
  const matchesContainer = document.getElementById('matchesContainer');
  matchesContainer.innerHTML = '';

  ['A', 'B', 'C', 'D'].forEach(g => {
    const grpMatches = state.matches.filter(m => m.group === g);
    let html = `
      <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 class="text-xl font-teko uppercase text-slate-300 mb-2">Group ${g} Matches</h3>
        <div class="space-y-2">
    `;

    grpMatches.forEach(m => {
      html += `
        <div class="flex justify-between items-center bg-slate-800/60 p-2 rounded text-xs">
          <span class="w-5/12 text-right font-medium ${m.played && m.s1 > m.s2 ? 'text-red-400 font-bold' : ''}">${m.t1}</span>
          <span class="w-2/12 text-center bg-slate-900 px-2 py-1 rounded text-slate-400 font-bold border border-slate-700">
            ${m.played ? `${m.s1} - ${m.s2}` : 'VS'}
          </span>
          <span class="w-5/12 text-left font-medium ${m.played && m.s2 > m.s1 ? 'text-red-400 font-bold' : ''}">${m.t2}</span>
        </div>
      `;
    });

    html += `</div></div>`;
    matchesContainer.innerHTML += html;
  });
}

// Initial Render
render();