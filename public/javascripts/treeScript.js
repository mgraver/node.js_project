
		function capitalizeFirstLetter(string) {
   			 return string.charAt(0).toUpperCase() + string.slice(1);
		}

		function searchBase()
		{
			var first_name = document.getElementById('first_name').value;
			var last_name = document.getElementById('last_name').value;
			
			first_name = first_name.toLowerCase().trim();
			last_name = last_name.toLowerCase().trim();
			document.getElementById('sTable-body').innerHTML = "";
			document.getElementById('paTable-body').innerHTML = "";
			document.getElementById('pTable-body').innerHTML = "";


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
				length = siblings.length;
				for (var i = 0; i < length; ++i)
					printRecord(siblings[i], 'sTable-body');
			}

			function printParents(parents) {
				var father = parents['father'];
				var mother = parents['mother'];
				printRecord(father, 'paTable-body');
				printRecord(mother, 'paTable-body');
			}

			function printPerson(person) {
				printRecord(person, 'pTable-body');
			}

			function printRecord(person, tableBID) {
				//DEBUG FUNCTION BODY
				/*var div = document.getElementById(divID);
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
				div.innerHTML += '</p>';*/

				var table_body = document.getElementById(tableBID);

				var tr = document.createElement('tr');
				var first = document.createElement('td');
   				var last = document.createElement('td');
   				var sex_d = document.createElement('td');
   				var birth = document.createElement('td');

   				var f_text = document.createTextNode(capitalizeFirstLetter(person['first_name']));
   				var l_text = document.createTextNode(capitalizeFirstLetter(person['last_name']));

   				var sex;
				if(person['sex']) 
					{ sex = 'Male' } 
				else 
					{ sex = 'Female'}

   				var s_text = document.createTextNode(sex);
   				var b_text = document.createTextNode(person['birth_date'].slice(0,10));

   				first.appendChild(f_text);
   				last.appendChild(l_text);
   				sex_d.appendChild(s_text);
   				birth.appendChild(b_text);

   				tr.appendChild(first);
   				tr.appendChild(last);
   				tr.appendChild(sex_d);
   				tr.appendChild(birth);

   				table_body.appendChild(tr);
			}
		}