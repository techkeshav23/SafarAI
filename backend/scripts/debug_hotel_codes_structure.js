const fetch = require('node-fetch');

const API_USER = "hackathontest";
const API_PASS = "Hac@98147521";
const AUTH = "Basic " + Buffer.from(`${API_USER}:${API_PASS}`).toString("base64");

async function check() {
  const url = "http://api.tbotechnology.in/TBOHolidays_HotelAPI/TBOHotelCodeList";
  console.log("Checking URL:", url);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": AUTH
      },
      body: JSON.stringify({
        CityCode: "111124", 
        IsDetailedResponse: "false" 
      })
    });

    console.log("Status:", res.status);
    const
    text = await res.text();
    console.log("Response length:", text.length);
    console.log("Response preview:", text.substring(0, 500));
    
    try {
        const json = JSON.parse(text);
        console.log("Is array?", Array.isArray(json));
        console.log("Keys:", Object.keys(json));
        if (json.HotelCodes) console.log("HotelCodes type:", typeof json.HotelCodes, Array.isArray(json.HotelCodes));
    } catch (e) {
        console.log("Not JSON");
    }

  } catch (err) {
    console.error(err);
  }
}

check();
