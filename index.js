const express = require('express');
const app = express();
const promise = require('bluebird');
const portNumber = process.env.PORT || 3000;

// pg-promise initialization options:
const initOptions = {
  // Use a custom promise library, instead of the default ES6 Promise:
  promiseLib: promise, 
};

// Database connection parameters:
const config = {
  host: 'localhost',
  port: 5432,
  database: 'fitter',
  user: 'brandonhill'
};

// Load and initialize pg-promise:
const pgp = require('pg-promise')(initOptions);

// Create the database instance:
const db = pgp(config);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static( __dirname + '/static'));

app.get('/api/post', function (req, res) {
  db.query('SELECT * FROM post')
      .then(function (results) {
        results.forEach(function (post) {
          console.log(post.original_tweet);
        });

        res.json(results);
      });
});


//Post a new tweet

app.post('/api/post', function(req, res) {
  if (req.body.original_tweet != '' && typeof req.body.original_tweet !== undefined && req.body.user_name != '' && typeof req.body.user_name !== undefined) {
      db.result(`INSERT INTO post (original_tweet,user_name, is_deleted,tweet_date) VALUES ('${req.body.tweet}','${req.body.user_name}', FALSE,null)`)
        .then(function (result) {
            console.log(result);
        });
      res.send('ok');
  }
  else {
      res.send('Enter tweet and username');
  }
});


app.listen(portNumber, function() {
  console.log(`My API is listening on port ${portNumber}.... `)
});
