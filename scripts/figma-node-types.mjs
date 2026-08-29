/**
 * The registry's claim about a Figma node, against what the node actually is.
 *
 * WHAT `componentSetNodeId` PROMISES AND WHAT IT DELIVERS. Every mapping in
 * `design-system/figma/component-registry.json` names its Figma node in a field
 * called `componentSetNodeId`. Read live on 2026-08-29, 15 of the 95 mapped
 * nodes are not component sets: three are PAGEs and twelve are plain
 * COMPONENTs. A plain COMPONENT is not an error — a component with no variants
 * has no set — but the field name says otherwise, and code that assumed
 * `componentPropertyDefinitions` on one of them throws on the getter
 * (`figma-use` rule 18).
 *
 * `isComponentSet: false` is the field that says so. Before this pass six
 * entries carried it and seven more needed it, which is the state a field with
 * no reader ends up in: nothing in the repo consumed `isComponentSet`, so
 * nothing noticed the seven.
 *
 * WHY THE MEASUREMENT IS A FILE. No CI job has Figma access, so a check cannot
 * ask Figma anything. What it CAN do is hold the registry to a measurement
 * somebody took and wrote down — `design-system/figma/node-types.json`, dated,
 * with the method on it. That makes the audit load-bearing rather than
 * narrative: repoint an id and the recording no longer covers it; flip a flag
 * and it disagrees; delete a mapping and its recording is stale.
 *
 * WHAT IT STILL CANNOT TELL YOU. Whether the node is the RIGHT one. `Alert →
 * 11:324` resolves to a component set named `Alert`; whether it is the alert
 * the code implements is a judgement no id check makes. See
 * `design-system/figma/registry-audit.md`.
 */

/** Every mapped node, as `{component, set, nodeId, fileKey, claimsSet}`. */
export function mappings(registry) {
  const out = [];
  const defaultKey = registry.figmaFile?.fileKey;
  for (const [component, entry] of Object.entries(registry.components ?? {})) {
    const fileKey = entry.figma?.fileKey ?? defaultKey;
    for (const set of entry.figma?.sets ?? []) {
      if (!set.componentSetNodeId) continue;
      out.push({
        component,
        set: set.name ?? '(unnamed set)',
        nodeId: set.componentSetNodeId,
        fileKey,
        // Absent means "a set" — that is what the field name asserts, and it is
        // the reading every consumer would take. Making the default explicit is
        // what turns 89 silent entries into 89 checked claims.
        claimsSet: set.isComponentSet === undefined ? true : set.isComponentSet,
      });
    }
  }
  for (const [name, pattern] of Object.entries(registry.patterns ?? {})) {
    if (!pattern.componentSetNodeId) continue;
    out.push({
      component: `pattern:${name}`,
      set: name,
      nodeId: pattern.componentSetNodeId,
      fileKey: defaultKey,
      claimsSet: pattern.isComponentSet === undefined ? true : pattern.isComponentSet,
    });
  }
  return out;
}

/**
 * Every disagreement between the registry and the recording.
 *
 * @param {object} registry `component-registry.json`, parsed.
 * @param {object} recording `node-types.json`, parsed.
 * @returns {string[]} One line per problem; empty when the two agree.
 */
export function failures(registry, recording) {
  const found = [];
  const nodes = recording.nodes ?? {};
  const mapped = mappings(registry);
  const seen = new Set();

  for (const m of mapped) {
    seen.add(m.nodeId);
    const record = nodes[m.nodeId];
    const where = `${m.component} / ${m.set} (${m.nodeId})`;

    // 1. A mapping nobody has looked at. The whole point of the recording is
    //    that `status: "verified"` is a word and this is a measurement, so a
    //    new mapping arriving unmeasured must not pass by defaulting to true.
    if (!record) {
      found.push(`${where}: no recorded node type. Re-run the audit and record it.`);
      continue;
    }

    // 2. A link that opens on nothing. Four of these shipped as `verified`.
    if (record.type === 'MISSING') {
      found.push(`${where}: recorded as MISSING — the link opens on nothing.`);
      continue;
    }

    // 3. The claim itself.
    const isSet = record.type === 'COMPONENT_SET';
    if (m.claimsSet !== isSet) {
      found.push(
        m.claimsSet
          ? `${where}: field is componentSetNodeId but the node is a ${record.type}. ` +
              `Add "isComponentSet": false.`
          : `${where}: marked "isComponentSet": false but the node IS a COMPONENT_SET. ` +
              `Remove the flag.`,
      );
    }

    // 4. Which FILE the id was read in. The first pass of this audit checked
    //    all 97 ids against one of the two files and reported thirteen missing
    //    nodes; ten of those were the other file's and the registry was right
    //    about every one. A recording that does not say which file it read in
    //    can repeat that mistake silently.
    if (record.file && m.fileKey && record.file !== m.fileKey) {
      found.push(
        `${where}: recorded against file ${record.file}, registry says ${m.fileKey}. ` +
          `One of the two is wrong, and a node id only means anything inside its file.`,
      );
    }
  }

  // 5. A recording for something no longer mapped. Left alone it becomes a
  //    measurement of nothing that still reads as coverage.
  for (const nodeId of Object.keys(nodes)) {
    if (!seen.has(nodeId)) {
      found.push(`${nodeId}: recorded, but no registry entry maps it. Remove it, or re-add the mapping.`);
    }
  }

  return found;
}
