const express = require('express');
const app = express();
const promise = require('bluebird');
const portNumber = process.env.PORT || 3000;

const bcrypt = require('bcrypt');
//Used for adding extra security
const saltRounds = 10;
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

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



//Registers a new Twitter user with username, email, and password
app.post('/api/register', (req, res) => {
    if(!req.body.username) {
        res.status(404).send("Username is required");
    }
    if(!req.body.email) {
        res.status(404).send("Email is required");
    }
    if(!req.body.password) {
        res.status(404).send("Password is required");
    }
    var email = req.body.email;
    var password = req.body.password;
    bcrypt.hash(password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        db.result(`INSERT INTO users (username, email, password) VALUES ('${req.body.username}', '${req.body.email}', '${hash}')`)
          .then(function (result) {
            res.json({status: "User successfuly registered"});
            console.log(result);
          })
          .catch(function (err) {
              res.send('Username or email already exists');
              console.log(err);
          })
    });
})
//Logins user by checking email and password
app.post('/api/login', (req, res) => {
    if(!req.body.email) {
        res.status(404).send("Email is required");
    }
    if(!req.body.password) {
        res.status(404).send("Password is required");
    }
    var password = req.body.password;
    db.query(`SELECT password FROM users WHERE email='${req.body.email}'`)
      .then(function (result) {
        if(result.length == 0) {
            res.status(404).send("User does not exist in database");
        }
        else {
            var stored_password = result[0].password;
            bcrypt.compare(password, stored_password, function(err, result) {
                // result == true
                if(result == true) {
                    res.json({status : "User has successfully logged in"});
                } else {
                    res.status(404).send("Email/Password combination did not match");
                }
            });
        }
      });
})


app.listen(portNumber, function() {
  console.log(`My API is listening on port ${portNumber}.... `)
});
