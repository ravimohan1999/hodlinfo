const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
  user: 'your_username',
  host: 'localhost',
  database: 'hodlinfo',
  password: 'your_password',
  port: 5432,
});
client.connect();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/fetch-data', async (req, res) => {
  try {
    const response = await fetch('https://api.wazirx.com/api/v2/tickers');
    const data = await response.json();
    const top10 = Object.values(data).slice(0, 10);

    for (const crypto of top10) {
      const { name, last, buy, sell, volume, baseUnit } = crypto;
      await client.query(
        'INSERT INTO crypto_data (name, last, buy, sell, volume, base_unit) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (name) DO NOTHING',
        [name, last, buy, sell, volume, baseUnit]
      );
    }

    res.status(200).send('Data fetched and stored successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/get-data', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM crypto_data');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
