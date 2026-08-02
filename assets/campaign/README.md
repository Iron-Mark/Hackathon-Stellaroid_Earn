# Campaign assets, v3.2.0

Marketing and launch graphics for the July 2026 cycle. Nothing in the
application imports these; they exist for posting and for reuse. Product
screenshots that the README or the site actually render live in `images/`
instead.

Every board is rendered from the project's own design system: the real
`frontend/public/logo.svg` pixel coin, the brand tokens in
`frontend/src/styles/globals.css` (navy `#0F172A`, amber `#F59E0B`, violet
`#8B5CF6`), and the Orbitron / Exo 2 / JetBrains Mono type stack. Each carries
the "Stellar Testnet, no real funds" chip and the deployed contract and WASM
identifiers as a corner texture line, so no board can circulate without its
testnet qualifier.

## Launch set, 2560x1280

For the GitHub release page and announcement posts.

| File | Use |
| --- | --- |
| `v320-hero.png` | Release header, static announcement opener |
| `v320-receipts.png` | The verifiable numbers, best reply asset for a technical audience |
| `v320-flow.png` | The six-step proof-to-payment strip, best reply for "how does it work" |

## Landscape set, 3200x1800

16:9 for slides, blog headers, or a future landing page. One per audience.

| File | Audience |
| --- | --- |
| `m-general.png` | General |
| `m-employer.png` | Employers |
| `m-issuer.png` | Bootcamps and credential issuers |
| `m-graduate.png` | Graduates |

## Square set, 2160x2160

LinkedIn and Facebook posts. On Instagram they work as a carousel in the order
listed, which is deliberate: the general board hooks, then the three audiences
follow.

| File | Audience |
| --- | --- |
| `sq-general.png` | General |
| `sq-employer.png` | Employers |
| `sq-issuer.png` | Bootcamps and credential issuers |
| `sq-graduate.png` | Graduates |

## Story and motion

| File | Use |
| --- | --- |
| `story-general.png` | Instagram and Facebook stories, 2160x3840. Padded so the profile chip and reply bar do not cover the call to action |
| `stellaroid-teaser.gif` | 14 seconds at 640px, cut from `demo/stellaroid-earn-demo.mp4`. Autoplays in Discord, which makes it the strongest opener there |

## Posting notes

- **One image per message on Discord.** Several attachments collapse into a
  grid and each gets less attention. Keep the rest for thread replies, since
  replies keep a thread alive while edits do not.
- **On LinkedIn, do not put a URL in the post body.** LinkedIn replaces your
  image with its own link card. Attach the image and put links in the first
  comment.
- Story images are not clickable. Add a link sticker.

## Regenerating

These were rendered from HTML with Playwright at `deviceScaleFactor: 2`, the
same approach used for the Apple splash screens. The capture scripts were
temporary and are not committed. To produce a new set, rebuild the boards from
the tokens above rather than editing these PNGs, and keep the testnet chip and
the identifier line on every board.

The same assets are also attached to the
[v3.2.0 release](https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn/releases/tag/v3.2.0)
for direct download without cloning.
