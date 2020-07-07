const Discord = require("discord.js");
const PlayFabServer = require("playfab-sdk/Scripts/PlayFab/PlayFabServer");

class uBot
{
	constructor (token, playing)
	{
		this.client = new Discord.Client();
		this.client.login(token);
		var t = this;
		this.client.on("ready", function () {
			console.log(`Logged in as ${t.client.user.tag}.`);
			t.client.user.setStatus("online");
			t.client.user.setActivity(`Urso Island | ${playing || "https://exkcuipa.herokuapp.com"}`, {
				"type": "PLAYING",
				"url": `${playing || "https://exkcuipa.herokuapp.com"}`
			});
		});
		this.client.on("message", function (msg) {
			if (msg.content.startsWith("u!"))
			{
				var func = t[msg.content.replace("u!", "").split(" ")[0]];
				if (typeof(func) == "function")
				{
					func(msg);
				}
			}
		});
	}

	check(msg)
	{
		if ((has_role(msg.member, "Team") || has_role(msg.member, "Moderators")))
		{
			msg.channel.send("You're a Moderator or part of the Team, cool.");
			return true;
		} else
		{
			msg.channel.send("Sorry, but you aren't a Moderator or part of the Team.\nTo apply, send a DM to an Admin.");
			return false;
		}
	}

	ban(msg)
	{
		if ((has_role(msg.member, "Team") || has_role(msg.member, "Moderators")))
		{
			PlayFabServer.BanUsers({
				"Bans": [
					{
						"PlayFabId": msg.content.split(" ")[1],
						"Reason": "Moderation."
					}
				]
			}, function (err, res) {
				if (!err)
				{
					PlayFabServer.UpdateUserData({
						"Data": {
							"mute": 365 * 60 * 1000 * 24
						},
						"PlayFabId": msg.content.split(" ")[1]
					}, function (err, res) {
						if (!err)
						{
							msg.channel.send(`User with ID **${msg.content.split(" ")[1]}** banned succefully.`);
						} else
						{
							msg.channel.send("Error while banning user. Please contact an Admin.");
						}
					});
				} else
				{
					msg.channel.send("Error while banning user. Please contact an Admin.");
				}
			});
		}
	}

	mute(msg)
	{
		if ((has_role(msg.member, "Team") || has_role(msg.member, "Moderators")))
		{
			PlayFabServer.UpdateUserData({
				"Data": {
					"mute": Math.floor(new Date() / 1000) + parseInt(msg.content.split(" ")[2]) * 60
				},
				"PlayFabId": msg.content.split(" ")[1]
			}, function (err, res) {
				if (!err)
				{
					msg.channel.send(`User with ID **${msg.content.split(" ")[1]}** muted by **${msg.content.split(" ")[2]}** minutes succefully.`);
				} else
				{
					msg.channel.send("Error while muting user. Please contact an Admin.");
				}
			});
		}
	}
}

function has_role(member, role)
{
	return member.roles.cache.some(function (tmp) {
		return tmp.name == role;
	});
}

module.exports = uBot;
