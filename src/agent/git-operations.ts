/**
 * Git Operations Utility for AI Agent
 * Handles automated git commit and push operations
 */

import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync: execSyncImport } = require('child_process');

export interface GitConfig {
  token: string;
  username: string;
  repo: string;
}

export class GitOperations {
  private config: GitConfig;

  constructor(config: GitConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate GitHub configuration
   */
  private validateConfig(): void {
    if (!this.config.token || this.config.token.trim() === '') {
      throw new Error('GitHub token is missing or empty. Please set GITHUB_TOKEN in your .env file.');
    }
    if (!this.config.username || this.config.username.trim() === '') {
      throw new Error('GitHub username is missing. Please set GITHUB_USERNAME in your .env file.');
    }
    if (!this.config.repo || this.config.repo.trim() === '') {
      throw new Error('GitHub repository name is missing. Please set GITHUB_REPO in your .env file.');
    }
    
    // Validate token format (GitHub tokens typically start with specific prefixes)
    if (!this.config.token.startsWith('ghp_') && !this.config.token.startsWith('github_pat_')) {
      console.warn('⚠️  GitHub token format might be invalid. Tokens should start with "ghp_" or "github_pat_"');
    }
  }

  /**
   * Configure git with GitHub credentials (with fallback for auth failures)
   */
  configureGit(): void {
    try {
      // Configure git user
      execSyncImport('git config user.name "AI Agent"', { stdio: 'pipe' });
      execSyncImport('git config user.email "ai-agent@automated"', { stdio: 'pipe' });
      
      // Setup git credentials for GitHub with proper URL encoding
      const encodedToken = encodeURIComponent(this.config.token);
      const repoUrl = `https://${encodedToken}@github.com/${this.config.username}/${this.config.repo}.git`;
      
      try {
        execSyncImport(`git remote set-url origin ${repoUrl}`, { stdio: 'pipe' });
      } catch (remoteError) {
        // If remote doesn't exist, add it
        console.log('ℹ️  Git remote origin not found, adding...');
        try {
          execSyncImport(`git remote add origin ${repoUrl}`, { stdio: 'pipe' });
        } catch (addError) {
          console.warn('⚠️  Could not add git remote:', addError);
          // Continue anyway - local operations should still work
        }
      }
      
      // Test the connection (but don't fail if it doesn't work)
      try {
        execSyncImport('git ls-remote origin', { stdio: 'pipe', timeout: 10000 });
        console.log('✅ Git configured and connection tested successfully');
      } catch (testError) {
        console.warn('⚠️  Git connection test failed (likely authentication issue)');
        console.warn('💡 Local git operations will still work, but push to GitHub will require manual action');
        // Don't throw - allow local operations to continue
      }
    } catch (error) {
      console.warn('⚠️  Git configuration encountered issues:', error);
      console.warn('💡 Continuing with local git operations only');
      // Don't throw - allow the process to continue
    }
  }

  /**
   * Add files to git staging area
   */
  async gitAdd(files: string[] = ['-A']): Promise<boolean> {
    try {
      for (const file of files) {
        execSyncImport(`git add ${file}`, { stdio: 'inherit' });
        console.log(`✅ Added ${file} to git staging area`);
      }
      return true;
    } catch (error) {
      console.error('❌ Git add failed:', error);
      return false;
    }
  }

  /**
   * Commit changes with AI-generated message
   */
  async gitCommit(message: string): Promise<boolean> {
    try {
      // Check if there are changes to commit
      const status = execSyncImport('git status --porcelain', { encoding: 'utf-8' });
      if (!status.trim()) {
        console.log('⚠️  No changes to commit');
        return false;
      }

      execSyncImport(`git commit -m "${message}"`, { stdio: 'inherit' });
      console.log('✅ Git commit successful');
      return true;
    } catch (error) {
      console.error('❌ Git commit failed:', error);
      return false;
    }
  }

  /**
   * Push changes to GitHub
   */
  async gitPush(branch: string = 'main'): Promise<boolean> {
    try {
      execSyncImport(`git push origin ${branch}`, { stdio: 'inherit' });
      console.log('✅ Git push successful');
      return true;
    } catch (error) {
      console.error('❌ Git push failed:', error);
      return false;
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName: string): Promise<boolean> {
    try {
      execSyncImport(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      console.log(`✅ Created and switched to branch: ${branchName}`);
      return true;
    } catch (error) {
      console.error('❌ Branch creation failed:', error);
      return false;
    }
  }

  /**
   * Get current git status
   */
  async getGitStatus(): Promise<string> {
    try {
      return execSyncImport('git status --porcelain', { encoding: 'utf-8' });
    } catch (error) {
      console.error('❌ Git status failed:', error);
      return '';
    }
  }

  /**
   * Complete workflow: add, commit, and push
   */
  async completeWorkflow(commitMessage: string, branch: string = 'main'): Promise<boolean> {
    try {
      await this.gitAdd();
      const committed = await this.gitCommit(commitMessage);
      if (committed) {
        return await this.gitPush(branch);
      }
      return false;
    } catch (error) {
      console.error('❌ Git workflow failed:', error);
      return false;
    }
  }
}