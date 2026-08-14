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
  }

  /**
   * Configure git with GitHub credentials
   */
  configureGit(): void {
    try {
      // Configure git user
      execSyncImport('git config user.name "AI Agent"', { stdio: 'inherit' });
      execSyncImport('git config user.email "ai-agent@automated"', { stdio: 'inherit' });
      
      // Setup git credentials for GitHub
      const repoUrl = `https://${this.config.token}@github.com/${this.config.username}/${this.config.repo}.git`;
      execSyncImport(`git remote set-url origin ${repoUrl}`, { stdio: 'inherit' });
      
      console.log('✅ Git configured successfully');
    } catch (error) {
      console.error('❌ Git configuration failed:', error);
      throw error;
    }
  }

  /**
   * Add files to git staging area
   */
  async gitAdd(files: string[] = ['src/']): Promise<boolean> {
    try {
      for (const file of files) {
        if (fs.existsSync(path.join(process.cwd(), file))) {
          execSyncImport(`git add ${file}`, { stdio: 'inherit' });
          console.log(`✅ Added ${file} to git`);
        }
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