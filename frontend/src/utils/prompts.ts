export const DIAGNOSTIC_PROMPTS = [
  {
    label: 'Clarify research question',
    prompt:
      'Help me narrow the current research question. State the exact problem, what is still ambiguous, and what evidence I need next.',
  },
  {
    label: 'Build experiment plan',
    prompt:
      'Build a concrete experiment plan for this workflow. Include hypothesis, variables, evaluation criteria, and immediate next actions.',
  },
  {
    label: 'Diagnose current result',
    prompt:
      'Diagnose the current result or bottleneck in this workflow. Point out likely failure modes and the fastest way to reduce uncertainty.',
  },
  {
    label: 'Draft next-step tasks',
    prompt:
      'Turn the current state of this workflow into a short list of structured next-step tasks with owners, claims, and execution priorities.',
  },
] as const;

export const CHAT_GUIDE_QUESTIONS = [
  'What specific research problem are you trying to move forward?',
  'Which stage are you in right now?',
  'What evidence or result do you already have?',
  'What is the main bottleneck at this moment?',
  'What is the smallest next action that would reduce uncertainty?',
];

