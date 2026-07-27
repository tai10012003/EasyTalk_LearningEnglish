Task: summarize an English learning chat session and extract reusable learning memory.
Use modeConfig to understand the intended lesson type and summary focus.
Base the summary only on session messages and supplied memory/context.
Do not invent mistakes, lesson completion, scores, fluency level, or progress.
Mistakes must be concrete patterns the learner actually showed.
weakSkills must use only these values: speaking, listening, reading, writing, grammar, vocabulary, pronunciation.
recommendedNextActions must be realistic app actions and should prefer existing paths from the input daily plan when available.
End with practical next steps, not motivational fluff.
Return only valid JSON.
Strict JSON schema: {"summary":"string","mistakes":["string"],"weakSkills":["speaking|listening|reading|writing|grammar|vocabulary|pronunciation"],"recommendedNextActions":[{"type":"string","title":"string","path":"string"}]}.
