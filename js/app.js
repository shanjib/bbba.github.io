// ─── Season Resolution ────────────────────────────────────────────────────────

// Pages that support season switching via ?season= param
const SEASON_AWARE_PAGES = ["standings.html", "stats.html", "teams.html"];

function getActiveSeason() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("season");
    if (requested && seasons[requested]) return requested;
    return config.currentSeason;
}

function getSeasonData(seasonKey) {
    return seasons[seasonKey] || null;
}

function setSeasonParam(seasonKey) {
    const url = new URL(window.location.href);
    url.searchParams.set("season", seasonKey);
    window.history.pushState({}, "", url);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlayer(id) {
    return players.find(p => p.id === id) || null;
}

function getTeam(id, seasonKey) {
    const data = getSeasonData(seasonKey);
    if (!data) return null;
    return data.teams.find(t => t.id === id) || null;
}

function isPlayed(game) {
    return game.homeScore !== null && game.awayScore !== null;
}

function formatDate(dateStr) {
    if (!dateStr) return "TBD";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function avg(total, gp) {
    if (!gp) return "0.0";
    return (total / gp).toFixed(1);
}

function currentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
}

// ─── Season Switcher ──────────────────────────────────────────────────────────

function renderSeasonSwitcher(activeSeason) {
    const el = document.getElementById("season-switcher");
    if (!el) return;

    if (config.seasons.length <= 1) {
        el.style.display = "none";
        return;
    }

    el.innerHTML = `
    <label class="switcher-label" for="season-select">Season</label>
    <select id="season-select" class="season-select">
      ${config.seasons.slice().reverse().map(s => `
        <option value="${s}" ${s === activeSeason ? "selected" : ""}>${s}</option>
      `).join("")}
    </select>`;

    document.getElementById("season-select").addEventListener("change", (e) => {
        setSeasonParam(e.target.value);
        renderPage(e.target.value);
        document.querySelectorAll(".current-season-label").forEach(el => el.textContent = e.target.value);
    });
}

// ─── Standings Derivation ─────────────────────────────────────────────────────

function deriveStandings(seasonKey) {
    const data = getSeasonData(seasonKey);
    if (!data) return [];

    const map = {};
    data.teams.forEach(t => {
        map[t.id] = {
            teamId: t.id,
            name: t.name,
            wins: 0,
            losses: 0,
            pointsScored: 0,
            pointsAllowed: 0,
            h2h: {}
        };
        data.teams.forEach(other => {
            if (other.id !== t.id) map[t.id].h2h[other.id] = { wins: 0, pointDiff: 0 };
        });
    });

    data.games.filter(isPlayed).forEach(g => {
        const home = map[g.home];
        const away = map[g.away];
        if (!home || !away) return;
        const diff = g.homeScore - g.awayScore;

        home.pointsScored  += g.homeScore;
        home.pointsAllowed += g.awayScore;
        away.pointsScored  += g.awayScore;
        away.pointsAllowed += g.homeScore;

        if (g.homeScore > g.awayScore) {
            home.wins++; away.losses++;
            home.h2h[g.away].wins++;
        } else {
            away.wins++; home.losses++;
            away.h2h[g.home].wins++;
        }

        home.h2h[g.away].pointDiff += diff;
        away.h2h[g.home].pointDiff -= diff;
    });

    return Object.values(map).sort((a, b) => {
        const aGP = a.wins + a.losses, bGP = b.wins + b.losses;
        const aWP = aGP ? a.wins / aGP : 0, bWP = bGP ? b.wins / bGP : 0;
        if (bWP !== aWP) return bWP - aWP;
        const aH2H = a.h2h[b.teamId]?.wins ?? 0, bH2H = b.h2h[a.teamId]?.wins ?? 0;
        if (bH2H !== aH2H) return bH2H - aH2H;
        const aHD = a.h2h[b.teamId]?.pointDiff ?? 0, bHD = b.h2h[a.teamId]?.pointDiff ?? 0;
        if (bHD !== aHD) return bHD - aHD;
        return (b.pointsScored - b.pointsAllowed) - (a.pointsScored - a.pointsAllowed);
    });
}

// ─── Player Stats Derivation ──────────────────────────────────────────────────

function deriveSeasonStats(seasonKey) {
    const data = getSeasonData(seasonKey);
    if (!data) return [];

    const map = {};
    players.forEach(p => {
        map[p.id] = { playerId: p.id, name: p.name, gamesPlayed: 0, totalPoints: 0, totalRebounds: 0, totalAssists: 0 };
    });

    data.games.filter(isPlayed).forEach(g => {
        g.playerStats.forEach(ps => {
            if (!map[ps.playerId]) return;
            map[ps.playerId].gamesPlayed++;
            map[ps.playerId].totalPoints   += ps.points   ?? 0;
            map[ps.playerId].totalRebounds += ps.rebounds ?? 0;
            map[ps.playerId].totalAssists  += ps.assists  ?? 0;
        });
    });

    return Object.values(map);
}

function deriveCareerStats() {
    const map = {};
    players.forEach(p => {
        map[p.id] = { playerId: p.id, name: p.name, seasonsPlayed: [], gamesPlayed: 0, totalPoints: 0, totalRebounds: 0, totalAssists: 0 };
    });

    config.seasons.forEach(seasonKey => {
        const data = getSeasonData(seasonKey);
        if (!data) return;

        // track per-season game counts to detect if player appeared this season
        const seasonGP = {};

        data.games.filter(isPlayed).forEach(g => {
            g.playerStats.forEach(ps => {
                if (!map[ps.playerId]) return;
                if (!seasonGP[ps.playerId]) seasonGP[ps.playerId] = 0;
                seasonGP[ps.playerId]++;
                map[ps.playerId].gamesPlayed++;
                map[ps.playerId].totalPoints   += ps.points   ?? 0;
                map[ps.playerId].totalRebounds += ps.rebounds ?? 0;
                map[ps.playerId].totalAssists  += ps.assists  ?? 0;
            });
        });

        Object.keys(seasonGP).forEach(pid => {
            if (!map[pid].seasonsPlayed.includes(seasonKey)) {
                map[pid].seasonsPlayed.push(seasonKey);
            }
        });
    });

    return Object.values(map).filter(p => p.gamesPlayed > 0);
}

// ─── Partials ─────────────────────────────────────────────────────────────────

// Derive the base URL from the app.js script tag itself.
// This is always correct regardless of repo name or subdirectory depth,
// because partials/ sits right next to app.js inside js/.
function getBasePath() {
    // Walk all script tags and find the one ending in app.js
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const appScript = scripts.find(s => s.src.endsWith("app.js") || s.src.includes("app.js"));
    if (appScript) {
        // appScript.src is always a fully resolved absolute URL e.g.
        // "https://user.github.io/repo/js/app.js"
        // Strip the filename to get the directory.
        return appScript.src.substring(0, appScript.src.lastIndexOf("/") + 1);
    }
    // Should never reach here, but log loudly if we do
    console.error("BBBA: could not find app.js script tag — path resolution failed.");
    return "./js/";
}

async function loadPartials() {
    const base = getBasePath();

    const [headerHTML, footerHTML] = await Promise.all([
        fetch(`${base}partials/header.html`).then(r => r.text()),
        fetch(`${base}partials/footer.html`).then(r => r.text()),
    ]);

    const headerEl = document.getElementById("site-header-placeholder");
    const footerEl = document.getElementById("site-footer-placeholder");
    if (headerEl) headerEl.outerHTML = headerHTML;
    if (footerEl) footerEl.outerHTML = footerHTML;
}

// ─── Page: About ──────────────────────────────────────────────────────────────

function renderAbout() {
    const el = document.getElementById("about-text");
    if (el) el.textContent = config.league.about;

    const taglineEl = document.querySelector(".league-tagline");
    if (taglineEl) taglineEl.textContent = config.league.tagline;

    const currentData = getSeasonData(config.currentSeason);
    const played = currentData ? currentData.games.filter(isPlayed).length : 0;
    const total  = currentData ? currentData.games.length : 0;

    const statsEl = document.getElementById("league-quick-stats");
    if (statsEl) {
        statsEl.innerHTML = `
      <div class="quick-stat"><span class="qs-num">${currentData ? currentData.teams.length : 0}</span><span class="qs-label">Teams</span></div>
      <div class="quick-stat"><span class="qs-num">${players.length}</span><span class="qs-label">Players</span></div>
      <div class="quick-stat"><span class="qs-num">${played}</span><span class="qs-label">Games Played</span></div>
      <div class="quick-stat"><span class="qs-num">${total - played}</span><span class="qs-label">Games Remaining</span></div>
    `;
    }
}

// ─── Page: Schedule ───────────────────────────────────────────────────────────

function renderSchedule() {
    const container = document.getElementById("schedule-container");
    if (!container) return;

    // Schedule always shows current season
    const data = getSeasonData(config.currentSeason);
    if (!data) { container.innerHTML = `<p class="empty-state">No schedule data found.</p>`; return; }

    const played   = data.games.filter(isPlayed).sort((a, b) => new Date(b.date) - new Date(a.date));
    const upcoming = data.games.filter(g => !isPlayed(g));

    let html = "";

    if (played.length) {
        html += `<h2 class="section-subheading">Completed Games</h2>`;
        played.forEach(g => {
            const home = getTeam(g.home, config.currentSeason);
            const away = getTeam(g.away, config.currentSeason);
            const homeWin = g.homeScore > g.awayScore;
            html += `
        <div class="game-card completed">
          <div class="game-date">${formatDate(g.date)}</div>
          <div class="game-matchup">
            <span class="team-name ${homeWin ? "winner" : ""}">${home?.name ?? g.home}</span>
            <span class="score-block">
              <span class="${homeWin ? "score-win" : "score-loss"}">${g.homeScore}</span>
              <span class="score-sep">–</span>
              <span class="${!homeWin ? "score-win" : "score-loss"}">${g.awayScore}</span>
            </span>
            <span class="team-name ${!homeWin ? "winner" : ""}">${away?.name ?? g.away}</span>
          </div>
          <a class="box-score-link" href="stats.html?game=${g.id}">Box Score →</a>
        </div>`;
        });
    }

    if (upcoming.length) {
        html += `<h2 class="section-subheading">Upcoming Games</h2>`;
        upcoming.forEach(g => {
            const home = getTeam(g.home, config.currentSeason);
            const away = getTeam(g.away, config.currentSeason);
            html += `
        <div class="game-card upcoming">
          <div class="game-date">${formatDate(g.date)}</div>
          <div class="game-matchup">
            <span class="team-name">${home?.name ?? g.home}</span>
            <span class="vs-badge">VS</span>
            <span class="team-name">${away?.name ?? g.away}</span>
          </div>
        </div>`;
        });
    }

    if (!html) html = `<p class="empty-state">No games scheduled yet. Check back soon!</p>`;
    container.innerHTML = html;
}

// ─── Page: Standings ──────────────────────────────────────────────────────────

function renderStandings(seasonKey) {
    const tbody = document.getElementById("standings-body");
    if (!tbody) return;

    const standings = deriveStandings(seasonKey);
    if (!standings.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No data yet.</td></tr>`;
        return;
    }

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

// ─── Page: Teams ──────────────────────────────────────────────────────────────

function renderTeams(seasonKey) {
    const container = document.getElementById("teams-container");
    if (!container) return;

    const data = getSeasonData(seasonKey);
    if (!data) { container.innerHTML = `<p class="empty-state">No data for this season.</p>`; return; }

    const allStats = deriveSeasonStats(seasonKey);

    const unassigned = players.filter(p => !data.teams.some(t => t.playerIds.includes(p.id)));

    container.innerHTML = data.teams.map(team => {
        const roster = team.playerIds.map(id => getPlayer(id)).filter(Boolean);

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
        <h2 class="team-card-title unassigned-title">
          Unassigned Players <span class="unassigned-count">${unassigned.length}</span>
        </h2>
        <table class="roster-table">
          <thead><tr><th>Player</th></tr></thead>
          <tbody>${unassigned.map(p => `<tr><td class="player-name">${p.name}</td></tr>`).join("")}</tbody>
        </table>
      </div>`;
    }
}

// ─── Page: Stats ──────────────────────────────────────────────────────────────

function renderStats(seasonKey) {
    const container = document.getElementById("stats-container");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");

    if (gameId) {
        renderBoxScore(gameId, container);
    } else {
        renderStatsLeaders(seasonKey, container);
    }
}

function renderBoxScore(gameId, container) {
    // Find game across all seasons
    let game = null, seasonKey = null;
    for (const sk of config.seasons) {
        const found = getSeasonData(sk)?.games.find(g => g.id === gameId);
        if (found) { game = found; seasonKey = sk; break; }
    }

    if (!game || !isPlayed(game)) {
        container.innerHTML = `<p class="empty-state">Box score not available.</p>`;
        return;
    }

    const home    = getTeam(game.home, seasonKey);
    const away    = getTeam(game.away, seasonKey);
    const homeWin = game.homeScore > game.awayScore;

    const homeStats = game.playerStats.filter(ps => home?.playerIds.includes(ps.playerId));
    const awayStats = game.playerStats.filter(ps => away?.playerIds.includes(ps.playerId));

    function buildTable(statsArr) {
        if (!statsArr.length) return `<p class="empty-state">No stats recorded.</p>`;
        return `
      <table class="roster-table">
        <thead><tr><th>Player</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead>
        <tbody>
          ${statsArr.map(ps => {
            const p = getPlayer(ps.playerId);
            return `<tr>
              <td class="player-name">${p ? p.name : ps.playerId}</td>
              <td>${ps.points   ?? 0}</td>
              <td>${ps.rebounds ?? 0}</td>
              <td>${ps.assists  ?? 0}</td>
            </tr>`;
        }).join("")}
        </tbody>
      </table>`;
    }

    container.innerHTML = `
    <a href="stats.html" class="back-link">← All Stats</a>
    <div class="box-score-header">
      <div class="bs-team ${homeWin ? "bs-winner" : ""}">
        <div class="bs-team-name">${home?.name ?? game.home}</div>
        <div class="bs-score">${game.homeScore}</div>
      </div>
      <div class="bs-date">${formatDate(game.date)}<br><span style="font-size:11px;opacity:.7">${seasonKey} Season</span></div>
      <div class="bs-team ${!homeWin ? "bs-winner" : ""}">
        <div class="bs-team-name">${away?.name ?? game.away}</div>
        <div class="bs-score">${game.awayScore}</div>
      </div>
    </div>
    <h3 class="box-team-label">${home?.name ?? game.home}</h3>
    ${buildTable(homeStats)}
    <h3 class="box-team-label">${away?.name ?? game.away}</h3>
    ${buildTable(awayStats)}
  `;
}

function renderStatsLeaders(seasonKey, container) {
    const allStats    = deriveSeasonStats(seasonKey).filter(s => s.gamesPlayed > 0);
    const careerStats = deriveCareerStats();
    const data        = getSeasonData(seasonKey);

    let html = "";

    // ── Season leaders ──
    if (allStats.length) {
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

        html += `<div class="stats-section-heading">Season Leaders</div>`;
        html += `<div class="leaders-grid">`;
        html += leaderTable("PPG", byPPG, "totalPoints");
        html += leaderTable("RPG", byRPG, "totalRebounds");
        html += leaderTable("APG", byAPG, "totalAssists");

        // Full season table
        const allSorted = [...allStats].sort((a, b) => (b.totalPoints / b.gamesPlayed) - (a.totalPoints / a.gamesPlayed));
        html += `
      <div class="leaders-block full-width">
        <h3 class="leaders-title">All Players — ${seasonKey} Season</h3>
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
        html += `</div>`; // end leaders-grid
    } else {
        html += `<p class="empty-state">No stats yet — check back after the first game!</p>`;
    }

    // ── Career stats ── (always shown, across all seasons)
    if (careerStats.length) {
        const careerSorted = [...careerStats].sort((a, b) => (b.totalPoints / b.gamesPlayed) - (a.totalPoints / a.gamesPlayed));
        html += `<div class="stats-section-heading" style="margin-top:48px;">Career Stats</div>`;
        html += `<div class="leaders-grid">
      <div class="leaders-block full-width">
        <h3 class="leaders-title">All-Time Career Stats</h3>
        <table class="roster-table">
          <thead><tr><th>Player</th><th>Seasons</th><th>GP</th><th>PPG</th><th>RPG</th><th>APG</th><th>PTS</th><th>REB</th><th>AST</th></tr></thead>
          <tbody>
            ${careerSorted.map(s => `<tr>
              <td class="player-name">${s.name}</td>
              <td>${s.seasonsPlayed.join(", ")}</td>
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
      </div>
    </div>`;
    }

    // ── Box score links ──
    if (data) {
        const playedGames = data.games.filter(isPlayed).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (playedGames.length) {
            html += `<div class="stats-section-heading" style="margin-top:48px;">Box Scores</div>`;
            html += `<div class="leaders-grid"><div class="leaders-block full-width">
        <h3 class="leaders-title">${seasonKey} Season</h3>
        <div class="box-score-list">
          ${playedGames.map(g => {
                const home = getTeam(g.home, seasonKey);
                const away = getTeam(g.away, seasonKey);
                const homeWin = g.homeScore > g.awayScore;
                return `
              <a href="stats.html?game=${g.id}" class="box-score-item">
                <span class="bsi-date">${formatDate(g.date)}</span>
                <span class="bsi-matchup">
                  <span class="${homeWin ? "bsi-winner" : ""}">${home?.name ?? g.home} ${g.homeScore}</span>
                  <span class="bsi-sep">–</span>
                  <span class="${!homeWin ? "bsi-winner" : ""}">${g.awayScore} ${away?.name ?? g.away}</span>
                </span>
                <span class="bsi-arrow">→</span>
              </a>`;
            }).join("")}
        </div>
      </div></div>`;
        }
    }

    container.innerHTML = html;
}

// ─── Page Dispatcher ──────────────────────────────────────────────────────────

function renderPage(seasonKey) {
    renderAbout();
    renderSchedule();
    renderStandings(seasonKey);
    renderTeams(seasonKey);
    renderStats(seasonKey);
}

// ─── Season Script Loader ────────────────────────────────────────────────────

async function loadSeasonScripts() {
    const base = getBasePath();
    for (const season of config.seasons) {
        await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = `${base}data/season-${season}.js`;
            script.onload = resolve;
            script.onerror = () => {
                console.warn(`BBBA: could not load season-${season}.js — skipping.`);
                resolve(); // resolve anyway so init continues
            };
            document.head.appendChild(script);
        });
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
    // Dynamically load all season scripts from config.seasons, then partials
    await loadSeasonScripts();
    await loadPartials();

    const activeSeason = getActiveSeason();

    // Highlight active nav link
    const page = currentPage();
    document.querySelectorAll(".nav-link").forEach(link => {
        const linkPage = link.getAttribute("href").split("/").pop();
        if (linkPage === page) link.classList.add("active");
    });

    // Hamburger menu toggle
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const siteNav      = document.getElementById("site-nav");
    if (hamburgerBtn && siteNav) {
        hamburgerBtn.addEventListener("click", () => {
            const isOpen = siteNav.classList.toggle("nav-open");
            hamburgerBtn.classList.toggle("is-active", isOpen);
            hamburgerBtn.setAttribute("aria-expanded", isOpen);
        });

        // Close menu when a nav link is tapped
        siteNav.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                siteNav.classList.remove("nav-open");
                hamburgerBtn.classList.remove("is-active");
                hamburgerBtn.setAttribute("aria-expanded", false);
            });
        });

        // Close menu when tapping outside the header
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".site-header")) {
                siteNav.classList.remove("nav-open");
                hamburgerBtn.classList.remove("is-active");
                hamburgerBtn.setAttribute("aria-expanded", false);
            }
        });
    }

    // Populate season labels
    document.querySelectorAll(".current-season-label").forEach(el => el.textContent = activeSeason);

    // Render season switcher on aware pages
    renderSeasonSwitcher(activeSeason);

    // Render the page
    renderPage(activeSeason);
});
