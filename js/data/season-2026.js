// Season 2026 — teams and games.
// - To finalize rosters, add player IDs to each team's playerIds array.
// - To add a new player to a team, add them to players.js first, then add their ID here.
// - To record a completed game, fill in: date, homeScore, awayScore, and playerStats.
//
// playerStats example:
//   { playerId: "p1", points: 14, rebounds: 5, assists: 3 }
//
// Scoring is 1s and 2s:
//   1 point = inside the arc, 2 points = beyond the arc

// seasons is declared as a var so each season file can safely spread the previous state
// regardless of load order. Never rename this variable.
var seasons = {
  ...( typeof seasons !== "undefined" ? seasons : {} ),
  "2026": {
    teams: [
        {id: "team-a", name: "The Cuties", playerIds: ["p2", "p12", "p7", "p21", "p19", "p24"]},
        {id: "team-b", name: "Team Igoudala", playerIds: ["p8", "p1", "p13", "p16", "p17", "p4"]},
        {id: "team-c", name: "Team C", playerIds: ["p3", "p18", "p20", "p11", "p10", "p23"]},
        {id: "team-d", name: "Team D", playerIds: ["p6", "p14", "p9", "p15", "p5", "p22"]},
    ],
    games: [
      // --- Matchup cycle 1 ---
      {
        id: "2026-g1",
        date: null,
        home: "team-a", away: "team-b",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g2",
        date: null,
        home: "team-c", away: "team-d",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g3",
        date: null,
        home: "team-a", away: "team-c",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g4",
        date: null,
        home: "team-b", away: "team-d",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g5",
        date: null,
        home: "team-a", away: "team-d",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g6",
        date: null,
        home: "team-b", away: "team-c",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      // --- Matchup cycle 2 ---
      {
        id: "2026-g7",
        date: null,
        home: "team-b", away: "team-a",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g8",
        date: null,
        home: "team-d", away: "team-c",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g9",
        date: null,
        home: "team-c", away: "team-a",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g10",
        date: null,
        home: "team-d", away: "team-b",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g11",
        date: null,
        home: "team-d", away: "team-a",
        homeScore: null, awayScore: null,
        playerStats: []
      },
      {
        id: "2026-g12",
        date: null,
        home: "team-c", away: "team-b",
        homeScore: null, awayScore: null,
        playerStats: []
      },
    ]
  }
};
