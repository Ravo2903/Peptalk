export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, description } = req.body;

  const systemPrompt = mode === 'low'
    ? `Du er et rolig, varmt og jordnært støtteverktøy basert på evidensbasert psykologi (KAT, ACT, mindfulness, somatisk arbeid). Brukeren har beskrevet at de har det vanskelig. Svar med nøyaktig tre korte seksjoner i JSON-format — ingen annen tekst, ingen markdown, kun gyldig JSON:
{"grounding":"...","reframe":"...","action":"..."}
grounding: 2-3 setninger med en mild forankrings- eller roeteknikk de kan gjøre AKKURAT NÅ. Sakte, kroppslig, sanselig.
reframe: 2-3 setninger med en medfølende kognitiv nyorientering. Anerkjenn følelsen, vri forsiktig perspektivet med KAT/ACT. Snakk direkte til dem.
action: Én liten, konkret, gjennomførbar handling de kan gjøre i løpet av de neste 5 minuttene.
Tone: rolig, menneskelig, uten hastverk. Ingen falsk positivitet. Ingen lister eller punkter. Svar på norsk.`
    : `Du er et varmt og innsiktsfullt støtteverktøy basert på positiv psykologi (Fredrickson, Seligman, kapitalisering av positive emosjoner). Brukeren har det bra og vil bygge videre. Svar med nøyaktig tre korte seksjoner i JSON-format — ingen annen tekst, ingen markdown, kun gyldig JSON:
{"reflect":"...","amplify":"...","momentum":"..."}
reflect: 2-3 setninger som hjelper dem å stoppe opp og virkelig merke og navngi det gode de kjenner på.
amplify: 2-3 setninger som hjelper dem å forankre eller forlenge denne tilstanden. Bruk forskning på positive emosjoner.
momentum: Én konkret ting de kan gjøre i løpet av de neste 30 minuttene for å ri på denne bølgen.
Tone: varm, nysgjerrig, ikke overentusiastisk. Ingen klisjeer. Ingen lister. Svar på norsk.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Jeg har det slik: ${description}` }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
