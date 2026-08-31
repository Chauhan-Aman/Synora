import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VisualsService {
  private readonly logger = new Logger(VisualsService.name);

  async generateDiagram(text: string, type: string): Promise<string> {
    try {
      this.logger.log(`Generating ${type} diagram via Llama 3.2...`);
      
      const prompt = `You are an expert at generating Mermaid JS diagrams.
I will give you a text. Your task is to extract the key concepts and relationships and output a valid Mermaid JS diagram of type: ${type}.
Only output the raw Mermaid code block. Do NOT include markdown \`\`\`mermaid backticks, just the raw code.
Do not include any other text, explanation, or HTML.

CRITICAL RULES FOR MERMAID SYNTAX:
1. NEVER use hyphens, dashes, or special punctuation (like -, :, ;, (, ), [, ]) in node names, as they break the Mermaid syntax.
2. Keep node names extremely short (1-4 words). Do NOT output long sentences or paragraphs.
3. If a node name must contain spaces or special characters, wrap it in double quotes (e.g., id("Node Name Here")) or standard shapes like id((Node Name)).
4. DO NOT use PlantUML syntax (like @startmindmap or @endmindmap). You MUST use valid Mermaid JS syntax starting with 'mindmap' or 'flowchart'.
5. For mindmaps, STRICT INDENTATION IS REQUIRED. You must use EXACTLY 2 spaces per indentation level. Never output an unindented node after the root, as that causes a "multiple roots" parsing error.
6. HIERARCHY IS MANDATORY. Do NOT attach 50 items directly to the root. You MUST group concepts into logical parent branches (e.g., categories) so the graph has depth, not just a massive flat list. Maximum 5-7 direct children per branch.

Example for mindmap:
mindmap
  root((Central Topic))
    Category 1
      Concept A
      Concept B
    Category 2
      Concept C
        Detail C1
        Detail C2

Example for flowchart LR:
flowchart LR
  A[Concept 1] --> B[Concept 2]

Generate a ${type} diagram for the following text:
"${text.substring(0, 3000)}"`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
          options: { temperature: 0.1 }
        })
      });

      if (!response.ok) throw new Error('Failed to reach local AI');
      const data = await response.json();
      
      // Clean up the output to ensure it's just raw mermaid code
      let diagram = data.response.trim();
      diagram = diagram.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
      
      // If Llama mistakenly outputs PlantUML, forcefully convert it to Mermaid syntax
      diagram = diagram.replace(/@startmindmap/gi, 'mindmap').replace(/@endmindmap/gi, '').trim();
      
      // Fallback if empty
      if (!diagram) {
        return type === 'mindmap' ? 'mindmap\n  root((No data extracted))' : 'flowchart LR\n  A[No data extracted]';
      }

      return diagram;
    } catch (error) {
      this.logger.error('Error generating diagram:', error);
      return type === 'mindmap' ? 'mindmap\n  root((Error generating diagram))' : 'flowchart LR\n  A[Error] --> B[Generation Failed]';
    }
  }

  async generateCoverTheme(title: string, content: string): Promise<any> {
    try {
      this.logger.log(`Generating procedural cover theme via Llama 3.2...`);
      
      const prompt = `You are an expert designer. Based on the following article title and content, determine a beautiful CSS gradient and visual theme.
Title: "${title}"
Content snippet: "${content.substring(0, 1000)}"

Return ONLY a strict JSON object with no markdown formatting or other text.
Format:
{
  "theme": "dark" | "light",
  "gradient": "string", // A valid CSS background gradient (e.g. "linear-gradient(135deg, #FF6B6B 0%, #556270 100%)")
  "patternOpacity": 0.1, // Float between 0.05 and 0.3
  "mood": "string" // A one word description like "Futuristic", "Nature", "Academic"
}`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
          format: 'json',
          options: { temperature: 0.4 }
        })
      });

      if (!response.ok) throw new Error('Failed to reach local AI');
      const data = await response.json();
      
      return JSON.parse(data.response.trim());
    } catch (error) {
      this.logger.error('Error generating cover theme:', error);
      return {
        theme: 'dark',
        gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        patternOpacity: 0.1,
        mood: 'Default'
      };
    }
  }
}
