process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const express = require('express');
var bodyParser = require('body-parser')
const app = express();
const bcrypt = require('bcrypt');
//Used for adding extra security
const saltRounds = 10;
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
const promise = require('bluebird');
const portNumber = process.env.PORT || 3000;
// pg-promise initialization options:
const initOptions = {
    // Use a custom promise library, instead of the default ES6 Promise:
    promiseLib: promise, 
};
// Database connection parameters:
// const config = {
//     host: 'ec2-52-200-48-116.compute-1.amazonaws.com',
//     port: 5432,
//     database: 'd2o877jho3q75u',
//     user: 'vtotwbaenetdpg',
//     password: 'e4dc3ddf95291851d1a0ccac87e3723d4a1c57fb659ec6acc043b6ad2154ae6b',
//     ssl: true
// };
  const config = {
    host: '172.25.128.1',
    port: 5432,
    database: 'first_database',
    user: 'nasiyram',
    //password: 'e4dc3ddf95291851d1a0ccac87e3723d4a1c57fb659ec6acc043b6ad2154ae6b',
    ssl: true
}
// Load and initialize pg-promise:
const pgp = require('pg-promise')(initOptions);

// Create the database instance:
const db = pgp(config);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/web'));
app.listen(portNumber, function() {
    console.log(`My API is listening on port ${portNumber}.... `);
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
//MAIN ENDPOINT shows all tweets not deleted
app.get('/api/posts', function(req, res) {
    db.query('SELECT * FROM posts WHERE is_deleted=FALSE')
        .then(function (results) {
            results.forEach(function(post) {
                console.log(post.tweet);
            })
            res.json(results);
        });
});
//Post a new tweet
app.post('/api/posts', function(req, res) {
    if (req.body.tweet != '' && typeof req.body.tweet !== undefined && typeof req.body.user_id !== undefined) {
        db.result(`INSERT INTO posts (tweet, user_id, is_deleted) VALUES ('${req.body.tweet}', ${req.body.user_id}, FALSE)`)
          .then(function (result) {
              console.log(result);
          });
        res.send('ok');
    }
    else {
        res.send('Enter tweet and username');
    }
});
//Single tweet endpoint. Retrieve one tweet and all its replies
app.get('/api/singletweet', function (req, res) {
    if(req.body.id != '' && typeof req.body.id != undefined) {
      db.query(`SELECT id FROM posts WHERE id = ${req.body.id}`)
        .then(function(result) {
            if(result.length != 0) {
                db.query(` SELECT tweet, posts.user_name, created_at, reply, replies.user_name, reply_date
                FROM posts FULL JOIN replies 
                ON posts.id = replies.post_id
                WHERE posts.id =${req.body.id}`)
                  .then(function (result) {
                    console.log(result);
                    res.json(result);
                });
            }
            else {
                res.send('Tweet not found');
            }
        })
    }else {
      res.send('Select a tweet');
    }
  });
//Delete a tweet
app.post('/api/delete_tweet', function (req, res) {
    if(req.body.id != '' && typeof req.body.id != undefined) {
        db.query(`SELECT id FROM posts WHERE id= ${req.body.id}`)
          .then(function (result) {
              if(result.length != 0) {
                db.result(`UPDATE posts 
                 SET is_deleted = true
                 WHERE id = ${req.body.id}`)
                .then(function (result) {
                    res.send('Tweet deleted');
                    console.log(result);
                });
              }
              else {
                  res.send("Tweet does not exist");
              }
          })
    }
    else {
        res.send('Select a tweet to delete');
    }
})
//Create a reply
app.post('/api/reply', function(req, res) {
    if (req.body.reply != '' && typeof req.body.reply !== undefined && req.body.post_id != '' && typeof req.body.post_id !== undefined && req.body.user_id != '' && typeof req.body.user_id !== undefined) {
        db.result(`INSERT INTO replies (reply, post_id, user_id, reply_deleted) VALUES ('${req.body.reply}', ${req.body.post_id}, ${req.body.user_id}, FALSE)`)
          .then(function (result) {
              console.log(result);
          });
        res.send('ok');
    }
    else {
        res.send('Enter reply and username');
    }
});
//Delete a reply
app.post('/api/delete_reply', function (req, res) {
    if(req.body.id != '' && typeof req.body.id != undefined) {
        db.query(`SELECT id FROM replies WHERE id= ${req.body.id}`)
          .then(function (result) {
              if(result.length != 0) {
                db.result(`UPDATE replies 
                 SET reply_deleted = true
                 WHERE id = ${req.body.id}`)
                .then(function (result) {
                    res.send('Reply deleted');
                    console.log(result);
                });
              }
              else {
                  res.send("Reply does not exist");
              }
          })
    }
    else {
        res.send('Select a reply to delete');
    }
})