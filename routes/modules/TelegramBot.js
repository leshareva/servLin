/**
 * Created by LeshaReva on 2/22/17.
 */
var TelegramBot=require('node-telegram-bot-api');

var token='325201516:AAEsFws_YOtuigWv-w4lc3pZOL7aYTWB810';

var bot=new TelegramBot(token,{polling:true});

//
//
bot.onText(/\/задача (.+)/, function (msg, match) {
    var userId = msg.from.id;
    var text = match[1];
    console.log(userId, text)

});

bot.sendContact()