// Test script for sending Telegram notification
async function testTelegramNotification() {
  const url = 'https://functions.poehali.dev/c7e45041-9353-48b0-9496-bc4ae40b911d';
  
  const data = {
    chat_id: "1112267464",
    name: "Орлова Алёна Владимировна",
    plan: "3 урока в неделю - 1 месяц",
    amount: "14400",
    order_id: "ORDER_1761820234186"
  };

  console.log('Sending POST request to:', url);
  console.log('Request body:', JSON.stringify(data, null, 2));
  console.log('\n---\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('\nResponse body:');
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log(JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log(responseText);
    }

    if (response.ok) {
      console.log('\n✓ SUCCESS: Notification sent successfully!');
    } else {
      console.log('\n✗ ERROR: Request failed with status', response.status);
    }

  } catch (error) {
    console.error('✗ ERROR: Failed to send request');
    console.error(error.message);
  }
}

testTelegramNotification();
