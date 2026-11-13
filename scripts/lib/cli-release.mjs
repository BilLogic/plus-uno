// Release rules for the @plus-uno/cli package: the version is the release tag, and a
// version the registry already holds is a clean skip, never a failed publish.
const SEMVER = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

/** `v1.4.0` or `1.4.0` becomes `1.4.0`; anything else is not a release tag. */
export function versionFromTag(tag) {
  const match = SEMVER.exec(String(tag ?? '').trim());
  if (!match) throw new Error(`release tag "${tag}" is not a semver version (expected vX.Y.Z)`);
  return match[1];
}

/** `latest` for a plain version, the pre-release label (`next` style) otherwise, so a prerelease never takes `latest`. */
export function distTag(version) {
  const pre = /-([0-9A-Za-z]+)/.exec(version);
  return pre ? pre[1] : 'latest';
}

/** `view(spec)` returns the registry's answer for `name@version` ('' when absent). */
export function registryHas(view, name, version) {
  return String(view(`${name}@${version}`) ?? '').trim() === version;
}
