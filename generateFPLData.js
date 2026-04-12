const fs = require('fs');
const fetch = require('node-fetch');

const apiURL = 'https://fantasy.premierleague.com/api/bootstrap-static/';

fetch(apiURL)
    .then(res => res.json())
    .then(data => {
        let players = data.elements;

        // Sort by influence descending
        players.sort((a, b) => parseFloat(b.influence) - parseFloat(a.influence));

        // Map positions
        const positions = {};
        data.element_types.forEach(pos => {
            positions[pos.id] = pos.singular_name;
        });

        // Map teams
        const teams = {};
        data.teams.forEach(team => {
            teams[team.id] = team.name;
        });

        // Categorize players
        const categorized = {
            Goalkeepers: [],
            Defenders: [],
            Midfielders: [],
            Forwards: []
        };

        players.forEach(p => {
            const posName = positions[p.element_type];

            let formattedPlayer = {
                name: p.web_name,
                team: teams[p.team],
                influence: parseFloat(p.influence),
                price: p.now_cost / 10
            };

            if (posName === "Goalkeeper") categorized.Goalkeepers.push(formattedPlayer);
            if (posName === "Defender") categorized.Defenders.push(formattedPlayer);
            if (posName === "Midfielder") categorized.Midfielders.push(formattedPlayer);
            if (posName === "Forward") categorized.Forwards.push(formattedPlayer);
        });

        // 🎯 Apply limits per position
        const limits = {
            Goalkeepers: 23,
            Defenders: 114,
            Midfielders: 132,
            Forwards: 50
        };

        for (let key in categorized) {
            categorized[key] = categorized[key].slice(0, limits[key]);
        }

        // Save as JSON file
        fs.writeFileSync(
            'FPL_Players.json',
            JSON.stringify(categorized, null, 2) // pretty format
        );

        console.log("FPL_Players.json generated successfully!");
    })
    .catch(err => console.error("Error fetching data:", err));