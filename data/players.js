// data/players.js
const playersData = {
    "Blazers": [
        {
            id: 1,
            name: "Himetetjua Katjivena",
            number: "#11",
            position: "Middle Blocker",
            category: "Blazers",
            image: "assets/players/player5.webp",
            status: "Captain",
            execRole: "Kit Manager"
        },
        {
            id: 2,
            name: "Shawn Ncube",
            number: "#07",
            position: "Libero",
            category: "Blazers",
            image: "assets/placeholder_m.webp",
            status: "Vice Captain",
            execRole: null
        },
        {
            id: 3,
            name: "Herbert Jantjies",
            number: "#01",
            position: "Outside Hitter",
            category: "Blazers",
            image: "assets/players/player1.webp",
            status: null,
            execRole: null
        },
        {
            id: 4,
            name: "Nody Hamukoto",
            number: "#05",
            position: "Middle Blocker",
            category: "Blazers",
            image: "assets/players/player3.jpg",
            status: null,
            execRole: "Chairperson"
        },
        {
            id: 8,
            name: "Tulonga Indongo",
            number: "#04",
            position: "Libero",
            category: "Blazers",
            image: "assets/players/player2.webp",
            status: null,
            execRole: null
        }
    ],
    "Falcons": [
        {
            id: 5,
            name: "Wetuthiapi Tjilumbu",
            number: "#2",
            position: "Setter",
            category: "Falcons",
            image: "assets/placeholder_m.webp",
            status: "Captain",
            execRole: null
        },
        {
            id: 6,
            name: "Adebayor Fillemon",
            number: "#10",
            position: "Opposite Hitter",
            category: "Falcons",
            image: "assets/placeholder_m.webp",
            status: "Vice Captain",
            execRole: null
        },
        {
            id: 7,
            name: "Motjari Kuruuo",
            number: "#08",
            position: "Middle Blocker",
            category: "Falcons",
            image: "assets/players/player4.webp",
            status: null,
            execRole: "Equipment Manager"
        },
    ],
    "Females": [
        {
            id: 9,
            name: "Blessing Barandongo",
            number: "#15",
            position: "Middle Blocker",
            category: "Elites",
            image: "assets/placeholder.webp",
            status: "Captain",
            execRole: null
        },
        {
            id: 10,
            name: "Unotjari Mauha",
            number: "#07",
            position: "Setter",
            category: "Elites",
            image: "assets/placeholder.webp",
            status: "Vice Captain",
            execRole: null
        },
        {
            id: 11,
            name: "Esther Maiba",
            number: "#03",
            position: "Outside Hitter",
            category: "Elites",
            image: "assets/executives/secretary.webp",
            status: null,
            execRole: "Secretary"
        },
        {
            id: 12,
            name: "Dorothy Nambahu",
            number: "#04",
            position: "Setter",
            category: "Elites",
            image: "assets/executives/treasurer.webp",
            status: null,
            execRole: "Treasurer"
        }
    ]
};

// data/leadership.js
const leadershipData = {
    "BLAZERS": {
        captain: "Himeetjua Katjivena",
        viceCaptain: "Shawn Ncube"
    },
    "FALCONS": {
        captain: "Wetuthiapi Tjilumbu",
        viceCaptain: "Adebayor Fillemon"
    },
    "FEMALES": {
        captain: "Blessing Barandongo",
        viceCaptain: "Unotjari Mauha"
    }
};