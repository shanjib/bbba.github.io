// ─── Helpers ────────────────────────────────────────────────────────────────

function getTeam(id) {
    return teams.find(t => t.id === id);
}

function getPlayer(id) {
    return players.find(p => p.id === id);
}

function getTeamForPlayer(playerId) {
    return teams.find(t => t.playerIds.includes(playerId));
}

function isPlayed(game) {
    return game.homeScore !== null && game.awayScore !== null;
}

function formatDate(dateStr) {
    if (!dateStr) return "TBD";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function avg(total, games) {
    if (games === 0) return "0.0";
    return (total / games).toFixed(1);
}

// ─── Standings Derivation ────────────────────────────────────────────────────

function deriveStandings() {
    const map = {};
    teams.forEach(t => {
        map[t.id] = {
            teamId: t.id,
            name: t.name,
            wins: 0,
            losses: 0,
            pointsScored: 0,
            pointsAllowed: 0,
            // head-to-head: { opponentId: { wins, pointDiff } }
            h2h: {}
        };
        teams.forEach(other => {
            if (other.id !== t.id) map[t.id].h2h[other.id] = { wins: 0, pointDiff: 0 };
        });
    });

    games.filter(isPlayed).forEach(g => {
        const home = map[g.home];
        const away = map[g.away];
        const homeDiff = g.homeScore - g.awayScore;

        home.pointsScored  += g.homeScore;
        home.pointsAllowed += g.awayScore;
        away.pointsScored  += g.awayScore;
        away.pointsAllowed += g.homeScore;

        if (g.homeScore > g.awayScore) {
            home.wins++;
            away.losses++;
            home.h2h[g.away].wins++;
        } else {
            away.wins++;
            home.losses++;
            away.h2h[g.home].wins++;
        }

        home.h2h[g.away].pointDiff += homeDiff;
        away.h2h[g.home].pointDiff -= homeDiff;
    });

    const standings = Object.values(map);

    standings.sort((a, b) => {
        // 1. Win % (handle 0 games played)
        const aGames = a.wins + a.losses;
        const bGames = b.wins + b.losses;
        const aWinPct = aGames ? a.wins / aGames : 0;
        const bWinPct = bGames ? b.wins / bGames : 0;
        if (bWinPct !== aWinPct) return bWinPct - aWinPct;

        // 2. Head-to-head wins
        const aH2HWins = a.h2h[b.teamId]?.wins ?? 0;
        const bH2HWins = b.h2h[a.teamId]?.wins ?? 0;
        if (bH2HWins !== aH2HWins) return bH2HWins - aH2HWins;

        // 3. Head-to-head point differential
        const aH2HDiff = a.h2h[b.teamId]?.pointDiff ?? 0;
        const bH2HDiff = b.h2h[a.teamId]?.pointDiff ?? 0;
        if (bH2HDiff !== aH2HDiff) return bH2HDiff - aH2HDiff;

        // 4. Overall point differential
        return (b.pointsScored - b.pointsAllowed) - (a.pointsScored - a.pointsAllowed);
    });

    return standings;
}

// ─── Player Stats Derivation ─────────────────────────────────────────────────

function derivePlayerStats() {
    const map = {};
    players.forEach(p => {
        map[p.id] = { playerId: p.id, name: p.name, gamesPlayed: 0, totalPoints: 0, totalRebounds: 0, totalAssists: 0 };
    });

    games.filter(isPlayed).forEach(g => {
        g.playerStats.forEach(ps => {
            if (!map[ps.playerId]) return;
            map[ps.playerId].gamesPlayed++;
            map[ps.playerId].totalPoints    += ps.points    ?? 0;
            map[ps.playerId].totalRebounds  += ps.rebounds  ?? 0;
            map[ps.playerId].totalAssists   += ps.assists   ?? 0;
        });
    });

    return Object.values(map);
}

// ─── Page: About ─────────────────────────────────────────────────────────────

function renderAbout() {
    const el = document.getElementById("about-text");
    if (el) el.textContent = league.about;

    const played = games.filter(isPlayed).length;
    const remaining = games.length - played;

    const statsEl = document.getElementById("league-quick-stats");
    if (statsEl) {
        statsEl.innerHTML = `
      <div class="quick-stat"><span class="qs-num">${teams.length}</span><span class="qs-label">Teams</span></div>
      <div class="quick-stat"><span class="qs-num">${players.length}</span><span class="qs-label">Players</span></div>
      <div class="quick-stat"><span class="qs-num">${played}</span><span class="qs-label">Games Played</span></div>
      <div class="quick-stat"><span class="qs-num">${remaining}</span><span class="qs-label">Games Remaining</span></div>
    `;
    }
}

// ─── Page: Schedule ──────────────────────────────────────────────────────────

function renderSchedule() {
    const container = document.getElementById("schedule-container");
    if (!container) return;

    const played   = games.filter(isPlayed).sort((a, b) => new Date(b.date) - new Date(a.date));
    const upcoming = games.filter(g => !isPlayed(g));

    let html = "";

    if (played.length) {
        html += `<h2 class="section-subheading">Completed Games</h2>`;
        played.forEach(g => {
            const home = getTeam(g.home);
            const away = getTeam(g.away);
            const homeWin = g.homeScore > g.awayScore;
            html += `
        <div class="game-card completed">
          <div class="game-date">${formatDate(g.date)}</div>
          <div class="game-matchup">
            <span class="team-name ${homeWin ? "winner" : ""}">${home.name}</span>
            <span class="score-block">
              <span class="${homeWin ? "score-win" : "score-loss"}">${g.homeScore}</span>
              <span class="score-sep">–</span>
              <span class="${!homeWin ? "score-win" : "score-loss"}">${g.awayScore}</span>
            </span>
            <span class="team-name ${!homeWin ? "winner" : ""}">${away.name}</span>
          </div>
          <a class="box-score-link" href="stats.html?game=${g.id}">Box Score →</a>
        </div>`;
        });
    }

    if (upcoming.length) {
        html += `<h2 class="section-subheading">Upcoming Games</h2>`;
        upcoming.forEach(g => {
            const home = getTeam(g.home);
            const away = getTeam(g.away);
            html += `
        <div class="game-card upcoming">
          <div class="game-date">${formatDate(g.date)}</div>
          <div class="game-matchup">
            <span class="team-name">${home.name}</span>
            <span class="vs-badge">VS</span>
            <span class="team-name">${away.name}</span>
          </div>
        </div>`;
        });
    }

    if (!html) html = `<p class="empty-state">No games scheduled yet. Check back soon!</p>`;
    container.innerHTML = html;
}

// ─── Page: Standings ─────────────────────────────────────────────────────────

function renderStandings() {
    const tbody = document.getElementById("standings-body");
    if (!tbody) return;

    const standings = deriveStandings();
    tbody.innerHTML = standings.map((s, i) => {
        const gp   = s.wins + s.losses;
        const diff = s.pointsScored - s.pointsAllowed;
        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
        return `
      <tr class="${i === 0 && gp > 0 ? "leader-row" : ""}">
        <td class="rank">${i + 1}</td>
        <td class="team-col">${s.name}</td>
        <td>${s.wins}</td>
        <td>${s.losses}</td>
        <td>${gp ? (s.wins / gp * 100).toFixed(0) + "%" : "—"}</td>
        <td>${s.pointsScored}</td>
        <td>${s.pointsAllowed}</td>
        <td class="${diff > 0 ? "pos-diff" : diff < 0 ? "neg-diff" : ""}">${gp ? diffStr : "—"}</td>
      </tr>`;
    }).join("");
}

// ─── Page: Teams ─────────────────────────────────────────────────────────────

function renderTeams() {
    const container = document.getElementById("teams-container");
    if (!container) return;

    const allStats = derivePlayerStats();

    const unassigned = players.filter(p => !teams.some(t => t.playerIds.includes(p.id)));

    container.innerHTML = teams.map(team => {
        const roster = team.playerIds.length
            ? team.playerIds.map(id => getPlayer(id)).filter(Boolean)
            : [];

        let rosterHtml = "";
        if (roster.length) {
            rosterHtml = `
        <table class="roster-table">
          <thead><tr><th>Player</th><th>GP</th><th>PPG</th><th>RPG</th><th>APG</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead>
          <tbody>
            ${roster.map(p => {
                const s = allStats.find(x => x.playerId === p.id) || { gamesPlayed: 0, totalPoints: 0, totalRebounds: 0, totalAssists: 0 };
                return `<tr>
                <td class="player-name">${p.name}</td>
                <td>${s.gamesPlayed}</td>
                <td>${avg(s.totalPoints,   s.gamesPlayed)}</td>
                <td>${avg(s.totalRebounds, s.gamesPlayed)}</td>
                <td>${avg(s.totalAssists,  s.gamesPlayed)}</td>
                <td>${s.totalPoints}</td>
                <td>${s.totalRebounds}</td>
                <td>${s.totalAssists}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>`;
        } else {
            rosterHtml = `<p class="empty-state">Roster not yet finalized.</p>`;
        }

        return `
      <div class="team-card">
        <h2 class="team-card-title">${team.name}</h2>
        ${rosterHtml}
      </div>`;
    }).join("");

    if (unassigned.length) {
        container.innerHTML += `
      <div class="team-card unassigned-card">
        <h2 class="team-card-title unassigned-title">Free Agents <span class="unassigned-count">${unassigned.length}</span></h2>
        <table class="roster-table">
          <thead><tr><th>Player</th></tr></thead>
          <tbody>
            ${unassigned.map(p => `<tr><td class="player-name">${p.name}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    }
}

// ─── Page: Stats / Box Scores ────────────────────────────────────────────────

function renderStats() {
    const container = document.getElementById("stats-container");
    if (!container) return;

    // Check for ?game=gN to show a specific box score
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");

    if (gameId) {
        renderBoxScore(gameId, container);
    } else {
        renderStatsLeaders(container);
    }
}

function renderBoxScore(gameId, container) {
    const game = games.find(g => g.id === gameId);
    if (!game || !isPlayed(game)) {
        container.innerHTML = `<p class="empty-state">Box score not available.</p>`;
        return;
    }

    const home = getTeam(game.home);
    const away = getTeam(game.away);
    const homeWin = game.homeScore > game.awayScore;

    const homeStats = game.playerStats.filter(ps => home.playerIds.includes(ps.playerId));
    const awayStats = game.playerStats.filter(ps => away.playerIds.includes(ps.playerId));

    function buildTable(teamObj, statsArr) {
        if (!statsArr.length) return `<p class="empty-state">No stats recorded.</p>`;
        return `
      <table class="roster-table">
        <thead><tr><th>Player</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead>
        <tbody>
          ${statsArr.map(ps => {
            const p = getPlayer(ps.playerId);
            return `<tr>
              <td class="player-name">${p ? p.name : ps.playerId}</td>
              <td>${ps.points ?? 0}</td>
              <td>${ps.rebounds ?? 0}</td>
              <td>${ps.assists ?? 0}</td>
            </tr>`;
        }).join("")}
        </tbody>
      </table>`;
    }

    container.innerHTML = `
    <a href="stats.html" class="back-link">← All Stats</a>
    <div class="box-score-header">
      <div class="bs-team ${homeWin ? "bs-winner" : ""}">
        <div class="bs-team-name">${home.name}</div>
        <div class="bs-score">${game.homeScore}</div>
      </div>
      <div class="bs-date">${formatDate(game.date)}</div>
      <div class="bs-team ${!homeWin ? "bs-winner" : ""}">
        <div class="bs-team-name">${away.name}</div>
        <div class="bs-score">${game.awayScore}</div>
      </div>
    </div>
    <h3 class="box-team-label">${home.name}</h3>
    ${buildTable(home, homeStats)}
    <h3 class="box-team-label">${away.name}</h3>
    ${buildTable(away, awayStats)}
  `;
}

function renderStatsLeaders(container) {
    const allStats = derivePlayerStats().filter(s => s.gamesPlayed > 0);

    if (!allStats.length) {
        container.innerHTML = `<p class="empty-state">No stats yet — check back after the first game!</p>`;
        return;
    }

    const byPPG = [...allStats].sort((a, b) => (b.totalPoints / b.gamesPlayed) - (a.totalPoints / a.gamesPlayed));
    const byRPG = [...allStats].sort((a, b) => (b.totalRebounds / b.gamesPlayed) - (a.totalRebounds / a.gamesPlayed));
    const byAPG = [...allStats].sort((a, b) => (b.totalAssists / b.gamesPlayed) - (a.totalAssists / a.gamesPlayed));

    function leaderTable(label, sorted, totalKey) {
        return `
      <div class="leaders-block">
        <h3 class="leaders-title">${label}</h3>
        <table class="roster-table">
          <thead><tr><th>Player</th><th>GP</th><th>${label}</th><th>Total</th></tr></thead>
          <tbody>
            ${sorted.slice(0, 5).map((s, i) => `
              <tr class="${i === 0 ? "leader-row" : ""}">
                <td class="player-name">${s.name}</td>
                <td>${s.gamesPlayed}</td>
                <td>${avg(s[totalKey], s.gamesPlayed)}</td>
                <td>${s[totalKey]}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    }

    // Full season stats table
    const allSorted = [...allStats].sort((a, b) => (b.totalPoints / b.gamesPlayed) - (a.totalPoints / a.gamesPlayed));
    const fullTable = `
    <div class="leaders-block full-width">
      <h3 class="leaders-title">All Players</h3>
      <table class="roster-table">
        <thead><tr><th>Player</th><th>GP</th><th>PPG</th><th>RPG</th><th>APG</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead>
        <tbody>
          ${allSorted.map(s => `<tr>
            <td class="player-name">${s.name}</td>
            <td>${s.gamesPlayed}</td>
            <td>${avg(s.totalPoints,   s.gamesPlayed)}</td>
            <td>${avg(s.totalRebounds, s.gamesPlayed)}</td>
            <td>${avg(s.totalAssists,  s.gamesPlayed)}</td>
            <td>${s.totalPoints}</td>
            <td>${s.totalRebounds}</td>
            <td>${s.totalAssists}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`;

    // Recent box scores list
    const playedGames = games.filter(isPlayed).sort((a, b) => new Date(b.date) - new Date(a.date));
    const boxScoreLinks = playedGames.length ? `
    <div class="leaders-block full-width">
      <h3 class="leaders-title">Box Scores</h3>
      <div class="box-score-list">
        ${playedGames.map(g => {
        const home = getTeam(g.home);
        const away = getTeam(g.away);
        const homeWin = g.homeScore > g.awayScore;
        return `
            <a href="stats.html?game=${g.id}" class="box-score-item">
              <span class="bsi-date">${formatDate(g.date)}</span>
              <span class="bsi-matchup">
                <span class="${homeWin ? "bsi-winner" : ""}">${home.name} ${g.homeScore}</span>
                <span class="bsi-sep">–</span>
                <span class="${!homeWin ? "bsi-winner" : ""}">${g.awayScore} ${away.name}</span>
              </span>
              <span class="bsi-arrow">→</span>
            </a>`;
    }).join("")}
      </div>
    </div>` : "";

    container.innerHTML = `
    <div class="leaders-grid">
      ${leaderTable("PPG", byPPG, "totalPoints")}
      ${leaderTable("RPG", byRPG, "totalRebounds")}
      ${leaderTable("APG", byAPG, "totalAssists")}
      ${fullTable}
      ${boxScoreLinks}
    </div>`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    // Set league name everywhere
    document.querySelectorAll(".league-name").forEach(el => el.textContent = league.name);
    document.querySelectorAll(".league-abbr").forEach(el => el.textContent = league.abbr);
    document.querySelectorAll(".league-season").forEach(el => el.textContent = league.season);
    document.querySelectorAll(".league-tagline").forEach(el => el.textContent = league.tagline);

    // Highlight active nav link
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("href") === path) link.classList.add("active");
    });

    // Render the correct page
    renderAbout();
    renderSchedule();
    renderStandings();
    renderTeams();
    renderStats();
});
