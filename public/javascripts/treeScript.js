
		function capitalizeFirstLetter(string) {
   			 return string.charAt(0).toUpperCase() + string.slice(1);
		}

		function searchBase()
		{
			var first_name = document.getElementById('first_name').value;
			var last_name = document.getElementById('last_name').value;
			
			first_name = first_name.toLowerCase().trim();
			last_name = last_name.toLowerCase().trim();
			document.getElementById('siblingsDiv').innerHTML = "";
			document.getElementById('parentDiv').innerHTML = "";
			document.getElementById('personDiv').innerHTML = "";


			$.ajax({
				type: 'GET',
				url: 'https://dry-savannah-75818.herokuapp.com/getFamily?first=' + first_name + '&last=' + last_name, 
				//This URL will need change for HEROKU app: http://localhost:3000/getFamily?first=
				//https://dry-savannah-75818.herokuapp.com/getFamily?first=
				success: function (result, status, xhr) {
					console.log("success");
					console.log(result);
					var parents = result["parents"];
					var person = result["person"];
					var siblings = result["siblings"];

					printPerson(person);
					printParents(parents);
					printSiblings(siblings);
				},
				error: function (xhr, status, error) {
					console.log("ERROR\n");
				}
			});

			function printSiblings(siblings) {
				var div = document.getElementById('siblingsDiv');
				div.innerHTML += "Siblings: <br/>";
				length = siblings.length;
				for (var i = 0; i < length; ++i)
					printRecord(siblings[i], 'siblingsDiv');
			}

			function printParents(parents) {
				var father = parents['father'];
				var mother = parents['mother'];
				var div = document.getElementById('parentDiv');
				div.innerHTML += "Parents: <br/>";
				printRecord(father, 'parentDiv');
				printRecord(mother, 'parentDiv');
			}

			function printPerson(person) {
				var div = document.getElementById('personDiv');
				div.innerHTML += "Person: <br/>";
				printRecord(person, 'personDiv');
			}

			function printRecord(person, divID) {
				var div = document.getElementById(divID);
				div.innerHTML += '<p>';

				div.innerHTML += 'First Name: ' + capitalizeFirstLetter(person['first_name']) + '<br/>';
				div.innerHTML += 'Last Name: ' + capitalizeFirstLetter(person['last_name']) + '<br/>';
				
				var sex;
				if(person['sex']) 
					{ sex = 'Male' } 
				else 
					{ sex = 'Female'}

				div.innerHTML += 'Sex: ' + sex + '<br/>';
				div.innerHTML += 'Birth: ' + person['birth_date'].slice(0,10) + '<br/>';
				div.innerHTML += '</p>';
			}
		}