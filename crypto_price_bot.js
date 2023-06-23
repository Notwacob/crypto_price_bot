require('dotenv').config();
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const twilio = require('twilio');
const { JSDOM } = jsdom;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.FROM;
const toNumber = process.env.TO;
const api = new twilio(accountSid, authToken)

async function fetchHTML(url) {
    try {
        //accessing the url (link to the website)
        const response = await fetch(url);

        //getting the text of the url
        const txt = await response.text();

        //convert the text into an object. This is our final output
        // const page = new DOMParser().parseFromString(txt, 'text/html');
        const page = new jsdom.JSDOM(txt);
        return page;
    } catch (e) {
        return false;
    }
}

function getPrice(page) {
    const obj = page.window.document.querySelector('.sc-16891c57-0.dxubiK.base-text');
    if (obj) {
        let price = obj.textContent;
        const priceAsNumber = Number(price.replace(/[^0-9.-]+/g,""));
        return priceAsNumber;
    } else {
        return null; // Or any other appropriate value or error handling mechanism
    }
}

function checkThreshold(price, threshhold) {
    if (price > threshhold) {
        // console.log(`The price is over $${threshhold}`);
        return true;
    } else {
        // console.log(`The price is not over $${threshhold}`);
        return false;
    }
}

function sendMessage(cryptoName, price) {
    let msg = `The current price of ${cryptoName} is $${price}`;
    api.messages
        .create({
            body: msg,
            from: fromNumber,
            to: toNumber
        })
        .then(message => console.log(message.sid));
}

//Create an array of crypto names
// const cryptoNameArray = ['bitcoin', 'ethereum', 'cardano', 'ripple'];
const cryptoDictionary = {
    'bitcoin': 30000,
    'ethereum': 1000,
    'cardano': 1,
    'ripple': 1
}

for(const cryptoName in cryptoDictionary) {
    //Create a template URL where we can switch in our crypto names
    let templateURL = `https://coinmarketcap.com/currencies/${cryptoName}/`;

    fetchHTML(templateURL).then((page) => {
        const price = getPrice(page);
        console.log(`The current price of ${cryptoName} is $${price}`)
        if(checkThreshold(price, cryptoDictionary[cryptoName])) {
            sendMessage(cryptoName, price);
        }
    });
}