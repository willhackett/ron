# ron.

A working startup proposal for adviser-led private wealth software, using fictional UK and Australian records. This is a discussion demo, not an operating financial service.

## Run locally

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173/. Start with the customer or firm journey, or take the seven-step feature tour. Use the region selector to switch between independent UK and Australian examples. The logo and **Demo start** link return to the beginning. Example changes are stored in your browser; **Reset prototype** restores the examples.

## What is simulated

AI document extraction, account connections, advice, calls, DocuSign, trading, money movement and tax submissions. No actual customer records or financial providers are connected. The cash-protection checker uses separate editable example balances; it does not imply the portfolio has those deposits. Tax rules are curated, source-dated examples, not a complete tax engine.

## Checks

```sh
node tests/plan-model.cjs
node tests/cash-protection.cjs
python3 scripts/check-site.py
```

The model tests cover funding allocations and taxes, exclusions, approvals and execution dependencies, jurisdiction differences, and bank-protection aggregation by legal holder and licence.

## Publishing

Pushes to `main` run the checks and publish `dist/` through GitHub Actions to GitHub Pages. The configured custom domain is **ron.ideas.willhackett.com**. `dist/CNAME` records the domain; the Pages configuration must also contain it.

DNS to add in the `willhackett.com` zone:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | ron.ideas | willhackett.github.io |

After DNS propagates, GitHub can provision the HTTPS certificate. HTTPS enforcement can be enabled once the certificate is available.

Every HTML page has `noindex,nofollow,noarchive`; `robots.txt` blocks crawling. These are search-engine instructions, not access control. The Pages site and source repository are public.

## Source

- `dist/`: published website and interactive demo
- `dist/journeys.js`: opening page, customer/firm explanations, limits screen and tour integration
- `dist/cash-protection.js`: deposit grouping by legal holder and banking licence
- `dist/plan-model.js`: illustrative investment/funding model
- `scripts/build-proposal.py`: generates the UK/AU proposal pages
- `scripts/check-site.py`: noindex, local link/asset and hosting-file checks
- `tests/`: focused model checks

Official sources for deposit examples: [APRA Financial Claims Scheme](https://www.apra.gov.au/financial-claims-scheme-fcs) and [FSCS deposit limit](https://www.fscs.org.uk/what-we-cover/banks-building-societies-credit-unions/deposit-limit/). Checked 17 October 2026. Other rule sources and model limitations are available in the demo’s rule register.
