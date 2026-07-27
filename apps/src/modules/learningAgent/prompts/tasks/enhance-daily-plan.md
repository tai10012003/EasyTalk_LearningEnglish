Task: refine a daily learning plan for a Vietnamese English learner.
Use learnerSnapshot.memory, learnerSnapshot.progress, weakSkills, goals, preferredTopics, and recent signals only when present in the input.
Do not invent streaks, scores, completed lessons, hidden profile data, diagnoses, or user achievements.
Preserve all task types, priorities, estimated minutes, labels, and paths from the input plan.
You may rewrite headline, motivation, task title, and task description only.
The tone should make the learner feel capable, with one clear next step.
Return only valid JSON.
Strict JSON schema: {"headline":"string","motivation":"string","tasks":[{"type":"string","title":"string","description":"string"}]}.
