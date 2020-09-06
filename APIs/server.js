const express = require('express')

const cors = require('cors')
const knex = require('knex');
const bcrypt = require('bcryptjs');


const app = express()


const DB = knex({
    client: 'pg',
    connection:{
        host: '127.0.0.1',
        user: 'postgres',
        password: '1234',
        database: 'smart_brain'
    }
});

// DB.select('*').from('users').then(data=> {
//     console.log(data);
// });

const database = {
  users: [{
    id: '123',
    name: 'Andrei',
    email: 'john@gmail.com',
    entries: 0,
    joined: new Date()
  }],
  secrets: {
    users_id: '123',
    hash: 'wghhh'
  }
}

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('Hello World!'))

app.post('/signin', (req, res) => {
    DB.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid =bcrypt.compareSync(req.body.password, data[0].hash)
        if(isValid){
            return DB.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user =>{
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
           
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/findface', (req, res) => {
  database.users.forEach(user => {
    if (user.email === req.body.email) {
      user.entries++
      res.json(user)
    }
  });
  res.json('nope')
})


app.post('/register', (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const hash = bcrypt.hashSync(password);
    DB.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
        return trx.insert({
                email: loginEmail[0],
                name: name,
                joined: new Date()
                })
                .into('users')
                .returning('*')
                .then(user => 
                res.json(user[0]))
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })

    // .catch(err => res.status(400).json('unable to register'))
  
})

app.get('/profile/:userId', (req, res) => {
      DB.select('*').from('users').where({
          id: req.params.userId
      })
      .then(user => {
        if(user.length){
            res.json(user[0]);
        }
        else{
            res.status(400).json('not found');
        }
      })
      .catch(err =>{
        res.status(400).json('error getting user')
      });

  // res.json('no user')

})

app.put('/image', (req,res)=>{
    const {id} = req.body;
    DB('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries =>{
        res.json(entries[0]);
    })
    .catch(err =>{
        res.status(400).json('unable to get entries');
    })
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
