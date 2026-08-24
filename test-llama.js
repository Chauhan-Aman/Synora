const prompt = `
      You are an AI specialized in analyzing a user's knowledge graph to find GAPS and CONFLICTS.
      
      User's Top Topics: Physics, Quantum Mechanics, Machine Learning

      Identify 2 Knowledge Gaps (topics the user should learn next to connect their existing knowledge) 
      and 1 Potential Conflict or Nuance (a complex intersection of these topics).

      Respond ONLY with a valid JSON array of objects matching this schema:
      [
        {
          "type": "GAP" | "CONFLICT",
          "title": "Short title",
          "description": "Detailed explanation of the gap or conflict",
          "sources": ["Topic 1", "Topic 2"]
        }
      ]
    `;

fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'llama3.2',
        prompt: prompt,
        stream: false,
        format: 'json'
    })
}).then(res => res.json()).then(data => {
    console.log("LLAMA RESPONSE:");
    console.log(data.response);
    
    let responseText = data.response.trim();
    if (responseText.startsWith('\`\`\`')) {
        const lines = responseText.split('\n');
        lines.shift(); 
        if (lines[lines.length - 1].startsWith('\`\`\`')) {
            lines.pop(); 
        }
        responseText = lines.join('\n');
    }
    console.log("PARSED:");
    console.log(JSON.parse(responseText));
}).catch(console.error);
