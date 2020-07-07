//var socket = io.connect(WS_SERVER);

var form = document.getElementById("login-form");
var button = document.getElementById("login-button");
var signup = document.getElementById("signup-button")
var guest = document.getElementById("guest-button");;
var errordiv = document.getElementById("error-div");
					
var username = document.getElementById("username");
var password = document.getElementById("password");
					
form.addEventListener("click", function (event) {
	event.preventDefault();
});

signup.addEventListener("click", function (event) {
	event.preventDefault();
	location.href = `${PUBLIC}/register.html`;
});

function login(event)
{
	event.preventDefault();
	if (username.value.length > 0 && username.value.length <= 32 && password.value.length > 0)
	{
		PlayFabClientSDK.LoginWithEmailAddress({
			"TitleId": GAME_ID,
			"Email": username.value,
			"Password": password.value
		}, function (res, err) {
			if (err)
			{
				error("user");
				return 1;
			}
			sessionStorage.setItem("ticket", res.data.SessionTicket);
			location.href = "/play.html";
		});
		button.disabled = true;
	}
}

button.addEventListener("click", login);
form.addEventListener("submit", login);
guest.addEventListener("click", function (event) {
	sessionStorage.setItem("ticket", "guest");
	location.href = "/play.html";
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
