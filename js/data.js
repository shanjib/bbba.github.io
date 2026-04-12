const league = {
    name: "Boston Bengali Basketball Association",
    abbr: "BBBA",
    season: "2026",
    tagline: "Hoops, Heart & Heritage",
    about: "The Boston Bengali Basketball Association (BBBA) is a community basketball league founded by and for the Bengali community of Boston. We bring together players of all skill levels for a season of competitive but friendly basketball. Whether you're a seasoned baller or just getting back on the court, BBBA is about community, competition, and having a great time."
};

const players = [
    {id: "p1", name: "Istiaque Shanjib"},
    {id: "p2", name: "Wasif Shawman"},
    {id: "p3", name: "Mashuk Rahman"},
    {id: "p4", name: "Arefin Mohiuddin"},
    {id: "p5", name: "Fardin Islam"},
    {id: "p6", name: "Iram Islam"},
    {id: "p7", name: "Afsa Nafe"},
    {id: "p8", name: "Abrar Jalal"},
    {id: "p9", name: "Shihab Chowdhury"},
    {id: "p10", name: "Shadman Chowdhury"},
    {id: "p11", name: "Rezwan Islam"},
    {id: "p12", name: "Shakib Idris"},
    {id: "p13", name: "Owasif Rahman"},
    {id: "p14", name: "Owalid Rahman"},
    {id: "p15", name: "Tayseer Chowdhury"},
    {id: "p16", name: "Sazed Aftab"},
    {id: "p17", name: "Farhan Ahmed"},
    {id: "p18", name: "Eric Ninthala"},
];

const teams = [
    {id: "team-a", name: "Team A", playerIds: ["p1"]},
    {id: "team-b", name: "Team B", playerIds: []},
    {id: "team-c", name: "Team C", playerIds: []},
    {id: "team-d", name: "Team D", playerIds: []},
];

// Games: 12 total (each of 6 matchups played twice)
// To record a completed game, fill in: date, homeScore, awayScore, and playerStats
// playerStats example:
//   { playerId: "p1", points: 14, rebounds: 5, assists: 3 }
const games = [
    // --- Matchup cycle 1 ---
    {
        id: "g1",
        // date: "2026-04-12",
        date: null,
        home: "team-a",
        away: "team-b",
        homeScore: null,
        awayScore: null,
        playerStats: [

            // { playerId: "p1", points: 14, rebounds: 5, assists: 3 },
            // { playerId: "p2", points: 14, rebounds: 5, assists: 3 }
        ]
    },
    {
        id: "g2",
        date: null,
        home: "team-c",
        away: "team-d",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    {
        id: "g3",
        date: null,
        home: "team-a",
        away: "team-c",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    {
        id: "g4",
        date: null,
        home: "team-b",
        away: "team-d",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    {
        id: "g5",
        date: null,
        home: "team-a",
        away: "team-d",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    {
        id: "g6",
        date: null,
        home: "team-b",
        away: "team-c",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    // --- Matchup cycle 2 ---
    {
        id: "g7",
        date: null,
        home: "team-b",
        away: "team-a",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    {
        id: "g8",
        date: null,
        home: "team-d",
        away: "team-c",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    {
        id: "g9",
        date: null,
        home: "team-c",
        away: "team-a",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    {
        id: "g10",
        date: null,
        home: "team-d",
        away: "team-b",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    {
        id: "g11",
        date: null,
        home: "team-d",
        away: "team-a",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
    {
        id: "g12",
        date: null,
        home: "team-c",
        away: "team-b",
        homeScore: null,
        awayScore: null,
        playerStats: []
    },
];
