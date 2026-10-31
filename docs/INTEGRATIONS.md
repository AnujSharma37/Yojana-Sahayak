# Integrations and data sources

Status values: `official_api_documented`, `public_page_only`, `requires_approval`, `not_available`.

**Honest status:** this file was written in an environment that could not reach any government website, so none of the findings below have been confirmed yet. A team member must read each site's terms of use and developer documentation, then update the status and the date.

| Source | Public API? | Authentication | Rate limits | Permitted use | Status | Checked on |
|---|---|---|---|---|---|---|
| myScheme (myscheme.gov.in) | Not confirmed | Unknown | Unknown | Read the site's terms | TO CHECK | - |
| India.gov.in | Not confirmed | Unknown | Unknown | Read the site's terms | TO CHECK | - |
| National Scholarship Portal (scholarships.gov.in) | Not confirmed | Unknown | Unknown | Read the site's terms | TO CHECK | - |
| UMANG | Not confirmed | Unknown | Unknown | Partner integration may need approval | TO CHECK | - |
| API Setu (apisetu.gov.in) | Not confirmed | Unknown | Unknown | Many APIs need registration or approval | TO CHECK | - |
| Uttarakhand portals (uk.gov.in, scholarship.uk.gov.in, wecd.uk.gov.in) | Not confirmed | Unknown | Unknown | Read the site's terms | TO CHECK | - |

## What the app uses today

- **Data origin:** every record is `curated_from_public_page`. No live API is called. The `live_api` origin and the "Live API" badge exist for future use only.
- **Scraping:** none. `npm run verify-sources` only requests each public URL once to check reachability (HEAD, falling back to GET), with a 0.5-second pause between requests. It never logs in, never bypasses CAPTCHAs, and never stores page content.
- **LLM:** Google Gemini or the Anthropic Claude API (selected with `LLM_PROVIDER`, or automatically from whichever key is set), called from the server only. Keys are read from `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`.
