const users=[];
const fetch = require("node-fetch");
const qrcode = require('qrcode-terminal');
// const puppeteer = require("puppeteer");
// (async() => {
//     const browser = await puppeteer.launch({args:['--no-sandbox']});
//     console.log(await browser.version());
//     await browser.close();
//     })();
const { Client, LocalAuth, ChatTypes } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth()
});

const contestperform = async (handle,contestID) => {
    const url = `https://codeforces.com/api/user.rating?handle=${handle}`
    const data = await fetch(url);
    const response = await data.json();
    let text = "";
    if(response.status === "OK"){
       const result = await response.result;
       result.reverse();
       for(let i=0;i<Math.min(10,result.length);i++){
           const t_row = result[i];
           console.log(t_row.contestId);
           if(t_row.contestId == contestID){
              text = ` ● Handle : *${t_row.handle}* || Rank : *${t_row.rank}* `
           }
       }
       if(text==""){
         text = ` ● Handle : *${handle}* || Rank : *NOT GIVEN* `
       }
    }
    else{
        text = ` ● Handle : *${handle}*
         || Rank : *USER NOT FOUND<* `
    }
    return text;
}

const contestperformance = async (contestID) => {
    let text = "";
    for(let i=0;i<users.length;i++){
        let perform = await contestperform(users[i],contestID);
        console.log(perform);
        text+=perform+"\n";
    }
    return text;
}

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async(message) => {
    const chat = await message.getChat();
    const contact = await message.getContact();

    let words = message.body.split(' ');

	if(words[0] === '.about') {
       chat.sendMessage("This is Parth\nHello World");
	}

    if(message.body === '.hello'){
        chat.sendMessage(`Hello @${contact.id.user}`, {
            mentions: [contact]
        });
    }

    if(message.body=='.help'){
        let text=
`🎉Welcome to the help section of this bot🤖

This bot🤖 will send reminders for upcoming CF contests🏁

How to use this bot🤖❓
Add this bot to your whatsapp groups💬 and then send .enable command to enable CF Contests reminder for your group.

List of available commands:

.help
Displays all the above commands

.contest
Sends a list of upcomming CF contests

.about
About message

.promote 91XXXXXYYYYY
Adds a user to admin list of bot commands

.demote 91XXXXXYYYYY
Removes a user from admin list of bot commands

.enable
Enables CodeForces Contests reminder for the groups

.disable
Disables CodeForces Contests reminder for the groups

.interval MINUTES
Sets the time interval in minutes between two consecutive reminders

.reminder HOURS
Sets the time in hours before which the bot will start sending reminders

.reset CONFIRM
Resets the bot to default configurations. All admins will be removed!`
       chat.sendMessage(text);
    }

    if(words[0] === '.adduser'){
       for(let i=1;i<words.length;i++){
           users.push(words[i]);
       }
    }

    if(message.body === '.getuser'){
        let text="";
        for(let i=0;i<users.length;i++){
            text+=users[i]+"\n";
        }
        chat.sendMessage(text);
    }

    if(words[0]=='.getuserdetail' && words.length == 2){
        const url=`https://codeforces.com/api/user.info?handles=${words[1]}`
        const data = await fetch(url);
        const response = await data.json();
        if(response.status === "OK"){
            const result = response.result[0];
            console.log(result.firstName);
            let text = `
USER DETAILS :
--------------------

NAME : ${result.firstName} ${result.lastName}
RANK : ${result.rank}
CURRENT RATING : ${result.rating}
MAXRATING : ${result.maxRating}`
            chat.sendMessage(text);
        }
    }

    if(words[0]=='.contestperformance' && words.length==2){
       console.log(words[1]);
       let to_send = await contestperformance(words[1]);
       chat.sendMessage(to_send);
    }
});

client.initialize();