var person;
function capitalizeFirstLetter(string) 
{
   	return string.charAt(0).toUpperCase() + string.slice(1);
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
		url: 'http://localhost:3000/getPerson?first=' + name[0] + '&last=' + name[1],
		//This URL will need change for HEROKU app: http://localhost:3000/getFamily?first=
		//https://dry-savannah-75818.herokuapp.com/getFamily?first=
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
		url: 'http://localhost:3000/update',
		//This URL will need change for HEROKU app: http://localhost:3000/getFamily?first=
		//https://dry-savannah-75818.herokuapp.com/getFamily?first=
		data: person,
		error: function (xhr, status, error) {
					console.log("ERROR\n");
		}
	});
}