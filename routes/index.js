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


/******************************************************
 *  Used for body parsing.
 *****************************************************/ 
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());



/******************************************************
 *  Get the family records of the inicated person.
 *****************************************************/ 
function getFamily(req, res) {
	var pgPool = new Pool(config);
	var person;
	var family = {};
	var first = req.query.first;
	var last = req.query.last;

	/* DEGUG */
	console.log('params: ' + JSON.stringify(req.params));
	console.log('body: ' + JSON.stringify(req.body));
	console.log('query: ' + JSON.stringify(req.query));

	console.log(req.query.first);
	console.log(req.query.last);

	pgPool.on('error', (err, client) => {
		console.error('Unexpected error on idle client', err)
  		process.exit(-1)
	});

	//Get the id of the person
	pgPool.connect((err, client, done) => {
		if (err) throw err;

		var idQuery = "SELECT * FROM person WHERE first_name = $1 AND last_name= $2";    //Get everything for the person.
		
		var familyQuery = "SELECT * FROM person WHERE id = $1 OR id = $2 OR id = $3";    //Get the family based of the IDs
		
		var pidQuery = "SELECT p.id, p.first_name, p.last_name, p.birth_date, p.sex FROM \
		                person p JOIN relations r ON r.child = $1 AND (p.id = r.father \
		                OR p.id = r.mother)";          //Get the parent IDs.
		
		var sidQuery = "SELECT p.first_name, p.last_name, p.birth_date, p.sex FROM \
		                person p JOIN relations r ON p.id = r.child AND father = $1 AND mother = $2 \
		                AND r.child != $3";  //Get the siblings IDs.


		client.query(idQuery, [first,  last])
		.then(result => {
			var rows = result.rows;
			var person = rows[0];  //Get the query results
			
			console.log("\nperson:");  //DEBUG
			console.log(rows);

			family["person"] = person;

			client.query(pidQuery, [person['id']]) //Get the parent ids.
			.then(result => {
				rows = result.rows;

				console.log("\nparents:");
				console.log(rows);
				
				var parents = {}
				parents["father"] = rows[0];
				parents["mother"] = rows[1];
				family["parents"] = parents;

				client.query(sidQuery, [ parents["father"]["id"], parents["mother"]["id"], person["id"]]) //Get the siblings
				.then(result => {
					rows = result.rows;

					console.log("\nsiblings:");
					console.log(rows);

					var siblings = [];
					for (var i in rows)
						siblings.push(rows[i]);

					family["siblings"] = siblings;

					pgPool.end();
					res.send(family);
				}); //End of Third then

			}); //End of Second then

		}); //End of firt query then

	}); //END of query connect
}

/******************************************************
 *  Create a new Record
 *****************************************************/ 
function newRecord(req, res) {
	var pgPool = new Pool(config);
	var insertQ = "INSERT INTO person (first_name, last_name, birth_date, Sex) VALUES ($1, $2, (to_date($3, 'YYYY-MM-DD')), $4)";
	var parentIDs = "SELECT id FROM person WHERE (first_name = $2 AND last_name= $1) OR (first_name = $3 AND last_name = $4);";
	var relationsQ = "INSERT INTO relations (father, mother, child) VALUES ($1, $2, $3)";

	/* DEGUG */
	console.log('params: ' + JSON.stringify(req.params));
	console.log('body: ' + JSON.stringify(req.body));
	console.log('query: ' + JSON.stringify(req.query));

	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var birth_date = req.body.birth_date;
	var sex = req.body.sex;

	var parent1 = [req.body.parent1_first, req.body.parent1_last];
	var parent2 = [req.body.parent2_first, req.body.parent2_last];

	pgPool.on('error', (err, client) => {
		console.error('Unexpected error on idle client', err)
  		process.exit(-1)
	});

	pgPool.connect((err, client, done) => {
		if (err) throw err;

		client.query(insertQ, [first_name, last_name, birth_date, sex])
		.then(result => {
			var newID = result.rows[0].id;

			//If there are parents.
			client.query(parentIDs, [ parent1[0], parent1[1], parent2[0], parent2[1] ])
			.then(result => {
				var pID1 = result.rows[0].id;
				var pID2 = result.rows[1].id;

				//Only add parents if they are valid
				if (pID1 != undefined && pID2 != undefined)
					client.query(relationsQ, [pID1, pID2, newID]);
				else if (pID1 != undefined)
					client.query(relationsQ, [pID1, null, newID]);
				else if (pID2 != undefined)
					client.query(relationsQ, [null, pID2, newID]);
				else
					client.query(relationsQ, [null, null, newID]);

				pgPool.end();
				//TODO: do somethign with result.
			});//END of second then

		});// END of first then. 

	}); //END of connect
}



/******************************************************
 *  Update existing record
 *****************************************************/ 
 function update(req, res) {
 	var pgPool = new Pool(config);
 	var updatePQ = "UPDATE person SET first_name = $1, last_name = $2, birth_date = (to_date($3, 'YYYY-MM-DD')), sex = $4 \
 	                                  WHERE id = $5";
 	var parentIDs = "SELECT id FROM person WHERE (first_name = $2 AND last_name= $1) OR (first_name = $3 AND last_name = $4);";
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

	if (sex == 'male')
		sex = true;
	else 
		sex = false;

	var parent1 = [req.body.parent1_first, req.body.parent1_last];
	var parent2 = [req.body.parent2_first, req.body.parent2_last];

	pgPool.connect((err, client, done) => {
		if (err) throw err;

		//Update the person's row.
		client.query(updatePQ, [first_name, last_name, birth_date, sex]);

		//Update relations.
		client.query(parentIDs, [ parent1[0], parent1[1], parent2[0], parent2[1] ])
			.then(result => {
				var pID1 = result.rows[0].id;
				var pID2 = result.rows[1].id;

				//Only add parents if they are valid
				if (pID1 != undefined && pID2 != undefined)
					client.query(updateRQ, [pID1, pID2, id]);
				else if (pID1 != undefined)
					client.query(updateRQ, [pID1, null, id]);
				else if (pID2 != undefined)
					client.query(updateRQ, [null, pID2, id]);

				pgPool.end();
				//TODO: do somethign with result.
			});//END of then
	});
 }

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET family */
router.get('/getFamily', getFamily);

/* POST new Record */
router.post('/newRecords', newRecord);

/* POST update */
router.post('/update', update);

module.exports = router;