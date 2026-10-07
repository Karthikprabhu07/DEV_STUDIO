const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const configs = {
  'DashboardPage.tsx': { title: 'Dashboard | DevStudio', desc: 'Welcome to DevStudio, the official technology club platform of MITE.', can: '/' },
  'EventsPage.tsx': { title: 'Events | DevStudio', desc: 'Upcoming events, hackathons, and workshops at DevStudio.', can: '/events' },
  'ProjectsPage.tsx': { title: 'Projects | DevStudio', desc: 'Explore amazing projects built by DevStudio members.', can: '/projects' },
  'ChallengesPage.tsx': { title: 'Challenges | DevStudio', desc: 'Participate in coding challenges and level up your skills.', can: '/challenges' },
  'ResourcesPage.tsx': { title: 'Resources | DevStudio', desc: 'Learning materials, guides, and resources for DevStudio members.', can: '/resources' },
  'PrivacyPage.tsx': { title: 'Privacy Policy | DevStudio', desc: 'Privacy Policy and Data Protection at DevStudio.', can: '/privacy' },
  'TermsPage.tsx': { title: 'Terms & Conditions | DevStudio', desc: 'Terms and Conditions for DevStudio members.', can: '/terms' },
  'VerifyPage.tsx': { title: 'Verify Digital ID | DevStudio', desc: 'Verify a DevStudio member\'s Digital ID.', can: '/verify', noindex: true },
  'VerifyCertificatePage.tsx': { title: 'Verify Certificate | DevStudio', desc: 'Verify a DevStudio Certificate.', can: '/verify-certificate', noindex: true },
  
  // Authenticated pages (noindex)
  'ProfilePage.tsx': { title: 'My Profile | DevStudio', noindex: true },
  'DirectorConsolePage.tsx': { title: 'Director Console | DevStudio', noindex: true },
  'AttendancePage.tsx': { title: 'Attendance | DevStudio', noindex: true },
  'IdCardPage.tsx': { title: 'Digital ID | DevStudio', noindex: true }
};

for (const [file, config] of Object.entries(configs)) {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (!content.includes('react-helmet-async')) {
    // Add import
    content = content.replace(/(import React.*?from 'react'.*?\n)/, `$1import { Helmet } from 'react-helmet-async'\n`);
    
    // Create helmet block
    let helmetBlock = `\n      <Helmet>\n        <title>${config.title}</title>\n`;
    if (config.desc) helmetBlock += `        <meta name="description" content="${config.desc}" />\n`;
    if (config.can) helmetBlock += `        <link rel="canonical" href="https://devstudio.mite.ac.in${config.can}" />\n`;
    if (config.noindex) helmetBlock += `        <meta name="robots" content="noindex" />\n`;
    helmetBlock += `      </Helmet>\n`;
    
    // Inject after first return (
    content = content.replace(/(return\s*\(\s*<[^>]+>)/, `$1${helmetBlock}`);
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
}
