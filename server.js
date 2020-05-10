//importing express
const express =require('express');

//import Middleware(bodyparser) ,which is used to convert json to javascript object automatically. 
const bodyParser= require('body-parser');

//import cors to access localhost
const cors = require('cors');

//importing knex
const knex = require('knex');
//const pg = require('pg');
//connecting to database server
const db =knex({
	client: 'pg',
    connection: {
    	host:'127.0.0.1',
    	user:'postgres',
    	password:'lwith',
    	database:'face-detector'
  }
});

//running express
const app = express();

//use bodyparser in app
app.use(bodyParser.json());

//use cors in app
app.use(cors());

//root request
app.get('/',(req,res)=>{
	//responding with all the users corrently present
	db.select('*').from('users')
	.then(user =>{
		res.json(user);
	});
})

//for signing in user
app.post('/signin',(req,res)=>{
	//req has been converted to javascript object by bodyparser automatically
	//res.json('signing'); //sending response in JSON format
	const {email,password}=req.body;
	//if any of the inputs are null then it send error message to client
	if(!email || !password){
		return res.status(400).json('incorrect data submission');
	}
	db.select('email','hash').from('login')
	  .where('email','=',email)
	  .then(data =>{
	  	//const isValid =bcrypt.compareSync(req.body.password,data[0].hash);
	  	 isValid = (password===data[0].hash) ?true:false;
	  	/*console.log(isValid);
	  	console.log('hello');*/
	  	if(isValid){
	  		return db.select('*').from('users')
	  		.where('email','=',req.body.email)
	  		.then(user =>{
	  			res.json(user[0]);
	  		})
	  		.catch(err => res.status(400).json('unable to get user'))
	  	} else {
	  		res.status(400).json('wrong credential')
	  	}
	  })
	  .catch(err => res.status(400).json('wrong credentials'))
	/*if(req.body.email===database.users[0].email && 
		req.body.password===database.users[0].password){
		res.json(database.users[0]);
	}else{
		res.status(400).json('error logging in');

	}*/

})

//for registering user . Insert in users and login table
app.post('/register',(req,res)=>{
	const {name,email,password}=req.body;
	//if any of the inputs are null then it send error message to client
	if(!name || !email || !password){
		return res.status(400).json('incorrect data submission');
	}
	//const hash=bcrypt.hashSync(password);
	db.transaction(tnx =>{
		tnx.insert({
			hash:password,
			email:email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return tnx('users')
			.returning('*')
			.insert({
				email:loginEmail[0],
				name:name,
				joined:new Date()
			})
			//responding client 
			  .then(user =>{
				res.json(user[0]);
			  })
		})
		.then(tnx.commit)
		.catch(tnx.rollback)
	})
	  .catch(err => res.status(400).json('Error!! unable to register'))
})


//for retriving user with unique id
//currently not being used in front-end
app.get('/profile/:id',(req,res)=>{
	const {id}=req.params;
	db.select('*').from('users').where({id:id})
	.then(user => {
		if(user.length){
			res.json(user[0]);
		} else {
			res.status(400).json('not found');
		}
	})
	.catch(err=>res.status(400).json('error getting user, please try again'));
})

//increase id of entries. user have to request with user id in the body part
app.put('/image',(req, res)=>{
	const {id}=req.body; //request body contain unique id
	db('users').where('id','=',id)
	.increment('entries',1)
	.returning('entries')
	.then(entries=>{
		if(entries.length){
			res.json(entries[0]);
		}else {
			res.status(400).json('entries not found');
		}
	})
	

	.catch(err =>res.status(400).json('entries not found'));

})

app.listen(3000,()=>{
	console.log('app is working properly !!');
})