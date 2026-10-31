# Bug-fix log

| # | Problem | Fix | Where | Test |
|---|---|---|---|---|
| 1 | After ~10 exchanges the trimmed history could start with an assistant message, which the AI APIs reject, so chat fell back to search results. | `normalizeMessages` merges same-role turns, caps history and removes leading assistant turns. Used by both the page and the API. | `src/lib/ai/messages.ts`, `Chat.tsx`, `api/chat/route.ts` | `messages.test.ts` |
| 2 | "what's up" / "sign up" set the state to Uttar Pradesh; "goal" set it to Goa. | Whole-word state matching. `up` and `mp` count only with a location cue ("from UP", "UP se"). Latest-mentioned state wins. More Hindi state names. | `src/lib/rag/profile.ts` | `rag.test.ts` |
| 3 | "5 years of farming" was read as age 5; "2nd year" as age 2. | Age needs a cue (age, umar, "N years old", "N saal ki", "I am N"). Ordinals are ignored. Latest mention wins. | `profile.ts` | `rag.test.ts` |
| 4 | Answers could be cut off, losing the official link and date at the end. | `max_tokens` 2048, and a localized "answer was cut short" note if the limit is still hit. | `src/lib/ai/client.ts`, `api/chat/route.ts` | manual (needs API key) |
| 5 | One flood of fake keys wiped every rate limit (`hits.clear()`); all header-less clients shared one bucket. | Eviction drops expired keys, then one-off keys, then oldest. Header-less clients are split by user-agent. | `src/lib/security/rateLimit.ts` | `security.test.ts` |
| 6 | A few clients could use up the whole daily AI budget. | Per-client daily cap (`DAILY_LLM_PER_CLIENT_LIMIT`, default 40) checked before the shared cap. | `src/lib/ai/budget.ts` | `security.test.ts` |
| 7 | Browser-supplied assistant messages were trusted. | History is normalized, and the system prompt says earlier assistant turns are untrusted. This reduces the risk; it cannot prove who wrote a message. | `messages.ts`, `systemPrompt.ts` | `security.test.ts` |
| 8 | Income: "loan of 5 lakh" counted as income; "20000 per month" was not annualised. | Amounts count only next to an income word, not after a loan word, and monthly amounts are x12. | `profile.ts` | `rag.test.ts` |
| 9 | Education: "12th pass ... BTech" gave class 11-12; "10th" was not detected; "school" made anyone a student; "no disability" set disability. | Highest level wins, 9th/10th added, bare "school" removed, negations handled. | `profile.ts` | `rag.test.ts` |
| 10 | Language flipped to English on short replies ("Uttarakhand"); "main" counted as Hinglish. | Short replies inherit the recent language; "main" removed. | `src/lib/rag/language.ts` | `rag.test.ts` |
| 11 | Body size was checked after reading everything, and counted characters. | Streamed read with a byte limit (chat limit raised to 200 KB for Devanagari). | `src/lib/errors.ts` | `security.test.ts` |
| 12 | AI call kept running after the user left. | Abort signal is passed to the AI provider call (Gemini and Anthropic); writes after close are ignored. | `api/chat/route.ts` | manual |
| 13 | Saved schemes did not sync between tabs. | `storage` event listener. | `src/lib/saved/store.ts` | manual |

Not changed on purpose: "my daughter" / "beti" sets gender to female. For a scheme search the beneficiary is often the daughter, so this is ambiguous by design.
