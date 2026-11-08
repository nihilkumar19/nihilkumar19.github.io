const labExamples = {
  api: {
    kicker: 'PATTERN 01 / API DESIGN',
    title: 'Validate first. Persist second.',
    text: 'A request should cross clear boundaries: validate its shape, check that the actor may perform it, then write and return a predictable response.',
    code: `<span class="muted">// Small, explicit steps make the API easier to reason about.</span>\n<span class="key">$data</span> = $request-&gt;validate([\n  <span class="string">'visitor_name'</span> =&gt; <span class="string">'required|string|max:120'</span>,\n  <span class="string">'host_id'</span> =&gt; <span class="string">'required|exists:users,id'</span>,\n]);\n\n<span class="muted">// Bind the action to the current building.</span>\n<span class="key">$this</span>-&gt;authorize(<span class="string">'create'</span>, [Visit::class, $building]);\n\n<span class="key">$visit</span> = $building-&gt;visits()-&gt;create($data);\n<span class="key">return</span> response()-&gt;json([<span class="string">'data'</span> =&gt; $visit], 201);`,
    action: 'Simulate request',
    output: '201 Created  ·  visit scoped to building  ·  response returned'
  },
  tenant: {
    kicker: 'PATTERN 02 / ACCESS BOUNDARIES',
    title: 'Scope data to its tenant.',
    text: 'When a product serves multiple organizations, each read and write must carry the active tenant context. Switch the tenant below to see the query scope change.',
    code: `<span class="muted">// Tenant context is resolved from an authenticated membership.</span>\n<span class="key">$tenantId</span> = $request-&gt;user()-&gt;currentTenantId();\n\n<span class="key">$visits</span> = Visit::query()\n  -&gt;where(<span class="string">'tenant_id'</span>, $tenantId)\n  -&gt;whereDate(<span class="string">'scheduled_at'</span>, today())\n  -&gt;latest(<span class="string">'scheduled_at'</span>)\n  -&gt;get();\n\n<span class="comment">// A user cannot select a tenant they do not belong to.</span>`,
    action: 'scope'
  },
  query: {
    kicker: 'PATTERN 03 / DATABASE PERFORMANCE',
    title: 'Aggregate close to the data.',
    text: 'For dashboard totals, let SQL count and group the matching records instead of loading every row into PHP. Keep the time and tenant filters inside the query.',
    code: `<span class="key">$dailyCounts</span> = Visit::query()\n  -&gt;where(<span class="string">'tenant_id'</span>, $tenantId)\n  -&gt;whereBetween(<span class="string">'checked_in_at'</span>, [$start, $end])\n  -&gt;selectRaw(<span class="string">'DATE(checked_in_at) AS day, COUNT(*) AS total'</span>)\n  -&gt;groupBy(<span class="string">'day'</span>)\n  -&gt;orderBy(<span class="string">'day'</span>)\n  -&gt;get();\n\n<span class="muted">// Return a compact shape for the dashboard chart.</span>`,
    action: 'Recalculate summary',
    output: '7 days  ·  186 visits  ·  4.2 ms simulated query'
  }
};

const labContent = document.querySelector('#lab-content');
const labKicker = document.querySelector('#lab-kicker');

function renderLab(key) {
  const example = labExamples[key];
  labKicker.textContent = example.kicker;
  document.querySelectorAll('.lab-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.lab === key));

  let actionMarkup = '';
  if (key === 'tenant') {
    actionMarkup = `<div class="tenant-controls"><label for="tenant-select">ACTIVE TENANT CONTEXT</label><select id="tenant-select"><option value="204">Northstar House · #204</option><option value="318">Fern Residency · #318</option><option value="527">Cedar Works · #527</option></select></div><div class="scope-result" id="scope-result">WHERE <b>tenant_id = 204</b> &nbsp;·&nbsp; only records for Northstar House</div>`;
  } else if (key === 'query') {
    actionMarkup = `<div class="query-stats"><div><small>LAST 7 DAYS</small><b>186</b><em>visits</em></div><div><small>PEAK DAY</small><b>38</b><em>Tuesday</em></div><div><small>AVG. WAIT</small><b>4.2m</b><em>to check-in</em></div></div><div class="code-row"><span>Illustrative summary · simulated values</span><button class="mini-run" id="lab-run">${example.action} ↻</button></div><div class="api-output" id="api-output" aria-live="polite"></div>`;
  } else {
    actionMarkup = `<div class="code-row"><span>Try the response model · local simulation only</span><button class="mini-run" id="lab-run">${example.action} ↗</button></div><div class="api-output" id="api-output" aria-live="polite"></div>`;
  }

  labContent.innerHTML = `<div class="lab-copy"><h3>${example.title}</h3><p>${example.text}</p></div><pre class="code-window"><code>${example.code}</code></pre>${actionMarkup}`;

  if (key === 'tenant') {
    document.querySelector('#tenant-select').addEventListener('change', event => {
      const select = event.currentTarget;
      const place = select.options[select.selectedIndex].text.split(' · ')[0];
      document.querySelector('#scope-result').innerHTML = `WHERE <b>tenant_id = ${select.value}</b> &nbsp;·&nbsp; only records for ${place}`;
    });
  } else {
    document.querySelector('#lab-run').addEventListener('click', event => {
      const output = document.querySelector('#api-output');
      event.currentTarget.disabled = true;
      output.textContent = key === 'api' ? 'Validating…' : 'Aggregating…';
      window.setTimeout(() => {
        output.textContent = example.output;
        event.currentTarget.disabled = false;
      }, 320);
    });
  }
}

document.querySelectorAll('.lab-tab').forEach(tab => tab.addEventListener('click', () => renderLab(tab.dataset.lab)));
renderLab('api');

const dialog = document.querySelector('#visitor-demo');
document.querySelector('[data-demo-open="visitor"]').addEventListener('click', () => {
  document.querySelector('#demo-result').textContent = '';
  document.querySelector('#checkin-button').disabled = false;
  dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
document.querySelector('#checkin-button').addEventListener('click', event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = 'Confirming pass…';
  window.setTimeout(() => {
    button.textContent = 'Checked in ✓';
    button.classList.remove('button-dark');
    button.classList.add('button-light');
    document.querySelector('#demo-result').textContent = 'Check-in recorded in this demo · Host notified';
  }, 520);
});

document.querySelector('#year').textContent = new Date().getFullYear();
