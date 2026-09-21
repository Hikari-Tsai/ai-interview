import site from '../config/site.json';

// Project links are distinct from the upstream question source on every card.
const repository = process.env.PROJECT_REPO_URL || site.repositoryUrl ||
  (process.env.GITHUB_REPOSITORY ? `https://github.com/${process.env.GITHUB_REPOSITORY}` : '');

function resolveRepository(value: string): string | undefined {
  if (!value) return undefined;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' ||
      url.username || url.password || url.port ||
      !/^\/[\w.-]+\/[\w.-]+\/?$/.test(url.pathname)) {
    throw new Error('PROJECT_REPO_URL must be an HTTPS GitHub repository URL.');
  }
  url.pathname = url.pathname.replace(/\/$/, '').replace(/\.git$/, '');
  url.search = '';
  url.hash = '';
  return url.href;
}

export const projectRepoUrl = resolveRepository(repository);
