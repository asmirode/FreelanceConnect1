// Simple keyword extraction helper used by the AI matching endpoint.
// This is intentionally lightweight to avoid extra dependencies.
export const DEFAULT_STOPWORDS = new Set([
  'i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves',
  'he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves',
  'what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','do','does','did',
  'but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after',
  'above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how',
  'all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','can','will','just'
]);

export function extractKeywords(text){
  if(!text || typeof text !== 'string') return [];
  // Normalize
  let s = text.toLowerCase();
  // Replace common punctuation with spaces
  s = s.replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()\[\]"><\?\|+]/g,' ');
  // Split into tokens
  const tokens = s.split(/\s+/).map(t=>t.trim()).filter(Boolean);
  const keywords = [];
  const seen = new Set();
  for(const t of tokens){
    if(t.length <= 2) continue; // ignore tiny tokens
    if(DEFAULT_STOPWORDS.has(t)) continue;
    // drop numbers that look like isolated numbers
    if(/^\d+$/.test(t)) continue;
    // de-dup
    if(!seen.has(t)){
      seen.add(t);
      keywords.push(t);
    }
  }
  return keywords;
}

export function buildSearchTextFromKeywords(keywords){
  if(!Array.isArray(keywords) || keywords.length===0) return '';
  // join keywords with spaces for $text search; wrap multi-word tokens in quotes if needed
  return keywords.join(' ');
}

export default { extractKeywords, buildSearchTextFromKeywords };
