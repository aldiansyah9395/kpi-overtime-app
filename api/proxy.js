// File: api/proxy.js

export default async function handler(req, res) {
  const googleAppsScriptURL = "https://script.google.com/macros/s/AKfycbxPu3lZFO_6d0OLfDeQ6EG9uN9oHJe7xq_ULm64x99ude4P-KVBG62otW7DWDtfGukmvg/exec?mode=data";

  try {
    const response = await fetch(googleAppsScriptURL);
    const data = await response.text(); // Karena kadang Apps Script tidak kirim JSON header

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
