const fs = require('fs');
const path = require('path');
const execa = require('execa');

const ROOT_DIR = path.resolve(__dirname, '../..');

if (!process.env.NPM_TOKEN) {
  throw new Error(`NPM_TOKEN is not specified`);
}

execa.sync('git', ['status', '--porcelain'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
});

if (execa.sync('git', ['status', '--porcelain'], { cwd: ROOT_DIR }).stdout) {
  console.log(
    'This command must be executed on a clean repository. Found changes items:',
  );
  execa.sync('git', ['status', '--porcelain'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
  });
  process.exit(1);
}

// identify packages to be published in topological order
console.log('Resolving packages to publish...');
let packages = [];
try {
  const packagesToReleaseInOrder = execa.sync(
    'yarn',
    [
      'workspaces',
      'foreach',
      '--topological-dev',
      '--no-private',
      'run',
      'info:dir',
    ],
    { cwd: ROOT_DIR },
  );
  const workspaceDirsInOrder = packagesToReleaseInOrder.stdout
    .split('\n')
    .slice(0, -1)
    .map((str) => str.match(/[\S]+$/))
    .flat();
  const workspacesInfo = execa.sync('yarn', ['workspaces', 'list', '--json'], {
    cwd: ROOT_DIR,
  });
  const workspaces = workspacesInfo.stdout
    .split('\n')
    .map((text) => JSON.parse(text))
    .map((ws) => ({
      name: ws.name,
      location: ws.location,
      hasLicenseFile: fs.existsSync(
        path.resolve(ROOT_DIR, ws.location, 'LICENSE'),
      ),
      path: path.resolve(ROOT_DIR, ws.location),
      version: require(path.resolve(ROOT_DIR, ws.location, 'package.json'))
        .version,
    }));
  packages = workspaceDirsInOrder.map((dir) => {
    const pkg = workspaces.find((ws) => ws.path === dir);
    if (!pkg) {
      throw new Error(`Can't find package with location '${dir}'`);
    }
    return pkg;
  });
} catch (e) {
  console.log(`Something went wrong: ${e.message}`);
  process.exit(1);
}

// If the package does not have a LICENSE file, add it as this is required in `prepublish` step
// `lerna` does this by default and remove it when publishing finishes
// See https://github.com/lerna/lerna/issues/1213
packages.forEach((pkg) => {
  if (!pkg.hasLicenseFile) {
    fs.copyFileSync(
      path.resolve(ROOT_DIR, 'LICENSE'),
      path.resolve(pkg.path, 'LICENSE'),
    );
  }
});

// Try to publish all packages
for (const pkg of packages) {
  try {
    // Publish using Yarn NPM publish.
    const a = execa.sync(
      'yarn',
      ['npm', 'publish', '--tolerate-republish', ...process.argv.slice(2)],
      { cwd: pkg.path, stdio: 'inherit' },
    );
    console.log('huh why passed?', a);
    pkg.published = true;
  } catch {
    // do nothing
  }
}

const publishedPkgs = packages.filter((p) => p.published);
const unPublishedPkgs = packages.filter((p) => !p.published);

// Cleanup temporary LICENSE files added
packages.forEach((pkg) => {
  if (!pkg.hasLicenseFile) {
    fs.rmSync(path.resolve(pkg.path, 'LICENSE'));
  }
});

if (publishedPkgs.length > 0) {
  console.log(
    `Package(s) published successfully:\n${publishedPkgs
      .map((p) => `${p.name}@${p.version}`)
      .join('\n')}`,
  );
  publishedPkgs.forEach((pkg) => {
    // We create the tags after the push above so that we know that HEAD wont change and that pushing
    // wont suffer from a race condition if another merge happens in the mean time (pushing tags wont
    // fail if we are behind master).
    const tag = `${pkg.name}@${pkg.version}`;
    // NOTE: it's important we use the -m flag otherwise 'git push --follow-tags' wont actually push the tags
    // as the tag is not considered annotated
    // See https://git-scm.com/docs/git-push#Documentation/git-push.txt---follow-tags
    try {
      execa.sync('git', ['tag', '-a', tag, '-m', tag]);
      // NOTE: this log message is needed so that `changesets/action` can pick up the published version
      // and create Github release accordingly
      // See https://github.com/changesets/action/blob/master/src/run.ts
      console.log('New tag: ', tag);
    } catch (e) {
      console.log(e);
      console.log(
        `Failed to create tag: ${tag}. Please manually create this tag and push using \`git push --follow-tags\`. Error:\n${e.message}`,
      );
    }
  });
}

if (unPublishedPkgs.length > 0) {
  console.log(
    `Package(s) failed to publish:\n${unPublishedPkgs
      .map((p) => `${p.name}@${p.version}`)
      .join('\n')}`,
  );
  process.exit(1);
}
