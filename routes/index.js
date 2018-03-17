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

					res.send(family);
				}); //End of Third then

			}); //End of Second then

		}); //End of firt query then

	}); //END of query connect
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET family */
router.get('/getFamily', getFamily);

module.exports = router;