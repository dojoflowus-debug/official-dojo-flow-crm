import { createRequire } from 'module';
import { register } from 'node:module';

// Use tsx to run this
const { parseFlyerDataFromBrief, buildFlyerHtml, renderFlyerToPng } = await import('./server/flyerRenderer.ts');

async function test() {
  try {
    console.log('Step 1: parseFlyerDataFromBrief...');
    const data = await parseFlyerDataFromBrief(
      'create a flyer for little ninjas ages 3-5',
      { program: 'Little Ninjas', audience: 'ages 3-5' },
      { schoolName: 'Demo Dojo', phone: '555-1234', primaryColor: '#C8102E', logoUrl: null },
      'flyer'
    );
    console.log('heroImageUrl present:', !!data.heroImageUrl);
    if (data.heroImageUrl) {
      console.log('heroImageUrl type:', data.heroImageUrl.startsWith('data:') ? 'base64' : 'url');
      console.log('heroImageUrl length:', data.heroImageUrl.length);
    }
    console.log('Step 2: buildFlyerHtml...');
    const html = buildFlyerHtml(data);
    console.log('HTML length:', html.length);
    console.log('Step 3: renderFlyerToPng...');
    const png = await renderFlyerToPng(html, 'flyer');
    console.log('PNG size:', png.length, 'bytes');
    console.log('SUCCESS - writing test output...');
    const fs = await import('fs');
    fs.writeFileSync('/tmp/test-flyer.png', png);
    console.log('Saved to /tmp/test-flyer.png');
  } catch (e) {
    console.error('FAILED:', e.message);
    console.error(e.stack?.split('\n').slice(0, 8).join('\n'));
  }
}

test();
