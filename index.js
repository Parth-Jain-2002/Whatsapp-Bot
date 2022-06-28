const fetch = require("node-fetch");
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Client, LocalAuth, ChatTypes } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer:{
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--unhandled-rejections=strict"
        ]
    }
});

const contestperformance = async (contestID,users) => {
    let text = ""
    let given = [];
    let notgiven = "";
    for(let i=0;i<users.length;i++){
        const handle = users[i];
        const url = `https://codeforces.com/api/user.rating?handle=${handle}`
        const data = await fetch(url);
        const response = await data.json();
        let text = "";
        if(response.status === "OK"){
            const result = await response.result;
            result.reverse();
            // This line limits the no of contests to 50
            for(let i=0;i<Math.min(50,result.length);i++){
                const t_row = result[i];
                if(t_row.contestId == contestID){
                    text = ` ● Handle : *${handle}* || Rank : *${t_row.rank}* `
                    let data = [];
                    data.push(handle);
                    data.push(t_row.rank);
                    given.push(data);
                }
            }
            if(text==""){
                notgiven += ` ● Handle : *${handle}* || Rank : *NOT GIVEN* \n`
            }
        }
        else{
            notgiven += ` ● Handle : *${handle}* || Rank : *USER NOT FOUND* \n`
        }
    }
    console.log(given);
    given.sort( function(a,b){ return (a[1] < b[1]) ? -1 : 1;});
    console.log(given);
    for(let i in given){
        text+= ` ● Handle : *${given[i][0]}* || Rank : *${given[i][1]}* \n`;
    }
    text+=notgiven;
    return text;
}

const checkAdmin = (myData, id) => {
    console.log(myData);
    console.log(id);
    for(let i of myData){
        if(i == id) return true;
    }
    return false;
}

const checkValid = async (handle) => {
    const url = `https://codeforces.com/api/user.rating?handle=${handle}`
    const data = await fetch(url);
    const response = await data.json();
    if(response.status=="OK"){
        return true;
    }
    else{
        return false;
    }
}

const checkContest = async(contest) =>{
    const url = `https://codeforces.com/api/contest.status?contestId=${contest}&from=1&count=1`
    const data = await fetch(url);
    const response = await data.json();
    if(response.status=="OK"){
        return true;
    }
    else{
        return false;
    }
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
    const isGrp = chat.isGroup;
    let words = message.body.split(' ');
    let data = fs.readFileSync('./data.json')
    let myData = JSON.parse(data);
    let isAdmin = false;

    const active = myData.users.includes(chat.id.user);
    
    if(!active){
        // Activate bot
        if(message.body === '#activate bot'){
            myData.users.push(chat.id.user);
            if(isGrp){
              let grdip = chat.id.user;
              myData.groups[grdip] = [];
              myData.admins[grdip] = [];
              let data = chat.participants;
              for(let i of data){
                 if(i.isAdmin == true){
                    myData.admins[grdip].push(i.id.user);
                 }
              }
            }
            chat.sendMessage(`*Hello World !!* 
_Type #help to know the available commands_`, 
            {
                mentions: [contact]
            });
        }
    }
    else{
        if(isGrp) isAdmin = checkAdmin(myData.admins[chat.id.user],contact.id.user);

        // Activate bot
        if(message.body === '#activate bot'){
            chat.sendMessage(`The bot is already activated in this chat`, 
            {
                mentions: [contact]
            });
        }
        
        // Deactivate bot
        if(message.body === '#deactivate bot'){
            if(!isGrp){
                myData.users.splice(myData.users.indexOf(chat.id.user),1);
                chat.sendMessage(`The bot is deactivated in this chat
Type #activate bot to activate it again`, 
                {
                    mentions: [contact]
                }); 
            }
            else if(isAdmin){
                myData.users.splice(myData.users.indexOf(chat.id.user),1);
                chat.sendMessage(`The bot is deactivated in this chat
Type #activate bot to activate it again`, 
                {
                    mentions: [contact]
                });
            }
            else{
                chat.sendMessage(`This feature is available only for admins`);
            }
        }

        // Promote User
        if(words[0] == '#promote' && words.length == 2){
            if(isGrp){
                if(isAdmin){
                let phoneno = /^\d{12}$/;
                let test = words[1];
                let grpid = chat.id.user;
                let adms = myData.admins[grpid];
                    if(test.match(phoneno)){
                        if(adms.includes(test)){
                        chat.sendMessage(`User is already an admin`);
                        }
                        else{
                        adms.push(test);
                        chat.sendMessage(`User successfully elevated to bot admin for this group`);
                        }
                    }
                    else{
                        chat.sendMessage(`⚠️ Please enter a valid mobile number ⚠️                
Example : *#promote 919876543210*`)
                        }
                }
                else{
                    chat.sendMessage(`This feature is available only for admins`);
                }
            }
            else{
                chat.sendMessage(`This feature is available only for groups`);
            }
        }

        // Demote User
        if(words[0] == '#demote' && words.length == 2){
            if(isGrp){
                if(isAdmin){
                let phoneno = /^\d{12}$/;
                let test = words[1];
                let grpid = chat.id.user;
                let adms = myData.admins[grpid];
                if(test.match(phoneno)){
                    if(adms.includes(test)){
                       if(adms.length!=1){
                         adms.splice(adms.indexOf(test),1);
                         chat.sendMessage(`Success: User demoted from bot admin list`)
                       }
                       else{
                         chat.sendMessage(`Failed: There is only one admin`);
                       }
                    }
                    else{
                       chat.sendMessage(`User is not an admin`);
                    }
                }
                else{
                    chat.sendMessage(`⚠️ Please enter a valid mobile number ⚠️                
Example : *#demote 919876543210*`)
                }
                }
                else{
                    chat.sendMessage(`This feature is available only for admins`);
                }
            }
            else{
                chat.sendMessage(`This feature is available only for groups`);
            }
        }
        
        // About
        if(words[0] === '#about') {
            chat.sendMessage(`Created by: *Parth Jain*
https://github.com/Parth-Jain-2002
https://www.linkedin.com/in/parth-jain-7148061bb/

_Contact me for suggestions and feedback!!_`);
        }
        
        // help
        if(message.body=='#help'){
            let text=
    `🤖Welcome to the help section of this bot🤖

_This bot is designed to keep track of users and their participation in cf contest. By default, when the group is first activated, all group admins are made bot admins also_

*List of available commands:*

*#activate bot*
_This will activate the bot in your group_ 

*#deactivate bot*
_This will deactivate the bot, erase the user list and reset the admins_

*#help*
_To get the above message_

*#about*
_About message (Self promotion)_

*#promote 91XXXXXXXXXX*
_Promotes a user to the admin list_

*#demote 91XXXXXXXXXX*
_Demotes a user to the admin list_

*#adduser {handle [handles]}*
_Adds the handles provided into the user list_

*#showuser*
_Shows all the users_

*#deleteuser {handle [handles]}*
_Deletes the handles provided into the user list_

*#contestperformance {contextId}*
_This is used to get the performance of all users in the particular contest_

*#getuserdetail {handle}*
_This feature is available for individual users_

`
        chat.sendMessage(text);
        }
        
        // Add multiple user ids
        if(words[0] === '#adduser'){
            let grpid = chat.id.user;
            let users = myData.groups[grpid];
            let text = "";
            let success = "";
            let fail = "";
            let already = ""
            for(let i=1;i<words.length;i++){
                let isValid = await checkValid(words[i]);
                if(!users.includes(words[i])){
                    if(isValid){
                        myData.groups[grpid].push(words[i]);
                        success+=words[i]+" ";
                    }
                    else{
                        fail+=words[i]+" ";
                    }
                }
                else{
                    already+=words[i]+" ";
                }
            }
            if(success!="") text+="SUCCESS : "+success+"were successfully added.\n";
            if(fail!="") text+="FAILED : "+fail+"didn't exist.\n";
            if(already!="") text+="ALREADY : "+already+"were already added.\n";
            message.reply(text);
        }
        
        // Show all user ids stored in system
        if(message.body === '#showuser'){
            let text="";
            let grpid = chat.id.user;
            let users = myData.groups[grpid];
            for(let i=0;i<users.length;i++){
                text+=users[i]+"\n";
            }
            chat.sendMessage(text);
        }

        // Delete user
        if(words[0] === '#deleteuser'){
            let grpid = chat.id.user;
            let to_send = ""
            let text = ""
            let notexist = ""
            for(let i=1;i<words.length;i++){
                if(myData.groups[grpid].includes(words[i])){
                    myData.groups[grpid].splice(myData.groups[grpid].indexOf(words[i]),1);
                    text+= words[i]+" ";
                }
                else{
                    notexist+=words[i]+" ";
                }
            }
            if(text!="") to_send += "SUCCESS: " + text + "were successfully removed.\n";
            if(notexist!="") to_send += "FAILED: " + notexist + "didn't exist.\n";
            message.reply(to_send);
        }
        
        // This is for individual users
        if(words[0]=='#getuserdetail' && words.length == 2){
            if(!isGrp){
            const url=`https://codeforces.com/api/user.info?handles=${words[1]}`
            const data = await fetch(url);
            const response = await data.json();
            if(response.status === "OK"){
                const result = response.result[0];
                console.log(result.firstName);
                let text = 
    `USER DETAILS :
--------------------

NAME : ${result.firstName} ${result.lastName}
RANK : ${result.rank}
CURRENT RATING : ${result.rating}
MAXRATING : ${result.maxRating}`
                chat.sendMessage(text);
            }
            }
            else{
                const text = "This feature is available only for individuals";
                chat.sendMessage(text);
            }
        }
        
        // Contest performance for all users
        if(words[0]=='#contestperformance' && words.length==2){
        if(isGrp){
            if(isAdmin){
                let grpid = chat.id.user;
                let users = myData.groups[grpid];
                let isValid = await checkContest(words[1]);
                let to_send;
                if(isValid){
                    to_send = await contestperformance(words[1],users);
                }
                else{
                    to_send = `Contest with ID ${words[1]} doesn't exist`
                }
                chat.sendMessage(to_send);
            }
            else{
                chat.sendMessage(`This feature is available only for admins`);
            }
        }
        else{
            let text = "This feature is available only for groups."
            chat.sendMessage(text);
        }
        }
    }
    
    let to_save = JSON.stringify(myData);
    fs.writeFileSync('./data.json',to_save);
});

client.initialize();