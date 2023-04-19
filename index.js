const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const admin = require('firebase-admin');
const {uid} = require('uid');

var serviceAccount = require("./fireship-cf-firebase-adminsdk-y4k2m-bf1fb58425.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const myCollectionRef = db.collection('my_collection');

const myDocumentRef = myCollectionRef.doc('my_document');


const res = [
    {
        title: 'entry level dev',
        datePosted: new Date("2019-07-25 12:00:00"),
        neighborhood: '(palo alto)',
        url: 'https://careers.adobe.com/us/en/search-results?keywords=bengaluru',
        jobDescription: 'some description',
        compensation: 'upto 1222 doLar per year'
    }
]

async function main() {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage();
    await page.goto('https://careers.adobe.com/us/en/search-results?keywords=bengaluru');

    const html = await page.content();
    const $ = cheerio.load(html);
    let obj = {uid: uid(6), company_name: 'adobe', jobs: []};

    $('div.information span[role="heading"] a').each((index, element) => {obj.jobs.push({url: $(element).attr('href')})});
    // console.info(obj);
    for(let i = 0; i < obj.jobs.length; i++){
        console.info('going in job number ', i);
        await page.goto(obj.jobs[i].url);
        const html2 = await page.content();
        const $ = cheerio.load(html2);
        let jobName = $('div.job-info.au-target h1').text();
        let jobId = $('span.au-target.jobId').first().contents().filter(function() {
            return this.nodeType === 3;
        }).text().trim();
        obj.jobs[i].title = jobName;
        obj.jobs[i].jobId = jobId;
    }
    console.info(obj);

    myDocumentRef.set(obj)
        .then(() => {
            console.log('Document written!');
        })
        .catch((error) => {
            console.error('Error writing document: ', error);
        });


    await browser.close();
}

main();
