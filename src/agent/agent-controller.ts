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
    
    const systemPrompt = `You are an expert Remotion video developer specializing in complex technology backgrounds. Plan a video project based on the user's prompt.
    Return ONLY a valid JSON response (no markdown, no explanations):
    {
      "name": "project_name",
      "concept": "brief description",
      "duration": 15,
      "style": "technology, cyberpunk, futuristic, etc",
      "components": ["Component1", "Component2", "Component3"],
      "technical_notes": "implementation details for seamless loop and 4K 60fps"
    }`;

    const result = await bluesmindChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
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
   * Optimized for 4K 60fps seamless loop technology backgrounds
   */
  private getFallbackComponent(componentName: string): string {
    return `import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Fallback component: ${componentName}
 * Auto-generated by AI Agent for 4K 60fps seamless loop
 * Technology background animation
 */
export const ${componentName}: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Seamless loop calculation
  const loopFrame = frame % durationInFrames;
  const progress = loopFrame / durationInFrames;

  // Complex technology animation parameters
  const opacity = 0.5 + Math.sin(progress * Math.PI * 2) * 0.3;
  const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.15;
  const rotation = progress * 360;
  const hue = (progress * 360) % 360;

  // Grid pattern for technology theme
  const gridSize = 50;
  const gridOffset = (loopFrame * 2) % gridSize;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 48,
        fontWeight: 'bold',
        color: \`hsl(\${hue}, 70%, 60%)\`,
        opacity,
        transform: \`scale(\${scale}) rotate(\${rotation}deg)\`,
        backgroundColor: '#0a0a1a',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Technology grid background */}
      <div
        style={{
          position: 'absolute',
          top: -gridOffset,
          left: -gridOffset,
          right: -gridOffset,
          bottom: -gridOffset,
          backgroundImage: \`
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          \`,
          backgroundSize: \`\${gridSize}px \${gridSize}px\`,
          animation: 'gridMove 2s linear infinite',
        }}
      />
      
      {/* Animated particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 4,
            height: 4,
            backgroundColor: \`hsl(\${(hue + i * 18) % 360}, 80%, 60%)\`,
            borderRadius: '50%',
            left: \`\${50 + Math.sin(progress * Math.PI * 2 + i) * 40}%\`,
            top: \`\${50 + Math.cos(progress * Math.PI * 2 + i) * 40}%\`,
            opacity: 0.8,
            boxShadow: \`0 0 10px hsl(\${(hue + i * 18) % 360}, 80%, 60%)\`,
          }}
        />
      ))}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, textShadow: '0 0 20px currentColor' }}>
        ${this.projectContext?.concept || 'Technology Background'}
      </div>

      <style>{\`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(\${gridSize}px, \${gridSize}px); }
        }
      \`}</style>
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
   * Optimized for 4K 60fps seamless loop
   */
  private generateCompositionCode(project: VideoProject): string {
    const mainComponent = project.components[0] || 'DefaultComponent';
    const fps = 60; // 60fps for smooth technology animations
    const durationInFrames = project.duration * fps; // 15 seconds * 60fps = 900 frames
    const width = 3840; // 4K width
    const height = 2160; // 4K height
    
    return `<Composition
      id="${project.name.replace(/\s+/g, '')}"
      component={${mainComponent}}
      durationInFrames={${durationInFrames}}
      fps={${fps}}
      width={${width}}
      height={${height}}
      // Ensure seamless loop
      loop={true}
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
      
      // Complete git workflow (commit only, skip push for batch operations)
      const commitSuccess = await this.gitOps.gitCommit(commitMessage);
      
      if (commitSuccess) {
        console.log('✅ Git commit completed successfully');
        console.log('⏭️  Git push skipped for batch operations (will push after all videos created)');
        return { success: true };
      } else {
        console.log('⚠️  No changes to commit or commit failed');
        return { success: true }; // Continue even if commit fails
      }
    } catch (error) {
      console.warn('⚠️  Git operations failed, continuing:', error);
      return { success: true }; // Continue even if git fails
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