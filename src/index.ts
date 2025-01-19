import * as core from "@actions/core";
import * as os from "node:os";
import { Octokit } from "@octokit/rest";
import * as path from "node:path";
import * as toolcache from "@actions/tool-cache";
import * as cache from "@actions/cache";

export async function run() {
  try {
    const token = process.env["GITHUB_TOKEN"] || core.getInput("token");
    const octokit = new Octokit({
      auth: token,
    });

    const version = core.getInput("version");
    if (!validateVersion(version)) {
      core.setFailed("Invalid version format. Please use 'latest' or 'X.X.X'.");
      return;
    }

    const osPlatform = os.platform();
    core.info(`OS Platform: ${osPlatform}`);

    const osArch = os.arch();
    core.info(`OS Arch: ${osArch}`);

    core.info(`Version: ${version}`);
    let versionTag = makeTag(version);

    let release;
    if (version === "latest") {
      release = await octokit.rest.repos.getLatestRelease({
        owner: "clover0",
        repo: "issue-agent",
      });
      versionTag = release.data.tag_name;
      core.info(`Latest version: ${versionTag}`);
    } else {
      release = await octokit.rest.repos.getReleaseByTag({
        owner: "clover0",
        repo: "issue-agent",
        tag: versionTag,
      });
    }
    console.info(release.data);

    const tool: Tool = {
      name: "issue-agent",
      owner: "clover0",
      version,
      versionTag,
      osPlatform,
      osArch,
    };

    const cacheKey = getCacheKey(tool);
    const cachedPath = await cache.restoreCache([toolPath(tool)], cacheKey);
    if (!!cachedPath) {
      core.info(`Restored from cache: ${cachedPath}`);
      core.addPath(cachedPath);
      return;
    }

    const assetName = makeAssetName(tool);

    const asset = release.data.assets.find((asset) => asset.name === assetName);
    if (!asset) {
      core.setFailed(`No asset found for ${assetName}`);
      return;
    }

    const downloadUrl = asset.browser_download_url;

    const outputPath = path.join(os.tmpdir(), tool.name, versionTag, assetName);

    const downloadedPath = await toolcache.downloadTool(
      downloadUrl,
      outputPath,
      `token ${token}`,
      {
        accept: "application/octet-stream",
      },
    );
    core.info(`Downloaded to: ${downloadedPath}`);

    const toolBinPath = toolPath(tool);
    const extractedPath = await toolcache.extractTar(
      downloadedPath,
      toolBinPath,
    );
    core.info(`Extracted to: ${extractedPath}`);

    try {
      await cache.saveCache([toolBinPath], cacheKey);
    } catch (error) {
      const e = error as Error;
      core.warning(e.message);
    }

    const cachedDir = await toolcache.cacheDir(
      extractedPath,
      tool.name,
      version,
    );
    core.addPath(cachedDir);
  } catch (error) {
    const e = error as Error;
    core.error(e.cause as string);
    core.setFailed(e.message);
  }
}

interface Tool {
  name: string;
  owner: string;
  version: string; // 0.1.0
  versionTag: string; // v0.1.0
  osPlatform: string;
  osArch: string;
}

function validateVersion(version: string) {
  if (version === "latest") {
    return true;
  }

  const regex = /^\d+\.\d+\.\d+$/;
  return regex.test(version);
}

function makeTag(version: string) {
  return `v${version}`;
}

function makeAssetName(tool: Tool) {
  return `issue-agent_${tool.osPlatform}_${tool.osArch}.tar.gz`;
}

function toolPath(tool: Tool): string {
  return path.join(
    getCacheDir(),
    tool.owner,
    tool.name,
    tool.version,
    `${tool.osPlatform}-${tool.osArch}`,
  );
}

function getCacheDir() {
  const cacheDir = process.env["RUNNER_TOOL_CACHE"] || "";
  if (cacheDir === "") {
    return os.tmpdir();
  }
  return cacheDir;
}

function getCacheKey(tool: Tool) {
  return `${tool.name}-${tool.versionTag}-${tool.osPlatform}-${tool.osArch}`;
}

run();
