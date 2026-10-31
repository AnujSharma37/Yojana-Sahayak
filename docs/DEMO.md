# Demo script

All profiles below are **demo profiles**, not real people. Verify the schemes used in the demo before presenting (see README).

## Main journey (about 5 minutes)

Demo profile **"Demo Student, Uttarakhand"**: 19, female, lives in Uttarakhand, B.Tech first year, family income Rs 2 lakh a year.

1. Open the homepage. Point out the heading, the search box and the 8 category tiles.
2. Switch to **हिंदी** in the header and note the ✓ on the selected language.
3. In the search box, ask `मुझे छात्रवृत्ति चाहिए`. The assistant opens and answers in Hindi.
4. Answer the follow-up questions (state, course, income).
5. Open **पात्रता जांच** (Eligibility Checker) and enter the demo profile.
6. Show the three result groups (potentially eligible, more information required, appears ineligible). Point out the met / not met / unknown conditions and the guidance notice.
7. Open a scheme's detail page and show its benefits, eligibility, documents and steps.
8. Point out the official source link, the data-origin badge and the last-checked date.
9. Switch back to English.
10. Save the scheme, open Saved Schemes, remove it, then press Undo.

## Extra scenarios

- **Demo Farmer** (45, farmer, Uttarakhand): ask "schemes for farmers". Expect PM-KISAN, PMFBY and KCC.
- **Demo Woman** (30, female, low income): ask "schemes for women". Expect Ujjwala and PMMVY.
- **Demo Student in Hinglish:** ask `mujhe scholership chahiye uttrakhand se hu` (the typos are on purpose).

## Backup plan

- Seed the database before the demo (`npm run db:seed`) and keep a local copy running.
- Record a video of the main journey in advance.
- To show fallback mode, remove the AI key (`GEMINI_API_KEY` / `ANTHROPIC_API_KEY`) and restart. The chat then shows "The AI assistant is not available right now" along with matching scheme cards, which demonstrates that the site keeps working without AI.
