import Gig from '../models/gig.model.js';
import User from '../models/user.model.js';
import { extractKeywords, buildSearchTextFromKeywords } from '../utils/aiHelper.js';

// Core matching function that can be used by other controllers (returns results array)
export async function matchFreelancersByPrompt(prompt, limit = 10){
  if(!prompt || typeof prompt !== 'string' || prompt.trim().length === 0){
    return [];
  }
  const keywords = extractKeywords(prompt);
  const searchText = buildSearchTextFromKeywords(keywords);

  // Debug logging to help trace why fewer matches are returned than expected
  try {
    console.log('[AI_MATCH] prompt:', prompt);
    console.log('[AI_MATCH] keywords:', keywords);
    console.log('[AI_MATCH] searchText:', searchText);
  } catch (e) { /* ignore logging errors */ }

  let gigs = [];
  if(searchText.length > 0){
    gigs = await Gig.find(
      { $text: { $search: searchText } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(50).lean();
  } else {
    gigs = await Gig.find().sort({ createdAt: -1 }).limit(50).lean();
  }

  // log how many raw gigs were returned by the text search (or fallback)
  try { console.log('[AI_MATCH] raw gigs found:', gigs.length); } catch(e){}

  const resultsBySeller = new Map();
  for(const gig of gigs){
    const textScore = gig.score || 0;
    const hay = [gig.title, gig.desc, gig.cat, gig.sortTitle, gig.sortDesc, (gig.features||[]).join(' ')].join(' ').toLowerCase();
    let matchCount = 0;
    const reasons = [];
    for(const kw of keywords){
      if(hay.includes(kw.toLowerCase())){ matchCount += 1; reasons.push(kw); }
    }
    const ratio = keywords.length>0 ? (matchCount / keywords.length) : 0;
    const combined = (textScore * 0.7) + (ratio * 100 * 0.3);

    const sellerId = gig.userId?.toString() || gig.userId;
    if(!sellerId) continue;
    const prev = resultsBySeller.get(sellerId);
    if(!prev || combined > prev.score){
      resultsBySeller.set(sellerId, { sellerId, bestGig: gig, score: combined, reasons: Array.from(new Set(reasons)) });
    }
  }

  const sellerIds = Array.from(resultsBySeller.keys());
  const users = await User.find({ _id: { $in: sellerIds } }).select('-password').lean();
  const userMap = new Map(users.map(u => [u._id.toString(), u]));

  const final = Array.from(resultsBySeller.values())
    .map(r => ({
      score: Math.round(r.score),
      reasons: r.reasons,
      seller: userMap.get(r.sellerId.toString()) || { _id: r.sellerId },
      gig: r.bestGig
    }))
    .sort((a,b) => b.score - a.score)
    .slice(0, limit);

  try {
    console.log('[AI_MATCH] sellers considered:', sellerIds.length, 'final matches returned:', final.length);
    console.log('[AI_MATCH] sellerIds sample:', sellerIds.slice(0,5));
  } catch(e) {}

  return final;
}

// POST /api/ai/searchFreelancer - Express handler
export const searchFreelancers = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if(!prompt || typeof prompt !== 'string' || prompt.trim().length === 0){
      return res.status(400).json({ success:false, message: 'prompt is required' });
    }
    const results = await matchFreelancersByPrompt(prompt, 10);
    return res.status(200).json({ success:true, total: results.length, results });
  } catch (err) {
    next(err);
  }
};

export default { searchFreelancers, matchFreelancersByPrompt };
