import { defaultEmailTemplates, replaceVariables } from './server/lib/defaultEmailTemplates';

const template = defaultEmailTemplates.find(t => t.templateType === 'welcome_student');

if (!template) {
  console.error('Template not found');
  process.exit(1);
}

const data = {
  studentName: 'Vincent Holmes',
  dojoName: 'Test Dojo',
  dojoEmail: 'info@testdojo.com',
  dojoPhone: '(555) 123-4567'
};

const subject = replaceVariables(template.subject, data);
const html = replaceVariables(template.bodyHtml, data);

console.log('Subject:', subject);
console.log('HTML preview:', html.substring(0, 200));
console.log('✅ Template rendered successfully!');
