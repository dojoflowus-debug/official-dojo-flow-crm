#!/usr/bin/env node

const apiKey = process.env.FILLFASTER_API_KEY;

if (!apiKey) {
  console.error('❌ FILLFASTER_API_KEY not found in environment');
  process.exit(1);
}

async function findPCBankCardForm() {
  try {
    const response = await fetch('https://api.fillfaster.com/v1/getFormsList?sort=created&order=desc&page=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`\n📋 Found ${data.total_count} forms in FillFaster account:\n`);
    
    data.items.forEach((form, index) => {
      console.log(`${index + 1}. ${form.name}`);
      console.log(`   Form ID: ${form.fid}`);
      console.log(`   Created: ${form.created}`);
      console.log(`   Submissions: ${form.submissions}\n`);
    });

    // Find PC Bank Card form
    const pcBankCardForm = data.items.find(form => 
      form.name.toLowerCase().includes('pcbancard') || 
      form.name.toLowerCase().includes('pc bancard') ||
      form.name.toLowerCase().includes('dojo')
    );

    if (pcBankCardForm) {
      console.log(`\n✅ Found PC Bank Card form:`);
      console.log(`   Name: ${pcBankCardForm.name}`);
      console.log(`   Form ID: ${pcBankCardForm.fid}`);
      console.log(`   Created: ${pcBankCardForm.created}`);
      console.log(`\n💡 Use this Form ID in your integration: ${pcBankCardForm.fid}\n`);
      return pcBankCardForm.fid;
    } else {
      console.log('⚠️  Could not automatically identify PC Bank Card form.');
      console.log('   Please check the list above and identify the correct form manually.\n');
    }
  } catch (error) {
    console.error('❌ Error fetching forms:', error.message);
    process.exit(1);
  }
}

findPCBankCardForm();
