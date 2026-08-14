/**
 * Push all batch-generated videos to GitHub
 * To be run after batch-create-tech-videos.ts completes
 */

import 'dotenv/config';
import { GitOperations } from './src/agent/git-operations';

async function pushToGitHub() {
  console.log('🚀 Pushing all batch-generated videos to GitHub...');
  console.log('=' .repeat(50));

  // Check GitHub credentials
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_USERNAME || !process.env.GITHUB_REPO) {
    console.error('❌ GitHub credentials not found in environment variables');
    console.log('Please set GITHUB_TOKEN, GITHUB_USERNAME, and GITHUB_REPO in .env file');
    process.exit(1);
  }

  const gitOps = new GitOperations({
    token: process.env.GITHUB_TOKEN,
    username: process.env.GITHUB_USERNAME,
    repo: process.env.GITHUB_REPO
  });

  try {
    // Configure git
    console.log('🔧 Configuring git...');
    gitOps.configureGit();

    // Push to GitHub
    console.log('📤 Pushing to GitHub...');
    const pushSuccess = await gitOps.gitPush('main');

    if (pushSuccess) {
      console.log('✅ Successfully pushed all videos to GitHub!');
      console.log('🎉 Ready for rendering pipeline');
    } else {
      console.log('❌ Git push failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Push failed:', error);
    process.exit(1);
  }
}

pushToGitHub();