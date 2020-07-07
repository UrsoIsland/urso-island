const fs = require("fs");
const https = require("https");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const helmet = require("helmet");
const compression = require("compression");
const PlayFab = require("playfab-sdk/Scripts/PlayFab/PlayFab");
const PlayFabServer = require("playfab-sdk/Scripts/PlayFab/PlayFabServer");
const PlayFabAdmin = require("playfab-sdk/Scripts/PlayFab/PlayFabAdmin");
const bot = new (require("./urso_bot"))(process.env.TOKEN);
const Discord = require("discord.js");

app.use(express.static("public"));
app.use(compression());
app.use(helmet());

/*
 * Configuration file used by the client.
 * You will need to replace the GAME_ID constant with your PlayFab Title ID.
 */
app.use("/js/config.js", function (req, res, next) {
	res.set("Content-Type", "application/javascript");
	res.type("application/javascript");
	res.send(`const PUBLIC = "${process.env.PORT ? (process.env.URL || "https://exkcuipa.herokuapp.com") : "http://localhost:8900"}"; const WS_URL = "${process.env.PORT ? (process.env.URL || "https://exkcuipa.herokuapp.com") : "http://localhost:8900"}"; const GAME_ID = "F53E0";`);
});

/* In your face Heroku! "API" to mantain the moderation bot alive. */
app.use("/api/alive.api", function (req, res, next) {
	res.set("Content-Type", "application/json");
	res.type("application/json");
	res.send(`{"msg": "ok"}`);
});

/* PlayFab configuration. */
PlayFab.settings.titleId = process.env.GAME_ID || process.argv[2];
PlayFab.settings.developerSecretKey = process.env.API_KEY || process.argv[3];

/* Get ready to be offended. */
var dirty = JSON.parse(fs.readFileSync("dirty.json")).words;

/* Feel free to add your own rooms here. */
var island = {
	"rooms": {
		"town": {
			"users": new Object(),
			"coins": new Array(),
			"collisions": new Array()
		},
		"cafe": {
			"users": new Object(),
			"coins": new Array(),
			"collisions": new Array()
		},
		"clothing": {
			"users": new Object(),
			"coins": new Array(),
			"collisions": new Array()
		}
	}
};

var catalog = new Array();

/* Who doesn't love the confused emoji? */
var emojis = ["normal", "cool", "angry", "sob", "confused", "love"];

function add_coins(room)
{
	var i = 0;
	while (i < 6)
	{
		island.rooms[room].coins.push({
			"x": Math.floor(Math.random() * 800),
			"y": Math.floor(Math.random() * (480 - 260)) + 260
		});
		i++;
	}
}

/* Thank you very much, Pythagoras. */
function get_dist(pos1, pos2)
{
	var y = pos2.y - pos1.y;
	var x = pos2.x - pos1.x;
	return Math.sqrt(x * x + y * y);
}

/* You are warned: the following code may cause headache, sickness and JavaScript memes. */

function set_collisions()
{
	var i = 0;
	while (i <= 400)
	{
		island.rooms.town.collisions.push(270 - i * 0.15);
		i++;
	}
	i = 0;
	while (i <= 400)
	{
		island.rooms.town.collisions.push(211 + i * 0.15);
		i++;
	}
	i = 0;
	while (i <= 210)
	{
		island.rooms.clothing.collisions.push(364 - i * 0.48);
		i++;
	}
	while (i <= 343)
	{
		island.rooms.clothing.collisions.push(215);
		i++;
	}
	while (i <= 695)
	{
		island.rooms.clothing.collisions.push(238);
		i++;
	}
	i = 0;
	while (i <= 205)
	{
		island.rooms.clothing.collisions.push(238 + i * 0.2);
		i++;
	}
	i = 0;
	while (i <= 400)
	{
		island.rooms.cafe.collisions.push(248 - i * 0.1);
		i++;
	}
	i = 0;
	while (i <= 400)
	{
		island.rooms.cafe.collisions.push(208 + i * 0.1);
		i++;
	}
}

function index(arr, thing)
{
	return arr.findIndex(function (tmp) {
		return tmp.id == thing.id;
	});
}

/* Common (former) name: "errorify". */
function universalize(string)
{
	var new_string = string;
	new_string = new_string.toLowerCase();
	new_string = new_string.replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u");
	new_string = new_string.replace(/ä/g, "a").replace(/ë/g, "e").replace(/ï/g, "i").replace(/ö/g, "o").replace(/ü/g, "u");
	new_string = new_string.replace(/â/g, "a").replace(/ê/g, "e").replace(/î/g, "i").replace(/ô/g, "o").replace(/û/g, "u");
	new_string = new_string.replace(/à/g, "a").replace(/è/g, "e").replace(/ì/g, "i").replace(/ò/g, "o").replace(/ù/g, "u");
	new_string = new_string.replace(/0/g, "o").replace(/1/g, "i").replace(/2/g, "z").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t");
	new_string = new_string.replace(/\|_\|/g, "u").replace(/\|2/g, "r").replace(/\|3/g, "b").replace(/\|</g, "k").replace(/\|-\|/g, "h").replace(/\|_/g, "l").replace(/\!/g, "i").replace(/\\\\\/\\\\\//g, "w").replace(/\[\)/g, "d").replace(/\|\\\\\|/g, "n").replace(/@/g, "a");
	new_string = new_string.replace(/\*/g, " ").replace(/\+/g, " ").replace(/_/g, " ").replace(/-/g, " ").replace(/&/g, " ").replace(/%/g, " ").replace(/=/g, " ").replace(/#/g, " ").replace(/·/g, " ").replace(/'/g, " ").replace(/"/g, " ").replace(/`/g, " ").replace(/\./g, " ");
	new_string = new_string.replace(/¢/g, "c").replace(/ł/g, "l").replace(/€/g, "e").replace(/\$/g, "s");
	return new_string;
}

function check_dirty(chat)
{
	var is_dirty;
	dirty.forEach(function (word) {
		if (is_dirty)
		{
			return;
		}
		if (universalize(chat).match(new RegExp(`\\b(${universalize(word)})\\b`)))
		{
			is_dirty = `"${chat}" matched ${word}.`;
		}
	});
	return is_dirty;
}

/* Do you think this is a callback hell? */
function login(ticket, player, socket, catalog)
{
	PlayFabServer.AuthenticateSessionTicket({
		"SessionTicket": ticket
	}, function (err, res) {
		if (!err)
		{
			var pfid = res.data.UserInfo.PlayFabId;
			PlayFabServer.GetUserAccountInfo({
				"PlayFabId": pfid
			}, function (err, res) {
				if (!err)
				{
					var username = res.data.UserInfo.TitleInfo.DisplayName;
					PlayFabServer.GetUserInventory({
						"PlayFabId": pfid
					}, function (err, res) {
						if (!err)
						{
							var coins = res.data.VirtualCurrency.UR;
							var inventory = new Array();
							res.data.Inventory.forEach(function (item) {
								inventory.push(item.ItemId);
							});
							PlayFabServer.GetUserData({
								"PlayFabId": pfid
							}, function (err, res) {
								if (!err)
								{
									if (res.data.Data.badges)
									{
										player.badges = JSON.parse(res.data.Data.badges.Value);
									} else
									{
										player.badges = new Array();
									}
									player.muted = res.data.Data.mute ? res.data.Data.mute.Value > Math.floor(new Date() / 1000) : false;
									player.username = username;
									player.bear = "grizzly";
									player.pos = {
										"x": 400 - 123 / 2.5 / 2,
										"y": 280 - 197 / 2.5 / 2
									};
									player.id = pfid;
									player.coins = coins;
									player.inventory = inventory;
									socket.emit("login", {
										/* Player data */
										"username": username,
										"coins": coins,
										"bear": player.bear,
										"inventory": inventory,
										/* Catalog */
										"catalog": catalog,
										/* Badges */
										"badges": player.badges
									});
								}
							});
						}
					});
				}
			});
		}
	});
}

/* Back to the normallity? Ha! You're so innocent... */

function get_catalog()
{
	PlayFabServer.GetCatalogItems({
		"CatalogVersion": "v0.1.0"
	}, function (err, res) {
		if (!err)
		{
			res.data.Catalog.forEach(function (item) {
				catalog.push({
					"id": item.ItemId,
					"price": item.VirtualCurrencyPrices.UR
				});
			});
		}
	});
}

function join_room(room, socket, player, old)
{
	if (room in island.rooms && player.username)
	{
		if (old && old != "")
		{
			io.sockets.in(old).emit("bye", player);
			socket.leave(old);
			delete island.rooms[old].users[player.username];
			player.pos = {
				"x": 400 - 123 / 2.5 / 2,
				"y": 280 - 197 / 2.5 / 2
			};
		}
		island.rooms[room].users[player.username] = player;
		io.sockets.in(room).emit("welcome", player);
		socket.join(room);
		socket.emit("join", {
			"name": room,
			"users": island.rooms[room].users,
			"coins": island.rooms[room].coins
		});
		return room;
	}
	return old;
}

var guests = 0;

/* Why in the global scope? Why not? */
add_coins("town");
set_collisions("town");
get_catalog();

/* Here's your karma: */
io.on("connection", function (socket) {
	console.log("Connection received.");
	var player = new Object();
	var room = new String();
	var buying = false;
	socket.on("disconnect", function () {
		console.log("User disconnect.");
		if (player.username)
		{
			io.sockets.in(room).emit("bye", player);
			if (player.guest)
			{
				guests--;
			}
			delete island.rooms[room].users[player.username];
		}
	});
	socket.on("login", function (data) {
		if (!data)
		{
			return -1;
		}
		if (data.ticket != "guest")
		{
			login(data.ticket, player, socket, catalog);
			setInterval(function () {
				PlayFabServer.GetUserData({
					"PlayFabId": player.id
				}, function (err, res) {
					if (!err)
					{
						player.muted = res.data.Data.mute ? res.data.Data.mute.Value > Math.floor(new Date() / 1000) : false
					}
				});
			}, 60000);
		} else if (guests < 16)
		{
			guests++;
			player.guest = true;
			player.username = `Guest${guests}`;
			player.bear = "grizzly";
			player.pos = {
				"x": 400 - 123 / 2.5 / 2,
				"y": 280 - 197 / 2.5 / 2
			};
			player.coins = 0;
			socket.emit("login", {
				/* Player data */
				"username": player.username,
				"coins": 100,
				"bear": player.bear,
				"guest": true
			});
		}
	});
	socket.on("join", function (data) {
		if (!data)
		{
			return -1;
		}
		if (!data.room)
		{
			return -1;
		}
		room = join_room(data.room, socket, player, room);
	});
	socket.on("chat", function (data) {
		if (!data)
		{
			return -1;
		}
		if (!(data.message && player.username && data.message.length <= 64 && !player.muted))
		{
			return -1;
		}
		var is_dirty = check_dirty(data.message);
		if (is_dirty)
		{
			var mod_req = https.request({
				"host": "discord.com",
				"path": process.env.WEBHOOK,
				"method": "POST",
				"headers": {
					"Content-Type": "application/json"
				}
			});
			mod_req.write(JSON.stringify({
				"username": "Urso Bot",
				"avatar_url": "https://exkcuipa.herokuapp.com/media/icon_150.png",
				"embeds": [
					{
						"title": `${player.username}#${player.id}`,
						"color": "16711680",
						"fields": [
							{
								"name": "Complete message",
								"value": data.message
							},
							{
								"name": "Warning",
								"value": is_dirty
							},
						]
					}
				]
			}));
			mod_req.end();
			return -1;
		}
		if (data.message[0] == "/")
		{
			var match = data.message.match(/^\/join \s*(.*)\s*$/);
			if (match && match[1] in island.rooms)
			{
				room = join_room(match[1], socket, player, room);
			}
		} else if (data.message[0] != "/" && !player.guest)
		{
			io.sockets.in(room).emit("chat", {
				"username": player.username,
				"message": data.message
			});
		}
	});
	socket.on("emoji", function (data) {
		if (!data)
		{
			return -1;
		}
		if (!(data.emoji && typeof(data.emoji) == "string" && emojis.indexOf(data.emoji) != -1))
		{
			return -1;
		}
		io.sockets.in(room).emit("sendemoji", {
			"username": player.username,
			"emoji": data.emoji
		});
	});
	socket.on("click", function (data) {
		if (!data)
		{
			return -1;
		}
		if (!(data.x && data.y && player.username && room))
		{
			return -1;
		}
		var tmp = data;
		if (tmp.x > 800 - 123 / 2.5 / 2)
		{
			tmp.x = 800 - 123 / 2.5 / 2;
		} else if (tmp.x < 123 / 2.5 / 2)
		{
			tmp.x = 123 / 2.5 / 2;
		}
		if (tmp.y > 480 - 16)
		{
			tmp.y = 480 - 16;
		} else if (tmp.y < 197 - 197 / 1.5)
		{
			tmp.y = 197 - 197 / 1.5;
		}
		if (tmp.y <= island.rooms[room].collisions[Math.floor(tmp.x)])
		{
			tmp.y = island.rooms[room].collisions[Math.floor(tmp.x)];
		}
		island.rooms[room].users[player.username].pos = tmp;
		io.sockets.in(room).emit("move", {
			"username": player.username,
			"pos": {
				"x": tmp.x,
				"y": tmp.y
			}
		});
	});
	socket.on("plz", function (data) {
		var tmp = data;
		if (!data)
		{
			return -1;
		}
		if (!(tmp.x && tmp.y && player.username))
		{
			return -1;
		}
		island.rooms[room].coins.forEach(function (coin) {
			if (get_dist(tmp, coin) < 96 && get_dist(player.pos, coin) < 96)
			{
				socket.emit("gg", 1);
				io.sockets.in(room).emit("nsgg", island.rooms[room].coins.indexOf(coin));
				if (!player.guest)
				{
					PlayFabServer.AddUserVirtualCurrency({
						"Amount": 1,
						"PlayFabId": player.id,
						"VirtualCurrency": "UR"
					});
					player.coins += 1;
					if (player.badges.indexOf("coin") == -1)
					{
						player.badges.push("coin");
						PlayFabServer.UpdateUserData({
							"Data": {
								"badges": JSON.stringify(player.badges)
							},
							"PlayFabId": player.id
						});
						io.in(room).emit("badge", {
							"username": player.username,
							"badge": "coin"
						});
					}
				}
				island.rooms[room].coins.splice(island.rooms[room].coins.indexOf(coin), 1);
			}
		});
	});
	socket.on("buy", function (data) {
		if (!data)
		{
			return -1;
		}
		if (!(typeof(data.id) == "string" && index(catalog, data) && player.username))
		{
			return -1;
		}
		if (buying)
		{
			return -1;
		}
		PlayFabServer.GetUserInventory({
			"PlayFabId": player.id
		}, function (err, res) {
			if (!err)
			{
				var dup = false;
				res.data.Inventory.forEach(function (item) {
					if (item.ItemId == data.id)
					{
						dup = true;
					}
				});
				if (!dup && player.coins - catalog[index(catalog, data)].price >= 0)
				{
					buying = true;
					PlayFabServer.SubtractUserVirtualCurrency({
						"Amount": catalog[index(catalog, data)].price,
						"PlayFabId": player.id,
						"VirtualCurrency": "UR"
					}, function (err, res) {
						if (!err)
						{
							player.coins -= catalog[index(catalog, data)].price;
							socket.emit("gg", -catalog[index(catalog, data)].price);
							PlayFabServer.GrantItemsToUser({
								"ItemIds": [data.id],
								"PlayFabId": player.id
							}, function (err, res) {
								if (!err)
								{
									socket.emit("buy", data.id);
									buying = false;
									if (player.badges.indexOf("item") == -1)
									{
										player.badges.push("item");
										PlayFabServer.UpdateUserData({
											"Data": {
												"badges": JSON.stringify(player.badges)
											},
											"PlayFabId": player.id
										});
										io.in(room).emit("badge", {
											"username": player.username,
											"badge": "item"
										});
									}
								}
							});
						}
					});
				}
			}
		});
	});
	socket.on("em", function (data) {
		io.sockets.in(room).emit("em", player.username);
	});
	/* More handlers */
});

setInterval(function () {
	add_coins("town");
	io.sockets.in("town").emit("more", island.rooms.town.coins);
}, 300000);

http.listen(process.env.PORT || 8900, function () {
	console.log(`Sever listening on http://localhost:${process.env.PORT || 8900}.`);
	setInterval(function () {
		https.request({
			"host": `${process.env.PORT ? (process.env.URL || "https://exkcuipa.herokuapp.com") : "http://localhost:8900"}`,
			"path": "/api/alive.api",
			"method": "GET"
		}).end();
	}, 1680000);
});

/* A wild bear blocekd your path! Or you just reached the end... */
