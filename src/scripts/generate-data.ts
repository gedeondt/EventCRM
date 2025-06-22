const count = parseInt(process.argv[2] || '0', 10) || 1;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api';

const firstNames = [
  'Carlos',
  'Mar\u00eda',
  'Juan',
  'Ana',
  'Luis',
  'Laura',
  'Miguel',
  'Sof\u00eda',
  'Pedro',
  'Luc\u00eda'
];

const lastNames = [
  'Garc\u00eda',
  'L\u00f3pez',
  'Mart\u00ednez',
  'Rodr\u00edguez',
  'S\u00e1nchez',
  'P\u00e9rez',
  'G\u00f3mez',
  'Fern\u00e1ndez',
  'D\u00edaz',
  'Torres'
];

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Hospitality'
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randName(): string {
  return `${rand(firstNames)} ${rand(lastNames)}`;
}

function randEmail(name: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, '.');
  return `${slug}@example.com`;
}

function randPhone(): string {
  return String(Math.floor(600000000 + Math.random() * 100000000));
}

function randomId(): string {
  return (
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  );
}

async function createClient(name: string): Promise<string> {
  const body = {
    clientId: randomId(),
    name,
    industry: rand(industries)
  };
  await fetch(`${BASE_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return body.clientId;
}

async function createContact(name: string): Promise<string> {
  const body = {
    contactId: randomId(),
    name,
    email: randEmail(name),
    phone: randPhone()
  };
  await fetch(`${BASE_URL}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return body.contactId;
}

async function linkContact(clientId: string, contactId: string) {
  await fetch(`${BASE_URL}/clients/${clientId}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contactId })
  });
}

async function createCase(clientId: string): Promise<string> {
  const body = {
    caseId: randomId(),
    clientId,
    openedAt: new Date().toISOString(),
    description: `Issue ${randomId().slice(0, 5)}`
  };
  await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return body.caseId;
}

async function addInteraction(caseId: string) {
  const body = {
    interactionDate: new Date().toISOString(),
    description: `Note ${randomId().slice(0, 5)}`
  };
  await fetch(`${BASE_URL}/cases/${caseId}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function closeCase(caseId: string) {
  const body = { closedAt: new Date().toISOString() };
  await fetch(`${BASE_URL}/cases/${caseId}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function main() {
  for (let i = 0; i < count; i++) {
    const clientId = await createClient(randName());
    const contactId = await createContact(randName());
    await linkContact(clientId, contactId);

    const caseCount = Math.floor(Math.random() * 6); // 0-5
    for (let c = 0; c < caseCount; c++) {
      const caseId = await createCase(clientId);
      const interactions = 1 + Math.floor(Math.random() * 10);
      for (let j = 0; j < interactions; j++) {
        await addInteraction(caseId);
      }
      if (Math.random() < 0.8) {
        await closeCase(caseId);
      }
    }
  }
  console.log(`Generated ${count} clients with related data`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
