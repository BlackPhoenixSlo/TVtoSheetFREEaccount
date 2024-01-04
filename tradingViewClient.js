const TradingView = require('./main'); // Adjust the path as needed
const { appendAllDataFromJson } = require('./googleSheetsUtils');
const { appendTimeAndPositionData } = require('./googleSheetsUtils');


const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getAuthToken() {
  const auth = new google.auth.GoogleAuth({ scopes: SCOPES });
  const authToken = await auth.getClient();
  return authToken;
}

function formatSheetTitle(title) {
  return title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
}

async function processTradingViewIndicator(spreadsheetId) {
  id = "whv5betgotone8n4lfwnaco9xq15dl7t"
certificate = "v1:Bk/ZvaAmuR48QoWNbGrOeTdM9CTL+CUngWzYXUF0jvQ="






  const client = new TradingView.Client({
    token: id,
    signature: certificate,
  });
  const chart = new client.Session.Chart();
  chart.setMarket('BINANCE:BTCUSDT', {
    timeframe: '1D',
    range: -199, 
    to: Math.round(Date.now() / 1000) - 86400 * 200,
  });

  TradingView.getIndicator('USER;fa4099d3a752474a95e79b2d9186b804').then(async (indic) => {
    console.log(`Loading '${indic.description}' study...`);
    const INDICATOR = new chart.Study(indic);

    INDICATOR.onUpdate(async () => {
      console.log('Study periods:', INDICATOR.periods);
      const sheetTitle = formatSheetTitle(indic.description);
      const auth = await getAuthToken();

      await appendAllDataFromJson(auth, spreadsheetId, sheetTitle, INDICATOR.periods);

      const sheetTitle1 = 'Positions'; 
      const jsonData =  INDICATOR.periods; 

      await appendTimeAndPositionData(auth, spreadsheetId, sheetTitle1, jsonData);

      client.end();
    });
  });
}



// Assuming jsonData is your JSON object that contains the '$time' and 'position' fields

module.exports = {
  processTradingViewIndicator
};


/*
// Function to Append Specified Headers and Values
async function appendSelectedData(auth, sheetTitle, jsonData, selectedFields) {
  // ... [Implementation]
}

// Usage in INDICATOR.onUpdate
const selectedFields = ['$time', 'Leading_Oscillator', 'Uptrend'];
await appendSelectedData(auth, sheetTitle, INDICATOR.periods, selectedFields);
*/