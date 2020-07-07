/*
 * I will not comment/document this, you will need to read the tricky
 * single-line comments to understand something (not guaranteed):
 * 
 */

var stop = false;
var chat = document.getElementById("chat");
var send = document.getElementById("send");
var message = document.getElementById("message");

var characters = new Array();
var menu = "";
var emotemenu = false;
var catalog = new Array();
var room = new Object();
var player = new Object();
var counter = new Object();
var looping = false;
var badges = new Image();
var menu_bg = new Image();
var items = new Image();
var emojis = new Image();
var bears = new Image();
var ui = new Image();
var teleporting = false;
var new_room = false;
var say = new String();
var first_room = true;
var audio_interval;

var hidehud = false;
var hidenames = false;
var volume = 4; // 0 -> 0, 1 -> 0.4, 2 -> 0.6, 3 -> 0.8, 4 -> 1

var island = {
	"ctx": document.getElementById("island").getContext("2d"),
	"canvas": document.getElementById("island"),
	"rooms": {
		"town": {
			"users": new Object(),
			"coins": new Array()
		},
		"cafe": {
			"users": new Object(),
			"coins": new Array()
		},
		"clothing": {
			"users": new Object(),
			"coins": new Array()
		}
	}
};

var map = {
	"town": {
		"clothing": {
			"x": 210,
			"y": 210
		},
		"cafe": {
			"x": 560,
			"y": 210
		}
	},
	"cafe": {
		"town": {
			"x": 370,
			"y": 210
		}
	},
	"clothing": {
		"town": {
			"x": 370,
			"y": 210
		}
	}
};

var artwork = {
	"bear": {
		"icons": "/media/bears/bear_icons.png",
		"grizzly": {
			"spritesheet": "/media/bears/bear_grizzly.png",
			"json": "/media/bears/bear_grizzly.json",
			"data": new Object()
		}
	},
	"town": {
		"foreground": "/media/rooms/town_fg.png",
		"sprites": "/media/rooms/town_obj.png",
		"background": "/media/rooms/town_bg.png",
		"music": "/media/rooms/town_m.mp3"
		"json": "/media/rooms/town_obj.json",
		"data": new Object()
	},
	"cafe": {
		"foreground": new String(),
		"sprites": new String(),
		"background": "/media/rooms/cafe_bg.png",
		"music": "/media/rooms/cafe_m.mp3"
	},
	"clothing": {
		"foreground": new String(),
		"sprites": "/media/rooms/clothing_obj.png",
		"background": "/media/rooms/clothing_bg.png",
		"json": "/media/rooms/clothing_obj.json",
		"data": new Object(),
		"music": "/media/rooms/clothing_m.mp3"
	},
	"ui": {
		"hud": "/media/ui/hud.png",
		"bg": "/media/ui/bg.png",
		"emojis": "/media/ui/emojis.png",
		"emojis_json": "/media/ui/emojis.json",
		"emojis_data": new Object(),
		"badges": "/media/ui/badges.png",
		"badges_json": "/media/ui/badges.json",
		"badges_data": new Object()
	},
	"items": {
		"sprites": "/media/items/items.png",
		"json": "/media/items/items.json",
		"data": new Object(),
		"icons": "/media/items/item_icons.png",
		"icons_json": "/media/items/item_icons.json",
		"icons_data": new Object()
	}
}

class Character
{
	constructor(src, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, speed, dir)
	{
		this.src = src;
		this.image = new Image();
		this.image.src = src;
		this.speed = speed;
		this.dir = dir;
		this.sWidth = sWidth;
		this.sHeight = sHeight;
		this.sx = sx;
		this.sy = sy;
		this.dx = dx;
		this.dy = dy;
		this.dWidth = dWidth;
		this.dHeight = dHeight;
	}

	draw()
	{
		island.ctx.drawImage(this.image, this.sx, this.sy, this.sWidth, this.sHeight, this.dx, this.dy, this.dWidth, this.dHeight);
	}
}

class Player
{
	constructor(username, bear, pos)
	{
		this.username = username;
		this.bear = bear;
		this.message = new String();
		this.emoji = new String();
		var tmp = artwork.bear[bear];
		var h = tmp.data.front.h;
		var w = tmp.data.front.w;
		this.h = h / 2.5;
		this.w = w / 2.5;
		if (pos)
		{
			this.pos = {
				"x": pos.x - this.w / 2,
				"y": pos.y - this.h
			};
		} else
		{
			this.pos = {
				"x": 400 - this.w / 2,
				"y": 280 - this.h
			};
		}
		this.char = new Character(tmp.spritesheet, tmp.data.front.x, tmp.data.front.y, w, h, this.pos.x, this.pos.y, w / 2.5, h / 2.5);
		this.vpos = {
			"x": this.pos.x,
			"y": this.pos.y
		};
	}
	
	drawChar()
	{
		this.char.draw();
		if (hidenames == false) {
			island.ctx.font = "14px sans-serif";
			island.ctx.fillText(this.username, this.pos.x - island.ctx.measureText(this.username).width / 2 + this.char.dWidth / 2, this.pos.y + this.h + 16);
		}
	}

	drawBubble()
	{
		if (this.message != "")
		{
			var tmp = island.ctx.measureText(this.message);
			island.ctx.drawImage(ui, 257, 65, 185, 69, this.pos.x - 67, this.pos.y - this.h + 3, 185, 69);
			island.ctx.font = "15px sans-serif";
			island.ctx.fillText(this.message, this.pos.x - tmp.width / 2 + this.char.dWidth / 2, this.pos.y - this.h + 22 * 2);
		}
		if (this.emoji != "")
		{
			island.ctx.drawImage(ui, 257, 65, 185, 69, this.pos.x - 67, this.pos.y - this.h + 3, 185, 69);
			island.ctx.drawImage(emojis, artwork.ui.emojis_data[this.emoji].x, artwork.ui.emojis_data[this.emoji].y, 64, 64, this.pos.x - 3, this.pos.y - this.h + 8, 55, 55);
		}
	}
}

var socket = io(WS_URL, {
	autoConnect: true,
	transports: ["websocket"]
});

function main()
{
	island.ctx.fillStyle = "white";
	island.ctx.font = "24px Coolvetica";
	island.ctx.fillText("Loading resources...", 400 - island.ctx.measureText("Loading resources...").width / 2, 240);
	island.ctx.font = "18px Coolvetica";
	island.ctx.fillText("Remember to interact with the game to play the room music!", 400 - island.ctx.measureText("Remember to interact with the game to play the room music!").width / 2, 275);
	island.ctx.fillStyle = "black";
	fetch(artwork.bear.grizzly.json).then(function (res) {
		return res.json();
	}).then(function (data) {
		artwork.bear.grizzly.data = data;
		fetch(artwork.items.json).then(function (res) {
			return res.json();
		}).then(function (data) {
			artwork.items.data = data;
			fetch(artwork.items.icons_json).then(function (res) {
				return res.json();
			}).then(function (data) {
				artwork.items.icons_data = data;
				fetch(artwork.clothing.json).then(function (res) {
					return res.json();
				}).then(function (data) {
					artwork.clothing.data = data.sprites;
					fetch(artwork.ui.emojis_json).then(function (res) {
						return res.json();
					}).then(function (data) {
						artwork.ui.emojis_data = data;
						fetch(artwork.ui.badges_json).then(function (res) {
							return res.json();
						}).then(function (data) {
							artwork.ui.badges_data = data;
							fetch(artwork.town.json).then(function (res) {
								return res.json();
							}).then(function (data) {
								artwork.town.data = data;
								artwork.ui.badges_data = data;
								badges.src = artwork.ui.badges;
								items.src = artwork.items.icons;
								menu_bg.src = artwork.ui.bg;
								emojis.src = artwork.ui.emojis;
								bears.src = artwork.bear.icons;
								ui.src = artwork.ui.hud;
								socket.emit("login", {
									"ticket": sessionStorage.getItem("ticket")
								});
							});
						});
					});
				});
			});
		});
	});
}

socket.on("login", function login(data) {
	console.log(`Logged in as ${data.username}.`);
	player = data;
	catalog = data.catalog;
	socket.emit("join", {
		"room": "town"
	});
});

socket.on("join", function join(data) {
	island.ctx.clearRect(0, 0, 800, 480);
	island.ctx.fillStyle = "white";
	island.ctx.font = "24px Coolvetica";
	island.ctx.fillText("Loading resources...", 400 - island.ctx.measureText("Loading resources...").width / 2, 240);
	island.ctx.font = "18px Coolvetica";
	island.ctx.fillText("Remember to interact with the game to play the room music!", 400 - island.ctx.measureText("Remember to interact with the game to play the room music!").width / 2, 275);
	island.ctx.fillStyle = "black";
	var old_room = room;
	room = data;
	emotemenu = false;
	menu = "";
	island.ctx.clearRect(0, 0, 800, 480);
	room.fg = new Character(artwork[room.name].foreground, 0, 0, 800, 480, 0, 0, 800, 480);
	room.bg = new Character(artwork[room.name].background, 0, 0, 800, 480, 0, 0, 800, 480);
	island.rooms[room.name].coins = data.coins;
	island.rooms[room.name].users = {};
	room.bg.image.addEventListener("load", function () {
		room.bg.draw();
		Object.keys(data.users).forEach(function (key) {
			var user = data.users[key];
			island.rooms[room.name].users[key] = new Player(user.username, user.bear, user.pos);
			island.rooms[room.name].users[key].drawChar();
		});
		teleporting = false;
		setTimeout(function () {
			new_room = true;
			setTimeout(function () {
				new_room = false;
			}, 5000);
		}, 500);
		if (old_room.audio)
		{
			old_room.audio.pause();
			clearInterval(audio_interval);
		}
		if (artwork[room.name].music != "")
		{
			console.log("Enjoy this amazing music by Faraway!");
			room.audio = new Audio(artwork[room.name].music);
			room.audio.volume = volume ? volume / 4 : 0;
			room.audio.play();
			audio_interval = setInterval(function () {
				room.audio.volume = volume ? volume / 4 : 0;
				room.audio.play();
			}, 10000);
		} else
		{
			room.audio = null;
		}
		if (room.name != "town")
		{
			first_room = false;
		}
		if (!looping)
		{
			loop();
			looping = true;
		}
	});
});

socket.on("welcome", function welcome(data) {
	island.rooms[room.name].users[data.username] = new Player(data.username, data.bear);
	console.log(`Everyone welcome ${data.username}!`);
});

socket.on("bye", function bye(data) {
	delete island.rooms[room.name].users[data.username];
	console.log(`R.I.P. ${data.username}.`);
});

function send_chat(event)
{
	event.preventDefault();
	if (message.value)
	{
		socket.emit("chat", {
			"message": message.value
		});
		message.value = "";
	}
}

function buy(item)
{
	console.log(`BUY ${item.id} by UR$ ${item.price}.`);
	socket.emit("buy", item);
}

send.addEventListener("click", send_chat);
chat.addEventListener("submit", send_chat);

socket.on("chat", function chat(data) {
	var user = island.rooms[room.name].users[data.username];
	user.message = `${data.message}`;
	setTimeout(function () {
		user.message = "";
	}, 5000);
	console.log(`ðŸ’¬ ${data.username}: ${data.message}.`);
});

socket.on("sendemoji", function chat(data) {
	var user = island.rooms[room.name].users[data.username];
	user.emoji = `${data.emoji}`;
	setTimeout(function () {
		user.emoji = "";
	}, 5000);
	console.log(`ðŸ’¬ ${data.username}: emoji_${data.emoji}.`);
});

socket.on("gg", function gg(data) {
	console.log(`Money!!`);
	player.coins += data;
});

socket.on("nsgg", function nsgg(data) {
	island.rooms[room.name].coins.splice(data, 1);
});

socket.on("buy", function buy(data) {
	player.inventory.push(data);
});

socket.on("more", function more_coins(data) {
	data.forEach(function (coin) {
		island.rooms[room.name].coins.push(coin);
	});
});

socket.on("badge", function badge(data) {
	player.badges.push(data.badge);
});

function get_angle(pos1, pos2)
{
	return Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x) * 180 / Math.PI;
}

function get_dist(pos1, pos2)
{
	var y = pos2.y - pos1.y;
	var x = pos2.x - pos1.x;
	return Math.sqrt(x * x + y * y);
}

function get_trigger(pos)
{
	var trigger_room;
	var new_pos = {
		"x": pos.x + 123 / 2.5,
		"y": pos.y + 197 / 2.5
	};
	Object.keys(map[room.name]).forEach(function (tmp) {
		if (get_dist(map[room.name][tmp], new_pos) < 48)
		{
			trigger_room = tmp;
		}
	});
	return trigger_room;
}

function loop()
{
	island.ctx.clearRect(0, 0, 800, 400);
	room.bg.draw();
	island.rooms[room.name].coins.forEach(function (coin) {
		island.ctx.drawImage(ui, 130, 0, 64, 64, coin.x, coin.y, 32, 32);
	});
	var chars = new Array();
	Object.keys(island.rooms[room.name].users).forEach(function (key) {
		chars.push(island.rooms[room.name].users[key]);
	});
	if (room.name == "clothing")
	{
		artwork.clothing.data.forEach(function (key) {
			chars.push(new Character(artwork.clothing.sprites, key.x, key.y, key.w, key.h, key.d.x, key.d.y, key.w, key.h));
		});
		var mike_pos = {
			"x": 658,
			"y": 259
		};
	} else if (room.name == "town")
	{
		artwork.town.data.forEach(function (key) {
			chars.push(new Character(artwork.town.sprites, key.x, key.y, key.w, key.h, key.d.x, key.d.y, key.w, key.h));
		});
	}
	chars.sort(function (a, b) {
		var ay;
		var by;
		if (a instanceof Player)
		{
			ay = a.char.dy + a.char.dHeight / 2;
		} else if (a instanceof Character)
		{
			ay = a.dy + a.dHeight / 2;
		}
		if (b instanceof Player)
		{
			by = b.char.dy + b.char.dHeight / 2;
		} else if (b instanceof Character)
		{
			by = b.dy + b.dHeight / 2;
		}
		return ay - by;
	});
	chars.forEach(function (char) {
		if (char instanceof Player)
		{
			var nx = char.vpos.x - char.pos.x;
			var ny = char.vpos.y - char.pos.y;
			var dist = Math.sqrt(nx * nx + ny * ny);
			if (dist >= 5)
			{
				char.pos.x += ((nx / dist) * 5);
				char.pos.y += ((ny / dist) * 5);
				char.char.dx += ((nx / dist) * 5);
				char.char.dy += ((ny / dist) * 5);
				if (player.username == char.username)
				{
					var tmp = char.pos;
					island.rooms[room.name].coins.forEach(function (coin) {
						if (get_dist(tmp, coin) < 96)
						{
							socket.emit("plz", tmp);
						}
					});
					if (get_trigger(tmp) && get_dist(char.vpos, tmp) < 32 && !teleporting)
					{
						teleporting = true;
						socket.emit("join", {
							"room": get_trigger(tmp)
						});
					}
					if (room.name == "clothing" && !new_room && say == "")
					{
						if (get_dist(tmp, mike_pos) < 96)
						{
							say = `Hello ${player.username}!`;
							setTimeout(function () {
								say = new String();
							}, 5000);
						}
					}
				}
			}
			char.drawChar();
		} else if (char instanceof Character)
		{
			char.draw();
		}
	});
	Object.keys(island.rooms[room.name].users).forEach(function (key) {
		island.rooms[room.name].users[key].drawBubble();
	});

	if (room.name == "clothing" && new_room)
	{
		island.ctx.drawImage(ui, 257, 65, 185, 69, 570, 130, 185, 69);
		island.ctx.font = "15px sans-serif";
		island.ctx.fillText("Welcome to the", 607.5, 160);
		island.ctx.fillText("clothing store!", 570 + island.ctx.measureText("clothing store!").width / 2, 175);
	} else if (room.name == "cafe" && new_room)
	{
		// R.I.P. Daniel
		island.ctx.drawImage(ui, 257, 65, 185, 69, 450, 70, 185, 69);
		island.ctx.font = "15px sans-serif";
		island.ctx.fillText("I'm so bored...", 450 + island.ctx.measureText("I'm so bored...").width / 2, 110);
	}
	if (room.name == "clothing" && !(say == "") && !new_room)
	{
		island.ctx.drawImage(ui, 257, 65, 185, 69, 570, 130, 185, 69);
		island.ctx.font = "15px sans-serif";
		island.ctx.fillText(`Hello ${player.username}!`, 662.5 - island.ctx.measureText(`Hello ${player.username}!`).width / 2, 170);
	}
	room.fg.draw();

	var bear = artwork.bear.grizzly;

	if (emotemenu)
	{
		island.ctx.globalAlpha = 0.8;
		island.ctx.fillStyle = "white";
		island.ctx.fillRect(20, 208, 43, 208);
		island.ctx.fillStyle = "black";
		island.ctx.globalAlpha = 1.0;
		var i = 1;
		Object.keys(artwork.ui.emojis_data).forEach(function (emoji) {
			island.ctx.drawImage(emojis, artwork.ui.emojis_data[emoji].x, artwork.ui.emojis_data[emoji].y, 64, 64, 25, 176 + i * 32, 32, 32);
			i++;
		});
	}

	if (hidehud == false)
	{
		island.ctx.drawImage(ui, 0, 0, 64, 64, 725, 410, 64, 64);
		island.ctx.drawImage(ui, 441, 66, 64, 64, 725, 5, 64, 64);
		island.ctx.drawImage(bears, 0, 0, 96, 96, 725, 350, 64, 64);
		island.ctx.drawImage(ui, 396, 0, 64, 64, 10, 410, 64, 64);

		if (room.name == "clothing")
		{
			island.ctx.drawImage(ui, 66, 0, 64, 64, 663, 410, 64, 64);
		}
	}

	if (hidehud == true)
	{
		island.ctx.globalAlpha = 0.2;
		island.ctx.drawImage(ui, 441, 66, 64, 64, 725, 5, 64, 64);
		island.ctx.globalAlpha = 1.0;
	}

	if (menu)
	{
		if (menu == "settings")
		{
			if (hidehud == false)
			{
				island.ctx.drawImage(ui, 0, 68, 256, 96, 16, 8, 102.3, 38.4);
				island.ctx.fillStyle = "#ffd800";
				island.ctx.font = "bold 20px Coolvetica";
				island.ctx.fillText(player.coins, 64, 34);
				island.ctx.fillStyle = "#000000";
			}
		}

		var w = bear.data["front"].w;
		var h = bear.data["front"].h;
		var inv_urso;
		var icons = artwork.items.icons_data;
		var i = 1;
		
		if (menu == "settings")
		{
			island.ctx.globalAlpha = 0.8;
		} else
		{
			island.ctx.globalAlpha = 0.6;
		}
		island.ctx.fillRect(0, 0, 800, 480);
		island.ctx.globalAlpha = 1.0;
		if (menu == "inv")
		{
			island.ctx.drawImage(menu_bg, 0, 0, 720, 400, 40, 40, 720, 400);
			inv_urso = new Character(bear.spritesheet, bear.data.front.x, bear.data.front.y, bear.data.front.w, bear.data.front.h, 96, 148, w, h);
			player.inventory.forEach(function (item) {
				var y = 128;
				var x = 254 + i * 60 + i * 16;
				if (i > 5)
				{
					y += 80;
					x -= 5 * 60 + 5 * 16;
				}
				island.ctx.drawImage(ui, 264, 0, 64, 64, x, y, 60, 60);
				island.ctx.drawImage(items, icons[item].x, icons[item].y, 95, 95, x + 3, y + 3, 52, 52);
				i++;
			});
			island.ctx.drawImage(ui, 330, 0, 64, 64, 483, 380, 58, 58);
			island.ctx.drawImage(bears, 0, 0, 96, 96, 486, 383, 52, 52);
			inv_urso.draw();
		} else if (menu == "shop")
		{
			inv_urso = new Character(bear.spritesheet, bear.data.front.x, bear.data.front.y, bear.data.front.w, bear.data.front.h, 72, 148, w, h);
			island.ctx.drawImage(menu_bg, 1440, 0, 800, 480, 0, 0, 800, 480);
			catalog.forEach(function (item) {
				var y = 128;
				var x = 180 + i * 95 + i * 26;
				if (i > 4)
				{
					y += 128 + 8;
					x -= 4 * 95 + 4 * 26;
				}
				island.ctx.drawImage(items, icons[item.id].x, icons[item.id].y, 95, 95, x, y, 90, 90);
				island.ctx.fillStyle = "#a480c5";
				island.ctx.font = "bold 22px Coolvetica";
				if (player.inventory.indexOf(item.id) != -1)
				{
					island.ctx.fillText("SOLD!", x + 32, y + 116);
				} else
				{
					island.ctx.fillText(`¢ ${item.price}`, x + 48, y + 116);
				}
				i++;
			});
			inv_urso.draw();
		} else if (menu == "profile")
		{
			var i = 1;
			var b = player.bear;
			var bn = new String();

			if (b === "grizzly")
			{
				bn = "Grizzly Bear";
			}

			inv_urso = new Character(bear.spritesheet, bear.data.front.x, bear.data.front.y, bear.data.front.w, bear.data.front.h, 96, 148, w, h);
			island.ctx.drawImage(menu_bg, 720, 0, 720, 400, 40, 40, 720, 400);
			
			island.ctx.font = "30px sans-serif";
			island.ctx.fillText(player.username, 300, 145);
			
			island.ctx.font = "15px sans-serif";
			island.ctx.drawImage(bears, 0, 0, 96, 96, 300, 146, 26, 26);
			island.ctx.fillText(bn, 329, 165);
			
			island.ctx.fillStyle = "#ffd800";
			island.ctx.font = "bold 15px sans-serif";
			island.ctx.drawImage(ui, 130, 0, 64, 64, 300, 173, 26, 26);
			island.ctx.fillText(player.coins, 329, 192);
			
			island.ctx.drawImage(ui, 264, 0, 64, 64, 230 + i * 72, 224, 60, 60);
			island.ctx.drawImage(badges, artwork.ui.badges_data.account.x, artwork.ui.badges_data.account.y, 64, 64, 234 + i * 72, 228, 52, 52);
			i++;
			player.badges.forEach(function (badge) {
				var x = 230 + i * 72;
				var y = 224;
				if (i > 6)
				{
					y += 72;
					x -= 72 * 6;
				}
				island.ctx.drawImage(ui, 264, 0, 64, 64, x, y, 60, 60);
				island.ctx.drawImage(badges, artwork.ui.badges_data[badge].x, artwork.ui.badges_data[badge].y, 64, 64, x + 4, y + 4, 52, 52);
				i++;
			});
			inv_urso.draw();
		} else if (menu == "settings")
		{
			island.ctx.fillStyle = "white";
			island.ctx.font = "50px Coolvetica";
			island.ctx.fillText("Settings", 18, 50);

			// General settings
			island.ctx.font = "25px Coolvetica";
			island.ctx.fillText("General Settings", 18, 85);

			island.ctx.font = "20px Coolvetica";
			island.ctx.fillText("Hide Player Names", 18, 105);

			if (hidenames == false)
			{
				island.ctx.globalAlpha = 0.2;
				island.ctx.fillStyle = "#00bf00";
				island.ctx.fillRect(18, 115, 32, 32)
				island.ctx.globalAlpha = 1.0;
				island.ctx.fillStyle = "red";
				island.ctx.fillRect(58, 115, 32, 32)
				island.ctx.fillStyle = "white";
				island.ctx.globalAlpha = 1.0;
			} else
			{
				island.ctx.globalAlpha = 1.0;
				island.ctx.fillStyle = "#00bf00";
				island.ctx.fillRect(18, 115, 32, 32)
				island.ctx.globalAlpha = 0.2;
				island.ctx.fillStyle = "red";
				island.ctx.fillRect(58, 115, 32, 32)
				island.ctx.fillStyle = "white";
				island.ctx.globalAlpha = 1.0;
			} 

			island.ctx.fillText("Hide HUD", 18, 175);

			if (hidehud == false)
			{
				island.ctx.globalAlpha = 0.2;
				island.ctx.fillStyle = "#00bf00";
				island.ctx.fillRect(18, 185, 32, 32)
				island.ctx.globalAlpha = 1.0;
				island.ctx.fillStyle = "red";
				island.ctx.fillRect(58, 185, 32, 32)
				island.ctx.fillStyle = "white";
				island.ctx.globalAlpha = 1.0;
			} else
			{
				island.ctx.globalAlpha = 1.0;
				island.ctx.fillStyle = "#00bf00";
				island.ctx.fillRect(18, 185, 32, 32)
				island.ctx.globalAlpha = 0.2;
				island.ctx.fillStyle = "red";
				island.ctx.fillRect(58, 185, 32, 32)
				island.ctx.fillStyle = "white";
				island.ctx.globalAlpha = 1.0;
			}

			// Sound settings
			island.ctx.font = "25px Coolvetica";
			island.ctx.fillText("Sound Settings", 18, 255);
			island.ctx.font = "20px Coolvetica";
			island.ctx.fillText("Rooms Music Volume", 18, 275);
			island.ctx.fillStyle = "gray";
			island.ctx.fillRect(18, 285, 32, 32);

			// -
			island.ctx.fillStyle = "black";
			island.ctx.fillRect(58, 285, 32, 32);
			island.ctx.fillStyle = "white";
			island.ctx.font = "32px Coolvetica";
			island.ctx.fillText("-", 69, 312)

			if (volume == 4)
			{
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(98, 285, 32, 32);
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(138, 285, 32, 32);
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(178, 285, 32, 32);
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(218, 285, 32, 32)
			} else if (volume == 3)
			{
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(98, 285, 32, 32);
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(138, 285, 32, 32);
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(178, 285, 32, 32);
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(218, 285, 32, 32);
			} else if (volume == 2)
			{
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(98, 285, 32, 32);
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(138, 285, 32, 32);
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(178, 285, 32, 32);
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(218, 285, 32, 32);
			} else if (volume == 1)
			{
				island.ctx.fillStyle = "green";
				island.ctx.fillRect(98, 285, 32, 32);
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(138, 285, 32, 32);
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(178, 285, 32, 32);
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(218, 285, 32, 32);
			} else if (volume == 0)
			{
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(98, 285, 32, 32);
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(138, 285, 32, 32);
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(178, 285, 32, 32);
				island.ctx.fillStyle = "white";
				island.ctx.fillRect(218, 285, 32, 32);
			}
			island.ctx.fillStyle = "black";
			island.ctx.fillRect(258, 285, 32, 32);

			// +
			island.ctx.font = "32px Coolvetica";
			island.ctx.fillStyle = "white";
			island.ctx.fillText("+", 267, 312);
			room.audio.volume = volume > 0 ? volume / 4 : 0;
		}

		if (menu != "settings")
		{
			if (hidehud == false)
			{
				island.ctx.drawImage(ui, 0, 68, 256, 96, 16, 8, 102.3, 38.4);
				island.ctx.fillStyle = "#ffd800";
				island.ctx.font = "bold 20px Coolvetica";
				island.ctx.fillText(player.coins, 64, 34);
				island.ctx.fillStyle = "#000000";
			}
		}
		island.ctx.fillStyle = "#000000";
		island.ctx.drawImage(ui, 194, 0, 68, 64, 725, 10, 68, 64);
	}
	
	if (!menu)
	{
		if (hidehud == false)
		{
			island.ctx.drawImage(ui, 0, 68, 256, 96, 16, 8, 102.3, 38.4);
			island.ctx.fillStyle = "#ffd800";
			island.ctx.font = "bold 20px Coolvetica";
			island.ctx.fillText(player.coins, 64, 34);
			island.ctx.fillStyle = "#000000";
		}
	}
	requestAnimationFrame(loop);
}

island.canvas.addEventListener("click", function (event) {
	event.preventDefault();
	var x = event.offsetX;
	var y = event.offsetY;
	
	console.log(x, y);

	if (!player.guest)
	{
		if (x > 728 && x < 788 && y > 420 && y < 466 && !menu && hidehud == false)
		{
			menu = "inv";
			emotemenu = false;
		} else if (x > 663 && x < 723 && y > 420 && y < 466 && !menu && room.name == "clothing" && hidehud == false)
		{
			menu = "shop";
			emotemenu = false;
		} else if (x > 728 && x < 788 && y > 355 && y < 405 && !menu && hidehud == false)
		{
			menu = "profile";
			emotemenu = false;
		} else if (x > 728 && x < 788 && y > 8 && y < 70 && menu)
		{
			menu = "";
			emotemenu = false;
		} else if (x > 5 && x < 69 && y > 420 && y < 466 && emotemenu == false && !menu && hidehud == false)
		{
			menu = "";
			emotemenu = true;
		} else if (x > 5 && x < 69 && y > 420 && y < 466 && emotemenu == true && !menu && hidehud == false)
		{
			emotemenu = false;
		} else if (x > 728 && x < 788 && y > 5 && y < 69 && !menu)
		{
			menu = "settings";
			emotemenu = false;
		} else if (x > 25 && x < 57 && y > 208 && y < 240 && emotemenu == true && !menu)
		{
			socket.emit("emoji", {
				"emoji": "cool"
			});
			emotemenu = false;
		} else if (x > 25 && x < 57 && y > 240 && y < 272 && emotemenu == true && !menu)
		{
			socket.emit("emoji", {
				"emoji": "normal"
			});
			emotemenu = false;
		} else if (x > 25 && x < 57 && y > 272 && y < 304 && emotemenu == true && !menu)
		{
			socket.emit("emoji", {
				"emoji": "angry"
			});
			emotemenu = false;
		} else if (x > 25 && x < 57 && y > 304 && y < 336 && emotemenu == true && !menu)
		{
			socket.emit("emoji", {
				"emoji": "sob"
			});
			emotemenu = false;
		} else if (x > 25 && x < 57 && y > 336 && y < 368 && emotemenu == true && !menu)
		{
			socket.emit("emoji", {
				"emoji": "confused"
			});
			emotemenu = false;
		} else if (x > 25 && x < 57 && y > 368 && y < 400 && emotemenu == true && !menu)
		{
			socket.emit("emoji", {
				"emoji": "love"
			});
			emotemenu = false;
		} else if (x > 18 && x < 90 && y > 115 && y < 145 && menu == "settings")
		{
			if (hidenames == false)
			{
				hidenames = true
			} else if (hidenames == true)
			{
				hidenames = false
			}
		} else if (x > 18 && x < 90 && y > 185 && y < 215 && menu == "settings")
		{
			if (hidehud == false)
			{
				hidehud = true
			} else if (hidehud == true)
			{
				hidehud = false
			}
		} else if (x > 58 && x < 90 && y > 285 && y < 314 && menu == "settings")
		{
			if (volume >= 1)
			{
				volume--;
			}
		} else if (x > 258 && x < 298 && y > 285 && y < 314 && menu == "settings")
		{
			if (volume <= 3)
			{
				volume++;
			}
		} else if (room.name == "clothing" && menu == "shop")
		{
			var i = 1;
			catalog.forEach(function (item) {
				var iy = 128;
				var ix = 180 + i * 95 + i * 26;
				if (i > 4)
				{
					iy += 128 + 8;
					ix -= 4 * 95 + 4 * 26;
				}
				if (x > ix && x < ix + 95 && y > iy && y < iy + 95)
				{
					if (player.inventory.indexOf(item.id) != -1)
					{
						console.log("SOLD!");
					} else
					{
						buy(item);
					}
				}
				i++;
			});
		} else if (menu)
		{
			
		} else if (!menu)
		{
			socket.emit("click", {
				"x": event.offsetX,
				"y": event.offsetY
			});
		}
	} else
	{
		socket.emit("click", {
			"x": event.offsetX,
			"y": event.offsetY
		});
	}
});

socket.on("move", function (data) {
	var user = island.rooms[room.name].users[data.username];
	if (!user)
	{
		return -1;
	}
	user.vpos.x = data.pos.x - user.char.dWidth / 2;
	user.vpos.y = data.pos.y - user.char.dHeight;
	var angle = Math.floor(get_angle(user.pos, data.pos));
	var tmp = artwork.bear.grizzly.data;
	var sprite = "front";
	if (angle > 67.5 && angle < 112.5)
	{
		sprite = "front";
	} else if (angle < -67.5 && angle > -112.5)
	{
		sprite = "back";
	} else if (angle >= 0 && angle < 67.5)
	{
		sprite = "front_right";
	} else if (angle > 112.5 && angle <= 180)
	{
		sprite = "front_left";
	} else if (angle >= -67.5 && angle < 0)
	{
		sprite = "back_right";
	} else if (angle < -112.5 && angle >= -180)
	{
		sprite = "back_left";
	}
	if (sprite)
	{
		user.char.sx = tmp[sprite].x;
		user.char.sy = tmp[sprite].y;
		user.char.sWidth = tmp[sprite].w;
		user.char.sHeight = tmp[sprite].h;
	}
});

/* A wild bear blocekd your path! Or you just reached the end... */
