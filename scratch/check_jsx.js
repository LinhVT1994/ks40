const fs = require('fs');

function checkJSX(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const openDivs = (content.match(/<div/g) || []).length;
  const closeDivs = (content.match(/<\/div>/g) || []).length;
  const openGlance = (content.match(/<GlanceTrigger/g) || []).length;
  const closeGlance = (content.match(/<\/GlanceTrigger>/g) || []).length;
  
  console.log(`File: ${filePath}`);
  console.log(`divs: ${openDivs} / ${closeDivs}`);
  console.log(`GlanceTrigger: ${openGlance} / ${closeGlance}`);
  
  if (openDivs !== closeDivs) console.error('!!! DIV MISMATCH !!!');
  if (openGlance !== closeGlance) console.error('!!! GLANCE MISMATCH !!!');
}

checkJSX('src/features/member/components/FeatureCards.tsx');
checkJSX('src/features/member/components/TopicPageClient.tsx');
checkJSX('src/features/member/components/GlancePreview.tsx');
