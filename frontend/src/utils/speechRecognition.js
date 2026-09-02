/**
 * Speech Recognition utility wrapper for Web Speech API
 */
export const isSpeechSupported = () => {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

export const createSpeechRecognizer = (onResult, onError, onEnd) => {
  if (!isSpeechSupported()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-IN'; // English (India) with fallback to en-US

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    onResult({ finalTranscript, interimTranscript });
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
};

/**
 * Heuristically parses emergency facts from spoken voice transcript.
 */
export const parseVoiceTranscript = (transcript = '') => {
  const text = transcript.toLowerCase();

  // 1. Detect Emergency Type
  let emergency_type = 'general_evacuation';
  if (text.includes('flood') || text.includes('water') || text.includes('drown')) {
    emergency_type = 'flood_trapped';
  } else if (text.includes('landslide') || text.includes('mud') || text.includes('collapse') || text.includes('debris')) {
    emergency_type = 'landslide_collapse';
  } else if (text.includes('heart') || text.includes('labor') || text.includes('pregnant') || text.includes('doctor') || text.includes('bleed') || text.includes('medic')) {
    emergency_type = 'medical_emergency';
  } else if (text.includes('food') || text.includes('water') || text.includes('starv') || text.includes('hunger')) {
    emergency_type = 'food_water_shortage';
  } else if (text.includes('fire') || text.includes('smoke') || text.includes('burn')) {
    emergency_type = 'fire_emergency';
  }

  // 2. Trapped status
  const trapped = text.includes('trapped') || text.includes('stuck') || text.includes('stranded') || text.includes('isolated') || text.includes('roof') || text.includes('terrace');

  // 3. Medical requirement & injuries
  const medical_required = text.includes('medic') || text.includes('doctor') || text.includes('hospital') || text.includes('ambulance') || text.includes('injured') || text.includes('wound') || text.includes('fracture') || text.includes('pregnant');

  // 4. Extract number of people
  let people_affected = 1;
  const peopleMatch = text.match(/(\d+)\s*(people|persons|family|members|individuals|of us)/i);
  if (peopleMatch) {
    people_affected = parseInt(peopleMatch[1], 10);
  } else if (text.includes('two') || text.includes('couple')) {
    people_affected = 2;
  } else if (text.includes('three')) {
    people_affected = 3;
  } else if (text.includes('four')) {
    people_affected = 4;
  } else if (text.includes('five')) {
    people_affected = 5;
  } else if (text.includes('six')) {
    people_affected = 6;
  } else if (text.includes('family')) {
    people_affected = 4;
  }

  // 5. Vulnerable demographics
  const hasChild = text.includes('child') || text.includes('baby') || text.includes('infant') || text.includes('kid');
  const hasElderly = text.includes('elder') || text.includes('grand') || text.includes('old') || text.includes('senior');
  const hasPregnant = text.includes('pregnant') || text.includes('delivery') || text.includes('labor');
  const hasDisabled = text.includes('disabled') || text.includes('wheelchair') || text.includes('blind');

  // 6. Resources required
  const required_resources = [];
  if (text.includes('boat') || emergency_type === 'flood_trapped') required_resources.push('boats', 'life_jackets');
  if (text.includes('food')) required_resources.push('food');
  if (text.includes('water')) required_resources.push('water');
  if (medical_required) required_resources.push('first_aid', 'ambulances');
  if (text.includes('blanket') || text.includes('cold')) required_resources.push('blankets');

  return {
    emergency_type,
    description: transcript,
    trapped,
    medical_required,
    people_affected: Math.max(1, people_affected),
    children: hasChild ? 1 : 0,
    elderly: hasElderly ? 1 : 0,
    pregnant_persons: hasPregnant ? 1 : 0,
    disabled_persons: hasDisabled ? 1 : 0,
    injured_persons: medical_required ? 1 : 0,
    required_resources: Array.from(new Set(required_resources)),
  };
};
