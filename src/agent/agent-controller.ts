/**
 * AI Agent Controller untuk Remotion Video Creation
 * Menggunakan Bluesmind API sebagai decision maker dan code generator
 */

import { bluesmindChatCompletion } from '../lib/bluesmind';
import { GitOperations } from './git-operations';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentTask {
  id: string;
  type: 'plan' | 'generate' | 'refine' | 'git_commit';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface VideoProject {
  name: string;
  concept: string;
  duration: number;
  style: string;
  components: string[];
}

export class AIAgentController {
  private tasks: AgentTask[] = [];
  private projectContext: VideoProject | null = null;
  private gitOps: GitOperations | null = null;

  constructor() {
    // Initialize Git operations if credentials are available
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_USERNAME && process.env.GITHUB_REPO) {
      this.gitOps = new GitOperations({
        token: process.env.GITHUB_TOKEN,
        username: process.env.GITHUB_USERNAME,
        repo: process.env.GITHUB_REPO
      });
    }
  }

  /**
   * Main orchestration method - AI agent yang membuat video Remotion secara mandiri
   */
  async createRemotionVideo(prompt: string): Promise<{ success: boolean; message: string }> {
    console.log('🤖 AI Agent started: Creating Remotion video...');
    console.log('📝 User prompt:', prompt);

    try {
      // Step 1: Plan the video concept
      const planResult = await this.planVideoConcept(prompt);
      if (!planResult.success) {
        return { success: false, message: `Planning failed: ${planResult.error}` };
      }

      // Step 2: Generate Remotion components
      const componentsResult = await this.generateRemotionComponents();
      if (!componentsResult.success) {
        return { success: false, message: `Component generation failed: ${componentsResult.error}` };
      }

      // Step 3: Update project configuration
      const configResult = await this.updateProjectConfig();
      if (!configResult.success) {
        return { success: false, message: `Config update failed: ${configResult.error}` };
      }

      // Step 4: Git operations
      const gitResult = await this.performGitOperations();
      if (!gitResult.success) {
        return { success: false, message: `Git operations failed: ${gitResult.error}` };
      }

      return { 
        success: true, 
        message: '🎉 AI Agent successfully created Remotion video and pushed to GitHub!' 
      };

    } catch (error) {
      return { 
        success: false, 
        message: `Agent error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Step 1: Plan video concept using AI
   */
  private async planVideoConcept(prompt: string): Promise<{ success: boolean; error?: string }> {
    console.log('🧠 Step 1: Planning video concept...');
    
    const systemPrompt = `You are an expert Remotion video developer. Plan a video project based on the user's prompt.
    Return ONLY a valid JSON response (no markdown, no explanations):
    {
      "name": "project_name",
      "concept": "brief description",
      "duration": 30,
      "style": "minimalist, kinetic typography, 3D, etc",
      "components": ["Component1", "Component2"],
      "technical_notes": "implementation details"
    }`;

    const result = await bluesmindChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      maxRetries: 3
    });

    if (result.success && result.data?.choices?.[0]) {
      try {
        const content = result.data.choices[0].message.content;
        console.log('📝 AI Response:', content);
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const cleanJson = jsonMatch[0].replace(/```json\n?|```/g, '').trim();
          this.projectContext = JSON.parse(cleanJson);
          console.log('✅ Video concept planned:', this.projectContext);
          return { success: true };
        } else {
          return { success: false, error: 'No JSON found in AI response' };
        }
      } catch (e) {
        return { success: false, error: `Failed to parse AI response: ${e instanceof Error ? e.message : 'Unknown error'}` };
      }
    }

    return { success: false, error: result.error };
  }

  /**
   * Step 2: Generate Remotion components using AI
   */
  private async generateRemotionComponents(): Promise<{ success: boolean; error?: string }> {
    console.log('⚙️ Step 2: Generating Remotion components...');
    
    if (!this.projectContext) {
      return { success: false, error: 'No project context available' };
    }

    for (const componentName of this.projectContext.components) {
      console.log(`📝 Generating component: ${componentName}...`);
      
      const componentCode = await this.generateComponentCode(componentName);
      
      if (!componentCode) {
        console.warn(`⚠️  AI generation failed for ${componentName}, using fallback template`);
        const fallbackCode = this.getFallbackComponent(componentName);
        
        // Write fallback component file
        const filePath = path.join(process.cwd(), 'src', `${componentName}.tsx`);
        fs.writeFileSync(filePath, fallbackCode);
        console.log(`✅ Generated (fallback): ${componentName}.tsx`);
      } else {
        // Write AI-generated component file
        const filePath = path.join(process.cwd(), 'src', `${componentName}.tsx`);
        fs.writeFileSync(filePath, componentCode);
        console.log(`✅ Generated (AI): ${componentName}.tsx`);
      }
    }

    return { success: true };
  }

  /**
   * Fallback component template when AI generation fails
   */
  private getFallbackComponent(componentName: string): string {
    return `import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Fallback component: ${componentName}
 * Auto-generated by AI Agent when AI generation fails
 */
export const ${componentName}: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const opacity = Math.min(1, frame / 30);
  const scale = 1 + Math.sin(frame / 20) * 0.1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 64,
        fontWeight: 'bold',
        color: 'white',
        opacity,
        transform: \`scale(\${scale})\`,
        backgroundColor: '#1a1a2e',
        width: '100%',
        height: '100%',
      }}
    >
      ${this.projectContext?.concept || 'AI Generated Video'}
    </div>
  );
};`;
  }

  /**
   * Generate individual component code using AI
   */
  private async generateComponentCode(componentName: string): Promise<string | null> {
    const systemPrompt = `You are a Remotion expert. Generate a complete, working React component for Remotion.
    The component should:
    - Use Remotion hooks (useCurrentFrame, useVideoConfig, etc)
    - Be properly typed with TypeScript
    - Include proper imports
    - Be visually appealing and animated
    - Follow the project style: ${this.projectContext?.style}
    
    Return ONLY the code, no explanations.`;

    const result = await bluesmindChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Create a Remotion component called "${componentName}" for a ${this.projectContext?.concept} video. Duration: ${this.projectContext?.duration} seconds.` 
        }
      ],
      temperature: 0.8,
      maxRetries: 3
    });

    if (result.success && result.data?.choices?.[0]) {
      return result.data.choices[0].message.content;
    }

    return null;
  }

  /**
   * Step 3: Update project configuration
   */
  private async updateProjectConfig(): Promise<{ success: boolean; error?: string }> {
    console.log('🔧 Step 3: Updating project configuration...');
    
    if (!this.projectContext) {
      return { success: false, error: 'No project context available' };
    }

    try {
      // Create or update Root.tsx to include new components
      const rootPath = path.join(process.cwd(), 'src', 'Root.tsx');
      
      if (fs.existsSync(rootPath)) {
        const rootContent = fs.readFileSync(rootPath, 'utf-8');
        // Add new composition to Root.tsx
        const newComposition = this.generateCompositionCode(this.projectContext);
        const updatedRoot = rootContent.replace(
          /(export const Root: React\.FC = () => \{[\s\S]*?return \()/,
          `$1${newComposition}\n  `
        );
        fs.writeFileSync(rootPath, updatedRoot);
        console.log('✅ Updated Root.tsx');
      } else {
        // Create new Root.tsx if it doesn't exist
        const newRootContent = this.generateRootFile(this.projectContext);
        fs.writeFileSync(rootPath, newRootContent);
        console.log('✅ Created Root.tsx');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to update config: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Generate Root.tsx file content
   */
  private generateRootFile(project: VideoProject): string {
    return `import React from 'react';
import { Composition } from 'remotion';
${project.components.map(comp => `import { ${comp} } from './${comp}';`).join('\n')}

export const Root: React.FC = () => {
  return (
    <>
      ${this.generateCompositionCode(project)}
    </>
  );
};`;
  }

  /**
   * Generate composition code for Root.tsx
   */
  private generateCompositionCode(project: VideoProject): string {
    const mainComponent = project.components[0] || 'DefaultComponent';
    return `<Composition
      id="${project.name.replace(/\s+/g, '')}"
      component={${mainComponent}}
      durationInFrames={${project.duration * 30}}
      fps={30}
      width={1920}
      height={1080}
    />`;
  }

  /**
   * Step 4: Perform Git operations
   */
  private async performGitOperations(): Promise<{ success: boolean; error?: string }> {
    console.log('📦 Step 4: Performing Git operations...');
    
    if (!this.gitOps) {
      console.warn('⚠️  Git operations skipped - no GitHub credentials configured');
      return { success: true }; // Continue without git operations
    }

    try {
      // Configure git
      this.gitOps.configureGit();
      
      // Generate commit message using AI
      const commitMessage = await this.generateCommitMessage();
      
      // Complete git workflow
      const gitSuccess = await this.gitOps.completeWorkflow(commitMessage);
      
      if (gitSuccess) {
        console.log('✅ Git operations completed successfully');
        return { success: true };
      } else {
        return { success: false, error: 'Git workflow failed' };
      }
    } catch (error) {
      return { success: false, error: 'Git operations failed' };
    }
  }

  /**
   * Generate commit message using AI
   */
  private async generateCommitMessage(): Promise<string> {
    const result = await bluesmindChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'Generate a concise git commit message following conventional commits format. Return ONLY the message, no explanations.'
        },
        {
          role: 'user',
          content: `Generate commit message for: ${this.projectContext?.concept} video project with components: ${this.projectContext?.components.join(', ')}`
        }
      ],
      maxRetries: 2,
      max_tokens: 100
    });

    if (result.success && result.data?.choices?.[0]) {
      return result.data.choices[0].message.content.trim();
    }

    return `feat: add AI-generated ${this.projectContext?.name || 'Remotion'} video components`;
  }

  /**
   * Get agent status and progress
   */
  getAgentStatus(): AgentTask[] {
    return this.tasks;
  }
}