# Publishing Prosekeep to npm

The GitHub repository is the source of truth. Updating `package.json` or `README.md` on GitHub does not change the npm package page: npm uses the content of the package tarball at the time a new version is published.

## Prosekeep 0.3.0

The source tree contains the full editorial suite in `package.json`, `README.md`, `CHANGELOG.md`, `skills/`, `src/`, `bin/`, `profiles/` and `docs/`.

1. Confirm `npm view prosekeep@0.3.0 version` does not already show 0.3.0. npm versions are immutable. If it is already published and the package page needs changes, prepare a new version (such as 0.3.1), keeping the npm manifest, skill metadata and versioned examples in sync.
2. Make sure changes have merged into `main`, GitHub tests have passed, and `npm test`, `npm run check` and `npm pack --dry-run` all succeed.
3. At the [prosekeep npm package settings](https://www.npmjs.com/package/prosekeep/access), add a **GitHub Actions trusted publisher**, using **quarterback** as owner, **prosekeep** as repository, and **publish.yml** as workflow filename. Permit **npm publish** (not only staged publishing). Configure it shortly before publishing; new trusted-publisher setups expire if the first publication is not completed within two days.
4. From the reviewed `main` commit for the package version, create and push the matching version tag:

   ```sh
   git checkout main
   git pull --ff-only origin main
   git tag v0.3.0
   git push origin v0.3.0
   ```

5. GitHub Actions runs `.github/workflows/publish.yml` on that tag. It checks that the tag matches the `package.json` version, runs tests, inspects the package and invokes `npm publish --access public` using npm's OpenID Connect trusted-publishing flow. No registry token is embedded in the repository.

After a successful publish, verify:

```sh
npm view prosekeep version
npm view prosekeep@0.3.0 description
npx --yes --package=prosekeep@0.3.0 prosekeep --help
```

Also confirm the [npm package page](https://www.npmjs.com/package/prosekeep) displays the expanded README and that `prosekeep-mcp` starts in a compatible MCP client. A successful npm publish alone does not establish client compatibility.

## Alternative: authenticated local publication

A package maintainer can publish from a tested checkout after `npm login`:

```sh
npm test
npm run check
npm pack --dry-run
npm publish --access public
```

Do not report the npm release as complete until npm confirms publication and the published version can be installed independently.
