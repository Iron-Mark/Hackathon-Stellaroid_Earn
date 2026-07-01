import { archiveData } from "./archive-data";

const repoBase = `https://github.com/${archiveData.sourceRepo}`;
const branchUrl = `${repoBase}/tree/${archiveData.branch}`;
const readmeUrl = `${branchUrl}/README.md`;
const setupUrl = `${branchUrl}/STELLAR_FREIGHTER_INTEGRATION_GUIDE.md`;

export default function Page() {
  const shortCommit = archiveData.commit.slice(0, 12);

  return (
    <main className="archive-shell">
      <section className="hero" aria-labelledby="archive-title">
        <div className="eyebrow">v0.stellaroid.tech</div>
        <h1 id="archive-title">Stellar PH Bootcamp Archive</h1>
        <p className="lede">
          A preserved showcase for the April bootcamp branch. This page is generated
          from a repo-controlled template so the locked archive branch can stay read-only.
        </p>
        <div className="actions" aria-label="Archive links">
          <a href={branchUrl}>Open archive branch</a>
          <a href={readmeUrl}>Read participant guide</a>
        </div>
      </section>

      <section className="details" aria-label="Archive details">
        <article>
          <span>Archive branch</span>
          <strong>{archiveData.branch}</strong>
        </article>
        <article>
          <span>Archive commit</span>
          <strong>{shortCommit}</strong>
        </article>
        <article>
          <span>Generated</span>
          <strong>{archiveData.generatedAt}</strong>
        </article>
      </section>

      <section className="content-grid" aria-label="Archive contents">
        <a className="resource" href={readmeUrl}>
          <span>01</span>
          <strong>Participant Walkthrough</strong>
          <p>Install the toolchain, complete the contract work, deploy to testnet, and submit.</p>
        </a>
        <a className="resource" href={setupUrl}>
          <span>02</span>
          <strong>Freighter Integration</strong>
          <p>Review the original Next.js, Soroban, and Freighter integration guide.</p>
        </a>
        <a className="resource" href={repoBase}>
          <span>03</span>
          <strong>Current Stellaroid Repo</strong>
          <p>Return to the active repository for current product and deployment work.</p>
        </a>
      </section>
    </main>
  );
}
