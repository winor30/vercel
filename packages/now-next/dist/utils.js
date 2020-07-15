'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.getSourceFilePathFromPage = exports.isDynamicRoute = exports.normalizePage = exports.syncEnvVars = exports.getRoutes = exports.getPathsInside = exports.getNextConfig = exports.normalizePackageJson = exports.excludeLockFiles = exports.validateEntrypoint = exports.excludeFiles = exports.getPrerenderManifest = exports.getExportStatus = exports.getExportIntent = exports.createLambdaFromPseudoLayers = exports.createPseudoLayer = exports.ExperimentalTraceVersion = exports.getDynamicRoutes = exports.getRoutesManifest = void 0;
const zlib_1 = __importDefault(require('zlib'));
const path_1 = __importDefault(require('path'));
const fs_extra_1 = __importDefault(require('fs-extra'));
const semver_1 = __importDefault(require('semver'));
const yazl_1 = require('yazl');
const buffer_crc32_1 = __importDefault(require('buffer-crc32'));
const async_sema_1 = require('async-sema');
const resolve_from_1 = __importDefault(require('resolve-from'));
const build_utils_1 = __importDefault(require('./build-utils'));
const {
  streamToBuffer,
  Lambda,
  NowBuildError,
  isSymbolicLink,
} = build_utils_1.default;
// Identify /[param]/ in route string
// eslint-disable-next-line no-useless-escape
const TEST_DYNAMIC_ROUTE = /\/\[[^\/]+?\](?=\/|$)/;
function isDynamicRoute(route) {
  route = route.startsWith('/') ? route : `/${route}`;
  return TEST_DYNAMIC_ROUTE.test(route);
}
exports.isDynamicRoute = isDynamicRoute;
/**
 * Validate if the entrypoint is allowed to be used
 */
function validateEntrypoint(entrypoint) {
  if (
    !/package\.json$/.exec(entrypoint) &&
    !/next\.config\.js$/.exec(entrypoint)
  ) {
    throw new NowBuildError({
      message:
        'Specified "src" for "@vercel/next" has to be "package.json" or "next.config.js"',
      code: 'NEXT_INCORRECT_SRC',
    });
  }
}
exports.validateEntrypoint = validateEntrypoint;
/**
 * Exclude certain files from the files object
 */
function excludeFiles(files, matcher) {
  return Object.keys(files).reduce((newFiles, filePath) => {
    if (matcher(filePath)) {
      return newFiles;
    }
    return {
      ...newFiles,
      [filePath]: files[filePath],
    };
  }, {});
}
exports.excludeFiles = excludeFiles;
/**
 * Exclude package manager lockfiles from files
 */
function excludeLockFiles(files) {
  const newFiles = files;
  if (newFiles['package-lock.json']) {
    delete newFiles['package-lock.json'];
  }
  if (newFiles['yarn.lock']) {
    delete newFiles['yarn.lock'];
  }
  return files;
}
exports.excludeLockFiles = excludeLockFiles;
/**
 * Enforce specific package.json configuration for smallest possible lambda
 */
function normalizePackageJson(defaultPackageJson = {}) {
  const dependencies = {};
  const devDependencies = {
    ...defaultPackageJson.dependencies,
    ...defaultPackageJson.devDependencies,
  };
  if (devDependencies.react) {
    dependencies.react = devDependencies.react;
    delete devDependencies.react;
  }
  if (devDependencies['react-dom']) {
    dependencies['react-dom'] = devDependencies['react-dom'];
    delete devDependencies['react-dom'];
  }
  delete devDependencies['next-server'];
  return {
    ...defaultPackageJson,
    dependencies: {
      // react and react-dom can be overwritten
      react: 'latest',
      'react-dom': 'latest',
      ...dependencies,
      // next-server is forced to canary
      'next-server': 'v7.0.2-canary.49',
    },
    devDependencies: {
      ...devDependencies,
      // next is forced to canary
      next: 'v7.0.2-canary.49',
    },
    scripts: {
      ...defaultPackageJson.scripts,
      'now-build':
        'NODE_OPTIONS=--max_old_space_size=3000 next build --lambdas',
    },
  };
}
exports.normalizePackageJson = normalizePackageJson;
async function getNextConfig(workPath, entryPath) {
  const entryConfig = path_1.default.join(entryPath, './next.config.js');
  if (await fs_extra_1.default.pathExists(entryConfig)) {
    return fs_extra_1.default.readFile(entryConfig, 'utf8');
  }
  const workConfig = path_1.default.join(workPath, './next.config.js');
  if (await fs_extra_1.default.pathExists(workConfig)) {
    return fs_extra_1.default.readFile(workConfig, 'utf8');
  }
  return null;
}
exports.getNextConfig = getNextConfig;
function pathIsInside(firstPath, secondPath) {
  return !path_1.default.relative(firstPath, secondPath).startsWith('..');
}
function getPathsInside(entryDirectory, files) {
  const watch = [];
  for (const file of Object.keys(files)) {
    // If the file is outside of the entrypoint directory, we do
    // not want to monitor it for changes.
    if (!pathIsInside(entryDirectory, file)) {
      continue;
    }
    watch.push(file);
  }
  return watch;
}
exports.getPathsInside = getPathsInside;
function normalizePage(page) {
  // Resolve on anything that doesn't start with `/`
  if (!page.startsWith('/')) {
    page = `/${page}`;
  }
  // remove '/index' from the end
  page = page.replace(/\/index$/, '/');
  return page;
}
exports.normalizePage = normalizePage;
async function getRoutes(entryPath, entryDirectory, pathsInside, files, url) {
  let pagesDir = '';
  const filesInside = {};
  const prefix = entryDirectory === `.` ? `/` : `/${entryDirectory}/`;
  const fileKeys = Object.keys(files);
  for (const file of fileKeys) {
    if (!pathsInside.includes(file)) {
      continue;
    }
    if (!pagesDir) {
      if (file.startsWith(path_1.default.join(entryDirectory, 'pages'))) {
        pagesDir = 'pages';
      }
    }
    filesInside[file] = files[file];
  }
  // If default pages dir isn't found check for `src/pages`
  if (
    !pagesDir &&
    fileKeys.some(file =>
      file.startsWith(path_1.default.join(entryDirectory, 'src/pages'))
    )
  ) {
    pagesDir = 'src/pages';
  }
  const routes = [
    {
      src: `${prefix}_next/(.*)`,
      dest: `${url}/_next/$1`,
    },
    {
      src: `${prefix}static/(.*)`,
      dest: `${url}/static/$1`,
    },
  ];
  const filePaths = Object.keys(filesInside);
  const dynamicPages = [];
  for (const file of filePaths) {
    const relativePath = path_1.default.relative(entryDirectory, file);
    const isPage = pathIsInside(pagesDir, relativePath);
    if (!isPage) {
      continue;
    }
    const relativeToPages = path_1.default.relative(pagesDir, relativePath);
    const extension = path_1.default.extname(relativeToPages);
    const pageName = relativeToPages.replace(extension, '').replace(/\\/g, '/');
    if (pageName.startsWith('_')) {
      continue;
    }
    if (isDynamicRoute(pageName)) {
      dynamicPages.push(normalizePage(pageName));
      continue;
    }
    routes.push({
      src: `${prefix}${pageName}`,
      dest: `${url}/${pageName}`,
    });
    if (pageName.endsWith('index')) {
      const resolvedIndex = pageName.replace('/index', '').replace('index', '');
      routes.push({
        src: `${prefix}${resolvedIndex}`,
        dest: `${url}/${resolvedIndex}`,
      });
    }
  }
  routes.push(
    ...(await getDynamicRoutes(
      entryPath,
      entryDirectory,
      dynamicPages,
      true
    ).then(arr =>
      arr.map(route => {
        // convert to make entire RegExp match as one group
        route.src = route.src
          .replace('^', `^${prefix}(`)
          .replace('(\\/', '(')
          .replace('$', ')$');
        route.dest = `${url}/$1`;
        return route;
      })
    ))
  );
  // Add public folder routes
  for (const file of filePaths) {
    const relativePath = path_1.default.relative(entryDirectory, file);
    const isPublic = pathIsInside('public', relativePath);
    if (!isPublic) continue;
    const fileName = path_1.default.relative('public', relativePath);
    const route = {
      src: `${prefix}${fileName}`,
      dest: `${url}/${fileName}`,
    };
    // Only add the route if a page is not already using it
    if (!routes.some(r => r.src === route.src)) {
      routes.push(route);
    }
  }
  return routes;
}
exports.getRoutes = getRoutes;
async function getRoutesManifest(entryPath, outputDirectory, nextVersion) {
  const shouldHaveManifest =
    nextVersion && semver_1.default.gte(nextVersion, '9.1.4-canary.0');
  if (!shouldHaveManifest) return;
  const pathRoutesManifest = path_1.default.join(
    entryPath,
    outputDirectory,
    'routes-manifest.json'
  );
  const hasRoutesManifest = await fs_extra_1.default
    .access(pathRoutesManifest)
    .then(() => true)
    .catch(() => false);
  if (shouldHaveManifest && !hasRoutesManifest) {
    throw new NowBuildError({
      message:
        `A "routes-manifest.json" couldn't be found. This is normally caused by a misconfiguration in your project.\n` +
        'Please check the following, and reach out to support if you cannot resolve the problem:\n' +
        '  1. If present, be sure your `build` script in "package.json" calls `next build`.' +
        '  2. Navigate to your project\'s settings in the Vercel dashboard, and verify that the "Build Command" is not overridden, or that it calls `next build`.' +
        '  3. Navigate to your project\'s settings in the Vercel dashboard, and verify that the "Output Directory" is not overridden. Note that `next export` does **not** require you change this setting, even if you customize the `next export` output directory.',
      link: 'https://err.sh/vercel/vercel/now-next-routes-manifest',
      code: 'NEXT_NO_ROUTES_MANIFEST',
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const routesManifest = require(pathRoutesManifest);
  // remove temporary array based routeKeys from v1/v2 of routes
  // manifest since it can result in invalid routes
  for (const route of routesManifest.dataRoutes || []) {
    if (Array.isArray(route.routeKeys)) {
      delete route.routeKeys;
      delete route.namedDataRouteRegex;
    }
  }
  for (const route of routesManifest.dynamicRoutes || []) {
    if (Array.isArray(route.routeKeys)) {
      delete route.routeKeys;
      delete route.namedRegex;
    }
  }
  return routesManifest;
}
exports.getRoutesManifest = getRoutesManifest;
async function getDynamicRoutes(
  entryPath,
  entryDirectory,
  dynamicPages,
  isDev,
  routesManifest,
  omittedRoutes
) {
  if (!dynamicPages.length) {
    return [];
  }
  if (routesManifest) {
    switch (routesManifest.version) {
      case 1:
      case 2: {
        return routesManifest.dynamicRoutes
          .filter(({ page }) =>
            omittedRoutes ? !omittedRoutes.has(page) : true
          )
          .map(({ page, regex }) => {
            return {
              src: regex,
              dest: !isDev
                ? path_1.default.join('/', entryDirectory, page)
                : page,
              check: true,
            };
          });
      }
      case 3: {
        return routesManifest.dynamicRoutes
          .filter(({ page }) =>
            omittedRoutes ? !omittedRoutes.has(page) : true
          )
          .map(({ page, namedRegex, regex, routeKeys }) => {
            return {
              src: namedRegex || regex,
              dest: `${
                !isDev ? path_1.default.join('/', entryDirectory, page) : page
              }${
                routeKeys
                  ? `?${Object.keys(routeKeys)
                      .map(key => `${routeKeys[key]}=$${key}`)
                      .join('&')}`
                  : ''
              }`,
              check: true,
            };
          });
      }
      default: {
        // update MIN_ROUTES_MANIFEST_VERSION
        throw new NowBuildError({
          message:
            'This version of `@vercel/next` does not support the version of Next.js you are trying to deploy.\n' +
            'Please upgrade your `@vercel/next` builder and try again. Contact support if this continues to happen.',
          code: 'NEXT_VERSION_UPGRADE',
        });
      }
    }
  }
  // FALLBACK:
  // When `routes-manifest.json` does not exist (old Next.js versions), we'll try to
  // require the methods we need from Next.js' internals.
  let getRouteRegex = undefined;
  let getSortedRoutes;
  try {
    ({ getRouteRegex, getSortedRoutes } = require(resolve_from_1.default(
      entryPath,
      'next-server/dist/lib/router/utils'
    )));
    if (typeof getRouteRegex !== 'function') {
      getRouteRegex = undefined;
    }
  } catch (_) {} // eslint-disable-line no-empty
  if (!getRouteRegex || !getSortedRoutes) {
    try {
      ({ getRouteRegex, getSortedRoutes } = require(resolve_from_1.default(
        entryPath,
        'next/dist/next-server/lib/router/utils'
      )));
      if (typeof getRouteRegex !== 'function') {
        getRouteRegex = undefined;
      }
    } catch (_) {} // eslint-disable-line no-empty
  }
  if (!getRouteRegex || !getSortedRoutes) {
    throw new NowBuildError({
      message:
        'Found usage of dynamic routes but not on a new enough version of Next.js.',
      code: 'NEXT_DYNAMIC_ROUTES_OUTDATED',
    });
  }
  const pageMatchers = getSortedRoutes(dynamicPages).map(pageName => ({
    pageName,
    matcher: getRouteRegex && getRouteRegex(pageName).re,
  }));
  const routes = [];
  pageMatchers.forEach(pageMatcher => {
    // in `vercel dev` we don't need to prefix the destination
    const dest = !isDev
      ? path_1.default.join('/', entryDirectory, pageMatcher.pageName)
      : pageMatcher.pageName;
    if (pageMatcher && pageMatcher.matcher) {
      routes.push({
        src: pageMatcher.matcher.source,
        dest,
        check: !isDev,
      });
    }
  });
  return routes;
}
exports.getDynamicRoutes = getDynamicRoutes;
function syncEnvVars(base, removeEnv, addEnv) {
  // Remove any env vars from `removeEnv`
  // that are not present in the `addEnv`
  const addKeys = new Set(Object.keys(addEnv));
  for (const name of Object.keys(removeEnv)) {
    if (!addKeys.has(name)) {
      delete base[name];
    }
  }
  // Add in the keys from `addEnv`
  Object.assign(base, addEnv);
}
exports.syncEnvVars = syncEnvVars;
exports.ExperimentalTraceVersion = `9.0.4-canary.1`;
const compressBuffer = buf => {
  return new Promise((resolve, reject) => {
    zlib_1.default.deflateRaw(
      buf,
      { level: zlib_1.default.constants.Z_BEST_COMPRESSION },
      (err, compBuf) => {
        if (err) return reject(err);
        resolve(compBuf);
      }
    );
  });
};
async function createPseudoLayer(files) {
  const pseudoLayer = {};
  let pseudoLayerBytes = 0;
  for (const fileName of Object.keys(files)) {
    const file = files[fileName];
    if (isSymbolicLink(file.mode)) {
      const symlinkTarget = await fs_extra_1.default.readlink(file.fsPath);
      pseudoLayer[fileName] = {
        file,
        isSymlink: true,
        symlinkTarget,
      };
    } else {
      const origBuffer = await streamToBuffer(file.toStream());
      const compBuffer = await compressBuffer(origBuffer);
      pseudoLayerBytes += compBuffer.byteLength;
      pseudoLayer[fileName] = {
        compBuffer,
        isSymlink: false,
        crc32: buffer_crc32_1.default.unsigned(origBuffer),
        uncompressedSize: origBuffer.byteLength,
        mode: file.mode,
      };
    }
  }
  return { pseudoLayer, pseudoLayerBytes };
}
exports.createPseudoLayer = createPseudoLayer;
// measured with 1, 2, 5, 10, and `os.cpus().length || 5`
// and sema(1) produced the best results
const createLambdaSema = new async_sema_1.Sema(1);
async function createLambdaFromPseudoLayers({
  files,
  layers,
  handler,
  runtime,
  memory,
  maxDuration,
  environment = {},
}) {
  await createLambdaSema.acquire();
  const zipFile = new yazl_1.ZipFile();
  const addedFiles = new Set();
  const names = Object.keys(files).sort();
  const symlinkTargets = new Map();
  for (const name of names) {
    const file = files[name];
    if (file.mode && isSymbolicLink(file.mode) && file.type === 'FileFsRef') {
      const symlinkTarget = await fs_extra_1.default.readlink(file.fsPath);
      symlinkTargets.set(name, symlinkTarget);
    }
  }
  // apply pseudo layers (already compressed objects)
  for (const layer of layers) {
    for (const seedKey of Object.keys(layer)) {
      const item = layer[seedKey];
      if (item.isSymlink) {
        const { symlinkTarget, file } = item;
        zipFile.addBuffer(Buffer.from(symlinkTarget, 'utf8'), seedKey, {
          mode: file.mode,
        });
        continue;
      }
      const { compBuffer, crc32, uncompressedSize, mode } = item;
      // @ts-ignore: `addDeflatedBuffer` is a valid function, but missing on the type
      zipFile.addDeflatedBuffer(compBuffer, seedKey, {
        crc32,
        uncompressedSize,
        mode: mode,
      });
      addedFiles.add(seedKey);
    }
  }
  for (const fileName of Object.keys(files)) {
    // was already added in a pseudo layer
    if (addedFiles.has(fileName)) continue;
    const file = files[fileName];
    const symlinkTarget = symlinkTargets.get(fileName);
    if (typeof symlinkTarget === 'string') {
      zipFile.addBuffer(Buffer.from(symlinkTarget, 'utf8'), fileName, {
        mode: file.mode,
      });
    } else {
      const fileBuffer = await streamToBuffer(file.toStream());
      zipFile.addBuffer(fileBuffer, fileName);
    }
  }
  zipFile.end();
  const zipBuffer = await streamToBuffer(zipFile.outputStream);
  createLambdaSema.release();
  return new Lambda({
    handler,
    runtime,
    zipBuffer,
    memory,
    maxDuration,
    environment,
  });
}
exports.createLambdaFromPseudoLayers = createLambdaFromPseudoLayers;
async function getExportIntent(entryPath) {
  const pathExportMarker = path_1.default.join(
    entryPath,
    '.next',
    'export-marker.json'
  );
  const hasExportMarker = await fs_extra_1.default
    .access(pathExportMarker, fs_extra_1.default.constants.F_OK)
    .then(() => true)
    .catch(() => false);
  if (!hasExportMarker) {
    return false;
  }
  const manifest = JSON.parse(
    await fs_extra_1.default.readFile(pathExportMarker, 'utf8')
  );
  switch (manifest.version) {
    case 1: {
      if (manifest.hasExportPathMap !== true) {
        return false;
      }
      return { trailingSlash: manifest.exportTrailingSlash };
    }
    default: {
      return false;
    }
  }
}
exports.getExportIntent = getExportIntent;
async function getExportStatus(entryPath) {
  const pathExportDetail = path_1.default.join(
    entryPath,
    '.next',
    'export-detail.json'
  );
  const hasExportDetail = await fs_extra_1.default
    .access(pathExportDetail, fs_extra_1.default.constants.F_OK)
    .then(() => true)
    .catch(() => false);
  if (!hasExportDetail) {
    return false;
  }
  const manifest = JSON.parse(
    await fs_extra_1.default.readFile(pathExportDetail, 'utf8')
  );
  switch (manifest.version) {
    case 1: {
      return {
        success: !!manifest.success,
        outDirectory: manifest.outDirectory,
      };
    }
    default: {
      return false;
    }
  }
}
exports.getExportStatus = getExportStatus;
async function getPrerenderManifest(entryPath) {
  const pathPrerenderManifest = path_1.default.join(
    entryPath,
    '.next',
    'prerender-manifest.json'
  );
  const hasManifest = await fs_extra_1.default
    .access(pathPrerenderManifest, fs_extra_1.default.constants.F_OK)
    .then(() => true)
    .catch(() => false);
  if (!hasManifest) {
    return {
      staticRoutes: {},
      legacyBlockingRoutes: {},
      fallbackRoutes: {},
      bypassToken: null,
      omittedRoutes: [],
    };
  }
  const manifest = JSON.parse(
    await fs_extra_1.default.readFile(pathPrerenderManifest, 'utf8')
  );
  switch (manifest.version) {
    case 1: {
      const routes = Object.keys(manifest.routes);
      const lazyRoutes = Object.keys(manifest.dynamicRoutes);
      const ret = {
        staticRoutes: {},
        legacyBlockingRoutes: {},
        fallbackRoutes: {},
        bypassToken:
          (manifest.preview && manifest.preview.previewModeId) || null,
        omittedRoutes: [],
      };
      routes.forEach(route => {
        const {
          initialRevalidateSeconds,
          dataRoute,
          srcRoute,
        } = manifest.routes[route];
        ret.staticRoutes[route] = {
          initialRevalidate:
            initialRevalidateSeconds === false
              ? false
              : Math.max(1, initialRevalidateSeconds),
          dataRoute,
          srcRoute,
        };
      });
      lazyRoutes.forEach(lazyRoute => {
        const {
          routeRegex,
          fallback,
          dataRoute,
          dataRouteRegex,
        } = manifest.dynamicRoutes[lazyRoute];
        if (fallback) {
          ret.fallbackRoutes[lazyRoute] = {
            routeRegex,
            fallback,
            dataRoute,
            dataRouteRegex,
          };
        } else {
          ret.legacyBlockingRoutes[lazyRoute] = {
            routeRegex,
            dataRoute,
            dataRouteRegex,
          };
        }
      });
      return ret;
    }
    case 2: {
      const routes = Object.keys(manifest.routes);
      const lazyRoutes = Object.keys(manifest.dynamicRoutes);
      const ret = {
        staticRoutes: {},
        legacyBlockingRoutes: {},
        fallbackRoutes: {},
        bypassToken: manifest.preview.previewModeId,
        omittedRoutes: [],
      };
      routes.forEach(route => {
        const {
          initialRevalidateSeconds,
          dataRoute,
          srcRoute,
        } = manifest.routes[route];
        ret.staticRoutes[route] = {
          initialRevalidate:
            initialRevalidateSeconds === false
              ? false
              : Math.max(1, initialRevalidateSeconds),
          dataRoute,
          srcRoute,
        };
      });
      lazyRoutes.forEach(lazyRoute => {
        const {
          routeRegex,
          fallback,
          dataRoute,
          dataRouteRegex,
        } = manifest.dynamicRoutes[lazyRoute];
        if (!fallback) {
          // Fallback behavior is disabled, all routes would've been provided
          // in the top-level `routes` key (`staticRoutes`).
          ret.omittedRoutes.push(lazyRoute);
          return;
        }
        ret.fallbackRoutes[lazyRoute] = {
          routeRegex,
          fallback,
          dataRoute,
          dataRouteRegex,
        };
      });
      return ret;
    }
    default: {
      return {
        staticRoutes: {},
        legacyBlockingRoutes: {},
        fallbackRoutes: {},
        bypassToken: null,
        omittedRoutes: [],
      };
    }
  }
}
exports.getPrerenderManifest = getPrerenderManifest;
// We only need this once per build
let _usesSrcCache;
async function usesSrcDirectory(workPath) {
  if (!_usesSrcCache) {
    const source = path_1.default.join(workPath, 'src', 'pages');
    try {
      if ((await fs_extra_1.default.stat(source)).isDirectory()) {
        _usesSrcCache = true;
      }
    } catch (_err) {
      _usesSrcCache = false;
    }
  }
  return Boolean(_usesSrcCache);
}
async function getSourceFilePathFromPage({ workPath, page }) {
  if (await usesSrcDirectory(workPath)) {
    return path_1.default.join('src', 'pages', page);
  }
  return path_1.default.join('pages', page);
}
exports.getSourceFilePathFromPage = getSourceFilePathFromPage;
