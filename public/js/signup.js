var form = document.getElementById("signup-form");
var button = document.getElementById("signup-button");
var errordiv = document.getElementById("error-div");
					
var username = document.getElementById("username");
var password = document.getElementById("password");
var email = document.getElementById("email");

var cancel = document.getElementById("cancel");

function signup(event)
{
	event.preventDefault();
	PlayFabClientSDK.RegisterPlayFabUser({
		"TitleId": GAME_ID,
		"DisplayName": username.value,
		"Password": password.value,
		"Email": email.value,
		"RequireBothUsernameAndEmail": false
	}, function (res, err) {
		if (err)
		{
			error("user");
			return 1;
		}
		location.href = "/index.html";
	});
}
 

button.addEventListener("click", signup);
form.addEventListener("submit", signup);
cancel.addEventListener("click", function cancel(event) {
	event.preventDefault();
	location.href = "/";
});
					
function error(data)
{
	if (data === "user")
	{
		errordiv.innerHTML = `<a class="a" style="color: #ff6e6e;">Invalid username or password.</a>`;
	} else if (data === "server")
	{
		errordiv.innerHTML = `<a class="a" style="color: #ff6e6e;">An error occured with the game's server. Please try again later.</a>`;
	} else
	{
		errordiv.innerHTML = `<a class="a" style="color: #ff6e6e;">Unknown error, please contact the game's team.</a>`;
	}
}

/* A wild bear blocekd your path! Or you just reached the end... */
