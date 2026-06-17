const supabaseUrl = "https://wzgagrxvdiffjcyuqiau.supabase.co";
const serviceRoleKey = "sb_secret_DP007AREx_zw61liYZlk1g_XTybDhK-";

async function run() {
  console.log("Checking columns in evaluation_categories table...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/evaluation_categories?select=*&limit=1`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log("Response data:", JSON.stringify(data, null, 2));
      if (data && data[0]) {
        console.log("Columns returned:", Object.keys(data[0]));
      } else {
        console.log("No categories found.");
      }
    } else {
      const errorText = await res.text();
      console.error("HTTP Error:", res.status, errorText);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
