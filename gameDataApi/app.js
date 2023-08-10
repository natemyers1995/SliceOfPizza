/*

hi

*/
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/boxscore', { useNewUrlParser: true, useUnifiedTopology: true });

const gameSchema = new mongoose.Schema({
    gameId: String,
    data: Object,
    lastUpdated: Date
});

const Game = mongoose.model('Game', gameSchema);

const express = require('express');
const app = express();
const PORT = 3000;

app.get('/game/:gameId', async (req, res) => {
    const { gameId } = req.params;

    // Check if data exists in the database and is less than 15 seconds old
    const game = await Game.findOne({ gameId });
    if (game && (Date.now() - game.lastUpdated) < 15000) {
        return res.json(game.data);
    }

    // Fetch fresh data from the feed
    const response = await axios.get(`https://chumley.barstoolsports.com/dev/data/games/${gameId}.json`);
    const data = response.data;

    // Cache the data in the database
    if (game) {
        game.data = data;
        game.lastUpdated = Date.now();
        await game.save();
    } else {
        await Game.create({ gameId, data, lastUpdated: Date.now() });
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});