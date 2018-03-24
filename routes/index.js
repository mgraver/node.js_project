var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const { Pool } = require('pg');
const url = require('url')

/*********************************************************
* The following code is to set up the congfig for the 
* pg pool object so it can connect to the server.
*********************************************************/
const connectString = process.env.DATABASE_URL || 'postgres://limited:limited@localhost:5432/template1';

const params = url.parse(connectString);
const auth = params.auth.split(':');

const config = {
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split('/')[1],
  ssl: false
};

//Set up the pool
var pgPool = new Pool(config);

/******************************************************
 *  Used for body parsing.
 *****************************************************/ 
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());



/******************************************************
 *  Get the family records of the inicated person.
 *****************************************************/ 
function getFamily(req, res) {
	var person;
	var family = {};
	var first = req.query.first.trim().toLowerCase();
	var last = req.query.last.trim().toLowerCase();

	/* DEGUG */
	console.log('params: ' + JSON.stringify(req.params));
	console.log('body: ' + JSON.stringify(req.body));
	console.log('query: ' + JSON.stringify(req.query));

	console.log(first);
	console.log(last);

	pgPool.on('error', (err, client) => {
		console.error('Unexpected error on idle client', err)
  		process.exit(-1)
	});

	var idQuery = "SELECT * FROM person WHERE first_name = $1 AND last_name= $2";    //Get everything for the person.
		
	var familyQuery = "SELECT * FROM person WHERE id = $1 OR id = $2 OR id = $3";    //Get the family based of the IDs
		
	var pidQuery = "SELECT p.id, p.first_name, p.last_name, p.birth_date, p.sex FROM \
		                person p JOIN relations r ON r.child = $1 AND (p.id = r.father \
		                OR p.id = r.mother)";          //Get the parent IDs.
		
	var sidQuery = "SELECT p.first_name, p.last_name, p.birth_date, p.sex FROM \
		                person p JOIN relations r ON p.id = r.child AND father = $1 AND mother = $2 \
		                AND r.child != $3";  //Get the siblings IDs.


    pgPool.query(idQuery, [first,  last])
		.then(result => {
			var rows = result.rows;
			var person = rows[0];  //Get the query results
			
			console.log("\nperson:");  //DEBUG
			console.log(rows);

			family["person"] = person;

			pgPool.query(pidQuery, [person['id']]) //Get the parent ids.
			.then(result => {
				rows = result.rows;
				
				if (rows.length == 0)
					res.send(family);

				console.log("\nparents:");
				console.log(rows);
				
				var parents = {}
				parents["father"] = rows[0];
				parents["mother"] = rows[1];
				family["parents"] = parents;

				pgPool.query(sidQuery, [ parents["father"]["id"], parents["mother"]["id"], person["id"]]) //Get the siblings
				.then(result => {
					rows = result.rows;

					console.log("\nsiblings:");
					console.log(rows);
					//TODO: IF no siblings return family
					if (rows.length == 0)
						res.send(family);

					var siblings = [];
					for (var i in rows)
						siblings.push(rows[i]);

					family["siblings"] = siblings;


					res.send(family);
				}); //End of Third then

			}); //End of Second then

		}); //End of first query then
}

/******************************************************
 *  Create a new Record
 *****************************************************/ 
function newRecord(req, res) {
	//var pgPool = new Pool(config);
	var insertQ = "INSERT INTO person (first_name, last_name, birth_date, Sex) VALUES ($1, $2, (to_date($3, 'YYYY-MM-DD')), $4)\
				   RETURNING id";
	var parentIDs = "SELECT id, sex FROM person WHERE (first_name = $1 AND last_name= $2) OR (first_name = $3 AND last_name = $4)";
	var relationsQ = "INSERT INTO relations (father, mother, child) VALUES ($1, $2, $3)";

	/* DEGUG */
	console.log('params: ' + JSON.stringify(req.params));
	console.log('body: ' + JSON.stringify(req.body));
	console.log('query: ' + JSON.stringify(req.query));

	var first_name = req.body.first_name.trim().toLowerCase();
	var last_name = req.body.last_name.trim().toLowerCase();
	var birth_date = req.body.birth_date;
	var sex = req.body.sex;

	var parent1 = req.body.P1.trim().toLowerCase().split(" ", 2);
	var parent2 = req.body.P2.trim().toLowerCase().split(" ", 2);

	pgPool.on('error', (err, client) => {
		console.error('Unexpected error on idle client', err)
  		process.exit(-1)
	});

	pgPool.query(insertQ, [first_name, last_name, birth_date, sex])
		.then(result => {
			console.log(result.rows[0]);
			var newID = result.rows[0].id;

			console.log(JSON.stringify(parent1));
			console.log(JSON.stringify(parent2));

			//If there are parents.
			pgPool.query(parentIDs, [ parent1[0], parent1[1], parent2[0], parent2[1] ])
			.then(result => {
				var pID1;
				var pID2;
				console.log("ParentIDs query: " + JSON.stringify(result.rows));
				if (result.rows.length == 0)
				{
					pID1 = undefined;
					pID2 = undefined;
				}
				else 
				{
					pID1 = [result.rows[0].id, result.rows[0].sex];
					if (result.rows.length > 1)
						pID2 = [result.rows[1].id, result.rows[1].sex];
					else
						pID2 = undefined;
				}

				//Only add parents if they are valid
				if (pID1 !== undefined && pID2 !== undefined)
				{
					//IF male put id into father column.
					if (pID1[1] == true)
						pgPool.query(relationsQ, [pID1[0], pID2[0], newID]);
					else
						pgPool.query(relationsQ, [pID2[0], pID1[0], newID]);
				}
				else if (pID1 !== undefined)
				{
					//IF male put id into father column.
					if (pID1[1] == true)
						pgPool.query(relationsQ, [pID1[0], null, newID]);
					else
						pgPool.query(relationsQ, [null, pID1[0], newID]);
				}
				else if (pID2 !== undefined)
				{
					//IF female put id into father column.
					if (pID2[1] == false)
						pgPool.query(relationsQ, [null, pID2[0], newID]);
					else
						pgPool.query(relationsQ, [pID2[0], null, newID]);
				}
				else
					pgPool.query(relationsQ, [null, null, newID]);

				//TODO: do somethign with result.
			});//END of second then

		});// END of first then. 
}



/******************************************************
 *  Update existing record
 *****************************************************/ 
 function update(req, res) {
 	//var pgPool = new Pool(config);
 	var updatePQ = "UPDATE person SET first_name = $1, last_name = $2, birth_date = (to_date($3, 'YYYY-MM-DD')), sex = $4 \
 	                                  WHERE id = $5";
 	var parentIDs = "SELECT id, sex FROM person WHERE (first_name = $1 AND last_name= $2) OR (first_name = $3 AND last_name = $4)";
	var updateRQ = "UPDATE relations SET father = $1, mother = $2 WHERE child = $3";

 	/* DEGUG */
	console.log('params: ' + JSON.stringify(req.params));
	console.log('body: ' + JSON.stringify(req.body));
	console.log('query: ' + JSON.stringify(req.query));

	var id = req.body.id;
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var birth_date = req.body.birth_date;
	var sex = req.body.sex;

	var parent1 = req.body.P1.trim().toLowerCase().split(" ");
	var parent2 = req.body.P2.trim().toLowerCase().split(" ");

		//Update the person's row.
		pgPool.query(updatePQ, [first_name, last_name, birth_date, sex, id]);

		//Update relations.
		pgPool.query(parentIDs, [ parent1[0], parent1[1], parent2[0], parent2[1] ])
			.then(result => {
				var rows = result.rows;
				var p1;
				var p2;

				if (rows == 0)
				{
					p1 = undefined;
					p2 = undefined;
				}
				else
				{
					console.log(JSON.stringify(rows));
					p1 = result.rows[0];
					p2 = result.rows[1];
				}

				//Only add parents if they are valid
				if (p1 != undefined && p2 != undefined)
				{
					if (p1.sex == true)
						pgPool.query(updateRQ, [p1.id, p2.id, id]);
					else
						pgPool.query(updateRQ, [p2.id, p1.id, id]);
				}
				else if (p1 != undefined)
				{
					if (p1.sex == true)
						pgPool.query(updateRQ, [p1.id, null, id]);
					else
						pgPool.query(updateRQ, [null, p1.id, id]);
				}
				else if (p2 != undefined)
				{
					if (p2 == false)
						pgPool.query(updateRQ, [null, p2.id, id]);
					else
						pgPool.query(updateRQ, [p2.id, null, id]);
				}

				//TODO: do somethign with result.
			});//END of then
 }

/******************************************************
 *  Get a single persons info for update form
 *****************************************************/ 
 function getPerson(req, res) {
 	var person = {};
 	var personQ = "SELECT id, sex, birth_date FROM person WHERE first_name = $1 AND last_name = $2";
 	var parentNames = "SELECT first_name, last_name FROM person WHERE \
 	                   id = (SELECT father FROM relations WHERE child = $1) OR id = (SELECT mother FROM relations WHERE child = $1)";
 	var first = req.query.first;
	var last = req.query.last;

	person['first_name'] = first;
	person['last_name'] = last;

 	/* DEGUG */
	console.log('params: ' + JSON.stringify(req.params));
	console.log('body: ' + JSON.stringify(req.body));
	console.log('query: ' + JSON.stringify(req.query));

	pgPool.query(personQ, [first, last])
	.then(result => {
		var rows = result.rows;
		if (rows.length == 0) 
			{
				console.log("No rows");
				res.send(undefined);
			}

		person['id'] = rows[0].id;
		person['birth_date'] = rows[0].birth_date;
		person['sex'] = rows[0].sex

		pgPool.query(parentNames, [person['id']])
		.then(result => {
			var rows = result.rows;
			
			if (rows.length == 0) {res.send(person);}

			person['P1'] = rows[0].first_name + " " + rows[0].last_name;

			if (rows.length > 1) 
				person['P2'] = rows[1].first_name + " " + rows[1].last_name;

			res.send(person);
		});//End of second then
	}); //End of first then
 }

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET family */
router.get('/getFamily', getFamily);

/* POST new Record */
router.post('/newRecord', newRecord);

/* POST update */
router.post('/update', update);

/* GET person */
router.get('/getPerson', getPerson);

module.exports = router;