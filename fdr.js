// Install dependencies first:
// npm install node-fetch fs

const fetch = require('node-fetch');
const fs = require('fs');

// Calculate team strength dynamically from league standings
function calculateTeamStrength(standings) {
  const strengths = {};
  standings.forEach(team => {
    const position = team.position;
    const pointsPerGame = team.points / team.playedGames;

    // Normalize strength on a 1–5 scale
    let strength = 5 - Math.floor((position - 1) / 4); // top 4 = 5, next 4 = 4, etc.
    if (pointsPerGame > 2) strength = 5;
    if (pointsPerGame < 1) strength = 1;

    strengths[team.team.name] = strength;
  });
  return strengths;
}

// Simple FDR calculation
function calculateFDR(home, away, teamStrength) {
  const homeStrength = teamStrength[home] || 2;
  const awayStrength = teamStrength[away] || 2;

  return {
    homeFDR: Math.max(1, Math.min(5, 6 - awayStrength)),
    awayFDR: Math.max(1, Math.min(5, 6 - homeStrength))
  };
}

// Fetch standings and fixtures from Football-Data.org
async function getFDR() {
  try {
    // Fetch league standings
    const standingsRes = await fetch('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: { 'X-Auth-Token': '940c51fde31a45eba0adac87fa3fd87f' } // replace with your free API key
    });
    const standingsData = await standingsRes.json();
    const teamStrength = calculateTeamStrength(standingsData.standings[0].table);

    // Fetch fixtures
    const fixturesRes = await fetch('https://api.football-data.org/v4/competitions/PL/matches', {
      headers: { 'X-Auth-Token': '940c51fde31a45eba0adac87fa3fd87f' }
    });
    const fixturesData = await fixturesRes.json();

    const today = new Date();

    // Filter fixtures to only include current date onwards
    const upcomingFixtures = fixturesData.matches.filter(match => {
      const matchDate = new Date(match.utcDate);
      return matchDate >= today;
    });

    // Build FDR dataset
    const fdrData = upcomingFixtures.map(match => {
      const home = match.homeTeam.name;
      const away = match.awayTeam.name;
      return {
        fixture: `${home} vs ${away}`,
        date: match.utcDate,
        difficulty: calculateFDR(home, away, teamStrength)
      };
    });

    fs.writeFileSync('fdr.json', JSON.stringify(fdrData, null, 2));
    console.log("Upcoming FDR data saved to fdr.json");
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}

getFDR();
