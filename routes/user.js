const express = require('express')
const router = express.Router()
const User = require('../models/user')
const authService = require("../services/auth");

async function getUser(req, res, next) {
  let user = null

  try {
    user = await User.findById(req.params.id)
    if (user == null) {
      return res.status(400).json({ message: 'Cant find user'})
    }
  } catch(err){
    return res.status(400).json({ message: err.message })
  }
  
  res.user = user
  next()
}

function getToken(req){
  let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
  
  if(token){
    if (token.startsWith('Bearer ')) {
      // Remove Bearer from string
      token = token.slice(7, token.length);
    }
  }

  return (token) ? token : null
}
// GET ALL USERS
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/profile', async (req, res)=> {
  let token = getToken(req)

  if(token){
    let user = await authService.verifyUser(token)
    if(user){
      res.json(user)
    } else {
      res.status(404).json({msg: "Page Not Found"})
    }
  } else {
    res.status(404).json({msg: "Page Not Found"})
  }
  
})

// GET SINGLE USER
router.get('/:id', getUser, (req, res) => {
  res.json(res.user)
})

// CRATE A USER
router.post('/add', async (req, res) => {

  let username  =  req.body.username
  let password = req.body.password
  let admin = (req.body.admin) ? req.body.admin : false

  if(username == ''){
    res.send(400).json({msg: "Username is required."})
    return
  }

  if(password == ''){
    res.send(400).json({msg: "Password is required."})
    return
  }

  password = authService.hashPassword(password)

  let user = new User({
    username: username,
    password: password,
    admin: admin,
  })

  try {
    const newUser = await user.save()
    res.json(newUser)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/login', async function (req, res) {
  let user = await User.findOne({username: req.body.username})

  if (!user) {
    console.log('User not found')
    return res.status(401).json({
      message: "Login Failed"
    });
  } 

  let passwordMatch = authService.comparePasswords(req.body.password, user.password);
  if(passwordMatch){
    let token = authService.signUser(user);
    res.json({token})
  } else{
    console.log('Wrong password');
    res.send('Wrong password');
  }
})

module.exports = router