var person;
function capitalizeFirstLetter(string) 
{
   	return string.charAt(0).toUpperCase() + string.slice(1);
}

function checkInput() 
		{
			var validForm = true;
			var validBirth = true;
			var validF = true;
			var validL = true;

			var birthString = document.getElementById('birth_date').value;
			birthString = birthString.trim();
			var bsLength = birthString.length
			if (bsLength != 10)
			{
				validForm = false;
				validBirth = false;
			}

			for (var i = 0; i < bsLength; i++)
			{
				if ((i == 4 || i == 7)  && birthString[i] != '-') 
				{
					validForm = false;
					validBirth = false;
				}
				else
				{
					if (!Number.isInteger(parseInt(birthString[i])) && birthString[i] != '-')
					{
						validForm = false;
						validBirth = false;
					}
				}
			}

			var f_Name = document.getElementById("first_name").value.trim();
			if (f_Name.length == 0)
			{
				validForm = false;
				validF = false
			}

			var f_Name = document.getElementById("last_name").value.trim();
			if (f_Name.length == 0)
			{
				validForm = false;
				validL = false
			}

			var errorDiv = document.getElementById("errorDiv");
			errorDiv.innerHTML = "<strong>Error:</strong><br/>";

			if (!validF)
				errorDiv.innerHTML += "Invalid first name <br/>";

			if (!validL)
				errorDiv.innerHTML += "Invalid last name <br/>";

			if (!validBirth)
				errorDiv.innerHTML += "Invalid birth year <br/>";

			if (!validForm)
				errorDiv.style.display = "block";

			return validForm;
			//TODO: have backend send user back to home.
		}
		
function resetForm() 
{
	document.getElementById("updateForm").reset();
}

function search() 
{
	var name = document.getElementById('full_name').value.trim().toLowerCase().split(" ", 2);
	$.ajax({
		type: 'GET',
		url: 'https://dry-savannah-75818.herokuapp.com/getPerson?first=' + name[0] + '&last=' + name[1],
		//This URL will need change for HEROKU app: http://localhost:3000/getPerson?first=
		//https://dry-savannah-75818.herokuapp.com/getPerson?first=
		success: function(result, status, xhr) {
			person = result;
			fillUpdateForm();
		},
		error: function (xhr, status, error) {
					console.log("ERROR\n");
		}
	});
}

function fillUpdateForm() 
{
	resetForm();
	if (person == undefined) 
	{
		console.log("ERROR: returning");
		return;
	}
	console.log(person);
	document.getElementById('first_name').value = person['first_name'];
	document.getElementById('last_name').value = person['last_name'];
	document.getElementById('sex').value = person['sex'];
	document.getElementById('birth_date').value = person['birth_date'].slice(0,10);

	if (person['P1'] !== undefined)
		document.getElementById('P1').value = capitalizeFirstLetter(person['P1']);
	if (person['P2'] !== undefined)
		document.getElementById('P2').value = capitalizeFirstLetter(person['P2']);

	document.getElementById('updateForm').style.display = "block";
}

function update() 
{
   person['first_name'] = document.getElementById('first_name').value.trim().toLowerCase();
   person['last_name'] = document.getElementById('last_name').value.trim().toLowerCase();
   person['sex'] = document.getElementById('sex').value;
   person['birth_date'] = document.getElementById('birth_date').value;
   person['P1'] = document.getElementById('P1').value;
   person['P2'] = document.getElementById('P2').value;

   $.ajax({
		type: 'POST',
		url: 'https://dry-savannah-75818.herokuapp.com/update',
		//This URL will need change for HEROKU app: http://localhost:3000/
		//https://dry-savannah-75818.herokuapp.com/update
		data: person,
		error: function (xhr, status, error) {
					console.log("ERROR\n");
		}
	});
}