var logout = document.getElementById("logout");

logout.addEventListener("click", function logout(event) {
	sessionStorage.clear();
	location.href = "/";
});

/* A wild bear blocekd your path! Or you just reached the end... */
