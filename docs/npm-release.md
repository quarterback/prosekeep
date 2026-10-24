# Publishing Prosekeep to npm

The GitHub repository is the source of truth. Updating `package.json` or `README.md` on GitHub does not change the npm package page: npm uses the content of the package tarball at the time a new version is published. [GitHub Actions](https://github.com/quarterback/prosekeep/actions/workflows/publish.yml) can perform the publish from a phone once npm trusted publishing is configured.

## Prosekeep 0.3.0

The source tree contains the full editorial suite in `package.json`, `README.md`, `CHANGELOG.md`, `skills/`, `src/`, `bin/`, `profiles/` and `docs/`.

1. Confirm `npm view prosekeep@0.3.0 version` does not already show 0.3.0. npm versions are immutable. If it is already published and the package page needs changes, prepare a new version (such as 0.3.1), keeping the npm manifest, skill metadata and versioned examples in sync.
2. Make sure changes have merged into `main`, GitHub tests have passed, and `npm test`, `npm run check` and `npm pack --dry-run` all succeed.
3. At the [prosekeep npm package settings](https://www.npmjs.com/package/prosekeep/access), add a **GitHub Actions trusted publisher**, using **quarterback** as owner, **prosekeep** as repository, and **publish.yml** as workflow filename. Permit **npm publish** (not only staged publishing). Configure it shortly before publishing; new trusted-publisher setups expire if the first publication is not completed within two days.
4. **Publish from a phone (recommended):** In a mobile browser, open the [Publish to npm GitHub Actions workflow](https://github.com/quarterback/prosekeep/actions/workflows/publish.yml). Select **Run workflow**, choose **main**, then select **Run workflow** again to confirm. If the control is hidden on mobile, use the browser's **Request Desktop Website** option. The workflow checks the `package.json` version, runs the tests, inspects the package and calls `npm publish --access public`. You do not need a terminal or Git tag.
5. **Optional tag-based release:** From the reviewed `main` commit for the package version, create a matching release tag (`v0.3.0` for version `0.3.0`). You can use GitHub's Releases page to draft a release, create the new tag targeting `main` and publish the release, or use:

   ```sh
   git checkout main
   git pull --ff-only origin main
   git tag v0.3.0
   git push origin v0.3.0
   ```

   Either route starts the same trusted-publishing workflow. Manual workflow runs are restricted to `main`, and version-tag releases must match the version in `package.json`. No registry token is embedded in the repository.

After a successful publish, verify:

```sh
npm view prosekeep version
npm view prosekeep@0.3.0 description
npx --yes --package=prosekeep@0.3.0 prosekeep --help
```

Also confirm the [npm package page](https://www.npmjs.com/package/prosekeep) displays the expanded README and that `prosekeep-mcp` starts in a compatible MCP client. A successful npm publish alone does not establish client compatibility.

## Alternative: authenticated local publication (desktop)

A package maintainer can publish from a tested checkout after `npm login`:

```sh
npm test
npm run check
npm pack --dry-run
npm publish --access public
```

Do not report the npm release as complete until npm confirms publication and the published version can be installed independently.
