require('dotenv').config();

const { google } = require('googleapis');
const TradingView = require('./main'); // Adjust the path as needed

const { appendAllDataFromJson } = require('./googleSheetsUtils');

const spreadsheetId = "1SZwDpZO7rvLrijKq9dOP4tffr-KzhQB1JsPXBj8I"

const indicator_name = 'USER;fa4099d3a752474a95e79b2d9186b804' //fsvzo


const ticket = 'BINANCE:BTCUSD';

const sheetTitle = 'yt-test';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getAuthToken() {
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES
  });
  const authToken = await auth.getClient();
  return authToken;
}

async function fetchData(timeframe) {
  const client = new TradingView.Client();

  const chart = new client.Session.Chart();
console.log(Math.round((Date.now() - Date.UTC(2018,1,1) )/ 1000 / 60 / 60 / 24))
  chart.setMarket(ticket, {
    timeframe: timeframe,
    range: Math.round((Date.now() - Date.UTC(2018,1,1) )/ 1000 / 60 / 60 / 24) + 1 ,
    to: Math.round((Date.now()  )/ 1000)
  });

  return new Promise((resolve, reject) => {
    TradingView.getIndicator( indicator_name ).then((indic) => {
      const study = new chart.Study(indic);
      study.onUpdate(() => {
        resolve(study.periods);
        client.end();
      });
    }).catch(reject);
  });
}

function processDataForTimeframes(data1D,dataW, dataM) {
  const structuredData = [];

  data1D.forEach((entry1D, index) => {
    const positionW = index % 7 === 0 ? dataW[Math.floor(index / 7)].position : structuredData[index - 1]['Wposition'];
    const positionM = index % 30 === 0 ? dataW[Math.floor(index / 30)].position : structuredData[index - 1]['Wposition'];


    structuredData.push({
      'unix' : entry1D.$time,
      'time': new Date(entry1D.$time * 1000).toLocaleString(),
      '1Dposition': entry1D.position,
      'Wposition': positionW,
      'Mposition': positionM,

      'closeprice': entry1D.ClosePrice,
      'openprice': entry1D.OpenPrice

    });
  });

  return structuredData;
}

const fs = require('fs').promises; // Import the file system module

async function exportIndicatorData() {
  try {
    const auth = await getAuthToken(); 

    const data1D = await fetchData('1D');
        const dataW = await fetchData('W');
    const dataM = await fetchData('M');


    const processedData = processDataForTimeframes(data1D, dataW,dataM);
    console.log(processedData);

    await fs.writeFile('exportedData-json-delete-to-get-new.txt', JSON.stringify(processedData, null, 2), 'utf-8');


    await appendAllDataFromJson(auth, spreadsheetId, sheetTitle, processedData);

    console.log('Data exported successfully to Google Sheets.');

  } catch (error) {
    console.error('Error in exportIndicatorData:', error);
  }
}


exportIndicatorData();