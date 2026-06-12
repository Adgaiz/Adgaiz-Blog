import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_OWNER || 'Adgaiz';
const repo = process.env.GITHUB_REPO || 'Adgaiz-Blog';

export async function getFileContent(path: string) {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if ('content' in data && 'sha' in data) {
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      return { content, sha: data.sha };
    }
    throw new Error('Not a file');
  } catch (error) {
    if ((error as any).status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveFileContent(path: string, content: string, message: string, sha?: string) {
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    sha, // If updating an existing file, the blob SHA is required
  });
  return data;
}

export async function deleteFile(path: string, message: string, sha: string) {
  const { data } = await octokit.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha,
  });
  return data;
}

export async function uploadImage(path: string, base64Content: string, message: string) {
  // base64Content comes from FileReader, usually formatted like: data:image/png;base64,iVBORw0KGgo...
  // We need to strip the prefix before sending to GitHub
  const base64Data = base64Content.replace(/^data:image\/\w+;base64,/, '');

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: base64Data,
  });
  return data;
}
