// ../utils/parentingGuardrails.js

// Strong blocklists (tune as needed)
const DANGEROUS_PATTERNS = [
    // Violence / illegal
    /\b(kill|murder|harm|poison|assault|stab|shoot|buy\s*gun|make\s*bomb|arson|break\s?in|burglary|steal|kidnap|abduct|stalk)\b/i,
    // Self-harm
    /\b(suicide|self[-\s]?harm|self[-\s]?injur(y|e)|kill myself|end my life|cutting)\b/i,
    // Adult sexual content
    /\b(porn|nsfw|onlyfans|nude|nudes|erotic|fetish|sex\s*positions?|blowjob|handjob)\b/i,
    // Drugs
    /\b(cocaine|heroin|meth(amphetamine)?|lsd|ecstasy|mdma|fentanyl|ketamine|weed|marijuana|how to get high|vape)\b/i,
    // Weapons / explosives specifics
    /\b(suppressor|ghost gun|tannerite|homemade\s*(gun|explosive|grenade)|anfo)\b/i,
    // Hacking / cybercrime
    /\b(hack|ddos|phish|crack\s*passwords?|botnet|keylogger|malware|ransomware)\b/i,
  ];
  
  const MEDICAL_LEGAL_PATTERNS = [
    // medical diagnosis/treatment (we do not give medical advice)
    /\b(diagnos(e|is)|prescrib(e|ing)|dosage|antibiotic|treat(ment)?|medication|medicine|vaccine|contraindications?)\b/i,
    // legal/financial advice
    /\b(legal advice|contract law|sue|lawsuit|tax advice|deduction|withholding|investment advice|stocks?)\b/i,
  ];
  
  const CHILD_TERMS = [
    'child','kid','kids','children','toddler','baby','infant','newborn','teen','teenager','preteen',
    'son','daughter','my boy','my girl','my kid','my child','my toddler','my baby','parent','parenting',
    'student','students','daycare','preschool','school','classroom'
  ];
  
  const PARENTING_TOPICS = [
    'bedtime','sleep','tantrum','meltdown','behavior','discipline','routine','screen time','homework',
    'reading','literacy','milestone','play','activity','activities','language','speech','feeding',
    'picky eater','vegetables','toilet','potty','diaper','social','sharing','bullying','focus','study',
    'grades','friends'
  ];
  
  // Age cues like "3yo", "3-year-old", "18 months old"
  const AGE_PATTERNS = [
    /\b\d{1,2}\s?(yo|yrs?|years?)\b/i,
    /\b\d{1,2}\s?(-|\s)?year[-\s]?old\b/i,
    /\b\d{1,2}\s?(months?|mos?)\s?old\b/i,
  ];
  
  const normalize = (s) => s?.toLowerCase()?.trim() ?? '';
  
  const hasMatch = (str, regs) => regs.some((re) => re.test(str));
  
  const looksParentingRelated = (q) => {
    const n = normalize(q);
    const hasChildWord = CHILD_TERMS.some((w) => n.includes(w));
    const hasTopic = PARENTING_TOPICS.some((w) => n.includes(w));
    const hasAge = AGE_PATTERNS.some((re) => re.test(n));
    return hasChildWord || hasTopic || hasAge;
  };
  
  export function validateParentingQuery(prompt) {
    const q = normalize(prompt);
  
    // 1) Hard safety blocks
    if (hasMatch(q, DANGEROUS_PATTERNS) || hasMatch(q, MEDICAL_LEGAL_PATTERNS)) {
      return {
        isValid: false,
        type: 'safety',
        message: 'We only provide parenting tips.',
      };
    }
  
    // 2) Scope check: must look like parenting
    if (!looksParentingRelated(q)) {
      return {
        isValid: false,
        type: 'non_parenting',
        message: 'We only provide parenting tips.',
      };
    }
  
    // 3) OK
    return { isValid: true, type: 'ok', message: 'ok' };
  }
  
  // Optional: use this when calling your LLM to enforce scope server-side as well.
  export function parentingSystemPrompt() {
    return [
      {
        role: 'system',
        content:
          `You are ENACT, a parenting tips assistant.
  Only answer parenting questions. If a request is outside parenting, reply exactly:
  "We only provide parenting tips"
  Do not give medical, legal, financial, adult, or illegal guidance.
  Keep answers short, age-appropriate, actionable, and supportive. Avoid diagnosing.
  When unsure if it’s parenting-related, choose the safe response above.`,
      },
    ];
  }
  