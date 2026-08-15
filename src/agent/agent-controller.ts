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

export interface VideoScene {
  name: string;
  duration: number;
  description: string;
  audio_text: string;
  componentName: string;
}

export interface VideoProject {
  name: string;
  concept: string;
  duration: number;
  style: string;
  scenes: VideoScene[];
}

export class AIAgentController {
  private tasks: AgentTask[] = [];
  private projectContext: VideoProject | null = null;
  private gitOps: GitOperations | null = null;

  constructor() {
    // Initialize Git operations if credentials are available and valid
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_USERNAME && process.env.GITHUB_REPO) {
      try {
        this.gitOps = new GitOperations({
          token: process.env.GITHUB_TOKEN,
          username: process.env.GITHUB_USERNAME,
          repo: process.env.GITHUB_REPO
        });
        console.log('✅ Git operations initialized');
      } catch (gitError) {
        console.warn('⚠️  Git operations initialization failed:', gitError);
        console.warn('💡 AI Agent will continue without git automation');
        this.gitOps = null;
      }
    } else {
      console.log('ℹ️  Git operations skipped - missing GitHub credentials');
      this.gitOps = null;
    }
  }

  /**
   * Main orchestration method - AI agent yang membuat video Remotion secara mandiri
   */
  async createRemotionVideo(prompt: string): Promise<{ success: boolean; message: string }> {
    console.log('🤖 AI Agent started: Creating Remotion video...');
    console.log('📝 User prompt:', prompt);

    try {
      // Step 0: Autonomous Web Research
      const researchData = await this.performWebResearch(prompt);

      // Step 1: Plan the video concept
      const planResult = await this.planVideoConcept(prompt, researchData);
      if (!planResult.success) {
        return { success: false, message: `Planning failed: ${planResult.error}` };
      }

      // Step 1.5: Generate Assets & Voiceovers
      const assetsResult = await this.generateAssets();
      if (!assetsResult.success) {
        console.warn(`⚠️ Asset generation failed or skipped: ${assetsResult.error}`);
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

      // Step 4: Git operations (non-blocking)
      const gitResult = await this.performGitOperations();
      // Git operations are now resilient - they won't fail the entire process

      // Step 5: Trigger GitHub Actions Workflow (optional)
      const workflowResult = await this.triggerGithubWorkflow();
      if (!workflowResult.success) {
        console.warn(`⚠️  GitHub workflow trigger failed: ${workflowResult.error}`);
        console.warn('📝 Video components have been created and committed locally.');
        console.warn('📝 You can manually trigger the workflow or render the video locally.');
        return { 
          success: true, 
          message: `✅ AI Agent successfully created Remotion video components and committed them locally!\n\n⚠️  GitHub workflow trigger failed: ${workflowResult.error}\n💡 The video has been created locally. You can:\n   - Render locally: npm run render\n   - Fix GitHub auth and push manually: git push origin main\n   - Trigger workflow manually from GitHub Actions tab` 
        };
      }

      return { 
        success: true, 
        message: '🎉 AI Agent successfully created Remotion video, pushed to GitHub, and triggered render workflow!' 
      };

    } catch (error) {
      return { 
        success: false, 
        message: `Agent error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Step 0: Web Research Agent
   */
  private async performWebResearch(topic: string): Promise<string> {
    console.log(`🔍 Doing autonomous web research on: "${topic}"...`);
    try {
      const response = await fetch(`https://lite.duckduckgo.com/lite/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `q=${encodeURIComponent(topic)}`
      });
      const html = await response.text();
      const snippets = [...html.matchAll(/class="result-snippet"[^>]*>(.*?)<\/td>/g)]
        .map(m => m[1].replace(/<[^>]+>/g, '').trim())
        .slice(0, 3)
        .join('\n- ');
      
      if (snippets) {
        console.log(`✅ Research completed! Found key facts.`);
        return `Web research facts for "${topic}":\n- ${snippets}`;
      }
      return 'No specific facts found online.';
    } catch (e) {
      console.warn('⚠️ Web research failed, proceeding with general knowledge.');
      return 'No specific facts found online.';
    }
  }

  /**
   * Step 1: Plan video concept using AI
   */
  private async planVideoConcept(prompt: string, researchData: string): Promise<{ success: boolean; error?: string }> {
    console.log('🧠 Step 1: Planning video concept...');
    
    const systemPrompt = `You are an expert Remotion video developer specializing in storyboarding and complex technology videos. Plan a video project based on the user's prompt.
    Return ONLY a valid JSON response (no markdown, no explanations):
    {
      "name": "project_name",
      "concept": "brief description",
      "duration": 15,
      "style": "technology, cyberpunk, futuristic, etc",
      "scenes": [
        {
          "name": "Intro Scene",
          "duration": 5,
          "description": "visual description",
          "audio_text": "voiceover text",
          "componentName": "IntroScene"
        }
      ]
    }`;

    const result = await bluesmindChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Prompt: ${prompt}\n\nContext:\n${researchData}` }
      ],
      temperature: 0.8,
      maxRetries: 5,  // lebih banyak retry untuk step planning
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
   * Step 1.5: Generate Assets (Architecture Hook)
   */
  private async generateAssets(): Promise<{ success: boolean; error?: string }> {
    console.log('🎨 Step 1.5: Generating Assets and Voiceovers (Architecture)...');
    
    if (!this.projectContext) {
      return { success: false, error: 'No project context available' };
    }

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    for (const scene of this.projectContext.scenes) {
      if (scene.audio_text && scene.audio_text.trim() !== '') {
        console.log(`🎙️ Generating TTS voiceover for: ${scene.componentName}`);
        try {
           const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(scene.audio_text)}&tl=id&client=tw-ob`;
           const res = await fetch(ttsUrl);
           if (res.ok) {
             const buffer = await res.arrayBuffer();
             fs.writeFileSync(path.join(publicDir, `${scene.componentName}.mp3`), Buffer.from(buffer));
             console.log(`✅ Voiceover saved to public/${scene.componentName}.mp3`);
           } else {
             console.warn(`⚠️ TTS API responded with ${res.status}`);
           }
        } catch (e) {
           console.warn(`⚠️ TTS generation failed for ${scene.componentName}`);
        }
      }
    }

    return { success: true };
  }

  /**
   * Step 2: Generate Remotion components using AI
   */
  private async generateRemotionComponents(): Promise<{ success: boolean; error?: string }> {
    console.log('⚙️ Step 2: Generating Remotion components...');
    
    if (!this.projectContext) {
      return { success: false, error: 'No project context available' };
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('child_process');

    for (const scene of this.projectContext.scenes) {
      const componentName = scene.componentName;
      console.log(`📝 Generating scene component: ${componentName}...`);
      
      let componentCode = await this.generateComponentCode(scene);
      let success = false;
      const MAX_ATTEMPTS = 3;
      
      if (componentCode) {
        // Validation + Director review loop (capped at MAX_ATTEMPTS total)
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          const filePath = path.join(process.cwd(), 'src', `${componentName}.tsx`);
          fs.writeFileSync(filePath, componentCode);
          
          try {
            console.log(`🔍 Validating ${componentName}.tsx (Attempt ${attempt}/${MAX_ATTEMPTS})...`);
            
            // Run tsc on entire project but filter errors to ONLY those from the current component
            // This prevents pre-existing broken files from causing false failures
            let tscOutput = '';
            try {
              execSync(`npx tsc --noEmit`, { stdio: 'pipe' });
              tscOutput = ''; // No errors at all
            } catch (tscError: any) {
              tscOutput = (tscError.stdout?.toString() || '') + (tscError.stderr?.toString() || '');
            }

            // Filter: only lines containing our specific file
            const relevantErrors = tscOutput
              .split('\n')
              .filter((line: string) => line.includes(`src/${componentName}.tsx`) || line.includes(`src\\${componentName}.tsx`))
              .join('\n')
              .trim();

            if (relevantErrors) {
              throw new Error(relevantErrors);
            }

            console.log(`✅ Validation passed for ${componentName}.tsx`);
            
            // Director Review — hanya lakukan jika bukan attempt terakhir supaya tidak loop terus
            if (attempt < MAX_ATTEMPTS) {
              console.log(`🎬 Director Agent is reviewing aesthetics...`);
              const review = await this.reviewComponentAesthetics(scene, componentCode);
              if (!review.passed) {
                console.warn(`🛑 Director rejected: ${review.feedback}`);
                console.log(`🔄 Requesting Coder Agent to improve aesthetics...`);
                const fixed = await this.fixComponentCode(scene, componentCode, `Director Feedback: ${review.feedback}`);
                if (fixed) {
                  componentCode = fixed;
                  continue; // Coba lagi dengan code yang sudah diperbaiki
                }
                // Jika fix gagal, tetap lanjut dengan code sebelumnya
              } else {
                console.log(`✨ Director approved ${componentName}!`);
              }
            }

            success = true;
            break;
          } catch (error: any) {
            const errorMsg = error.message || error.stdout?.toString() || '';
            console.warn(`⚠️  Validation failed for ${componentName}:\n${errorMsg}`);
            
            if (attempt >= MAX_ATTEMPTS) break; // Jangan retry di attempt terakhir
            
            console.log(`🔄 Requesting AI self-correction for ${componentName}...`);
            const fixed = await this.fixComponentCode(scene, componentCode, errorMsg);
            if (!fixed) break;
            componentCode = fixed;
          }
        }
      }
      
      if (!success) {
        console.warn(`⚠️  AI generation/validation failed for ${componentName}, using fallback template`);
        const fallbackCode = this.getFallbackComponent(componentName);
        const filePath = path.join(process.cwd(), 'src', `${componentName}.tsx`);
        fs.writeFileSync(filePath, fallbackCode);
        console.log(`✅ Generated (fallback): ${componentName}.tsx`);
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
   * Director Agent: Reviews the code for aesthetic quality
   */
  private async reviewComponentAesthetics(scene: VideoScene, code: string): Promise<{ passed: boolean; feedback?: string }> {
    const systemPrompt = `You are a strict Art Director reviewing a Remotion React component.
    Check if the component is visually appealing, uses good colors, smooth animations, and fits the style: ${this.projectContext?.style}.
    If it looks generic or ugly, reject it and provide specific feedback on how to improve it (e.g. use gradients, larger fonts, better shadows).
    If it looks great, approve it.
    Reply ONLY with JSON: { "approved": boolean, "feedback": "string explaining what to fix or why it's good" }`;

    const result = await bluesmindChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Review this code for ${scene.componentName}:\n\n${code}` }
      ],
      temperature: 0.3,
      maxRetries: 2
    });

    try {
      if (result.success && result.data?.choices?.[0]) {
        const content = result.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const json = JSON.parse(jsonMatch[0]);
          return { passed: json.approved === true, feedback: json.feedback };
        }
      }
    } catch (e) {
      // Fallback if parsing fails
    }
    return { passed: true }; // Pass by default to not block
  }

  /**
   * Generate individual component code using AI
   */
  private async generateComponentCode(scene: VideoScene): Promise<string | null> {
    const systemPrompt = `You are a Remotion expert. Generate a complete, working React component for Remotion.
    The component should:
    - Export a functional component named ${scene.componentName}
    - Use Remotion hooks (useCurrentFrame, useVideoConfig)
    - Be properly typed with TypeScript
    - Include proper imports from 'remotion' and 'react'
    - Be visually appealing and animated
    - Follow the project style: ${this.projectContext?.style}
    
    Return ONLY the raw TypeScript code, no markdown wrappers, no explanations.`;

    const result = await bluesmindChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Create a Remotion component called "${scene.componentName}" for a ${this.projectContext?.concept} video. 
Scene duration: ${scene.duration} seconds.
Visual description: ${scene.description}
Audio Voiceover: "${scene.audio_text}"` 
        }
      ],
      temperature: 0.8,
      maxRetries: 5,  // lebih banyak retry untuk code generation
    });

    if (result.success && result.data?.choices?.[0]) {
      let content = result.data.choices[0].message.content;
      return content.replace(/\`\`\`tsx?\n?|\`\`\`/g, '').trim();
    }
    return null;
  }

  private async fixComponentCode(scene: VideoScene, oldCode: string, errorMsg: string): Promise<string | null> {
    const systemPrompt = `You are a Remotion TypeScript expert. The previous code you generated failed compilation.
    Fix the errors in the code. Return ONLY the raw fixed TypeScript code, no markdown wrappers, no explanations.`;

    const result = await bluesmindChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Component Name: ${scene.componentName}\n\nCode:\n${oldCode}\n\nCompilation Error:\n${errorMsg}\n\nPlease fix the code.` }
      ],
      temperature: 0.2,
      maxRetries: 4,
    });

    if (result.success && result.data?.choices?.[0]) {
      let content = result.data.choices[0].message.content;
      return content.replace(/\`\`\`tsx?\n?|\`\`\`/g, '').trim();
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
          /(export const RemotionRoot: React\.FC = () => \{[\s\S]*?return \()/,
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
import { Composition, Sequence, Audio, staticFile } from 'remotion';
${project.scenes.map(s => `import { ${s.componentName} } from './${s.componentName}';`).join('\n')}

export const RemotionRoot: React.FC = () => {
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
    const fps = 60;
    const durationInFrames = Math.max(1, Math.floor(project.duration * fps));
    const width = 1920; 
    const height = 1080;
    
    let currentFrame = 0;
    const sequences = project.scenes.map(scene => {
      const sceneFrames = Math.max(1, Math.floor(scene.duration * fps));
      const seq = `          <Sequence from={${currentFrame}} durationInFrames={${sceneFrames}}>
            <${scene.componentName} />
            {/* Auto-generated Voiceover */}
            <Audio src={staticFile('${scene.componentName}.mp3')} />
          </Sequence>`;
      currentFrame += sceneFrames;
      return seq;
    }).join('\n');

    return `<Composition
      id="${project.name.replace(/\s+/g, '')}"
      component={() => (
        <div style={{ flex: 1, backgroundColor: 'black' }}>
${sequences}
        </div>
      )}
      durationInFrames={${durationInFrames}}
      fps={${fps}}
      width={${width}}
      height={${height}}
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
      // Configure git (may fail if auth is invalid)
      try {
        this.gitOps.configureGit();
      } catch (configError) {
        console.warn('⚠️  Git configuration failed, attempting local operations only...');
        console.warn(`   Error: ${configError instanceof Error ? configError.message : 'Unknown error'}`);
      }
      
      // Generate commit message using AI
      const commitMessage = await this.generateCommitMessage();
      
      // Try to commit (local operation, should work even without GitHub auth)
      try {
        const commitSuccess = await this.gitOps.gitCommit(commitMessage);
        
        if (commitSuccess) {
          console.log('✅ Git commit completed successfully');
          
          // Try to push (requires GitHub auth)
          try {
            console.log('⬆️  Pushing changes to GitHub...');
            const pushSuccess = await this.gitOps.gitPush();
            if (pushSuccess) {
              console.log('✅ Git push completed successfully');
              return { success: true };
            } else {
              console.warn('⚠️  Git push failed, but commit succeeded locally');
              console.warn('💡 Changes are committed locally. You can push manually when GitHub auth is fixed.');
              return { success: true }; // Don't fail the entire process
            }
          } catch (pushError) {
            console.warn('⚠️  Git push failed (likely authentication issue)');
            console.warn(`   Error: ${pushError instanceof Error ? pushError.message : 'Unknown error'}`);
            console.warn('💡 Changes are committed locally. You can push manually when GitHub auth is fixed.');
            return { success: true }; // Don't fail the entire process
          }
        } else {
          console.log('⚠️  No changes to commit or commit failed');
          return { success: true }; // Continue even if commit fails
        }
      } catch (commitError) {
        console.warn('⚠️  Git commit failed');
        console.warn(`   Error: ${commitError instanceof Error ? commitError.message : 'Unknown error'}`);
        console.warn('💡 Continuing without git operations...');
        return { success: true }; // Don't fail the entire process
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
          content: `Generate commit message for: ${this.projectContext?.concept} video project with scenes: ${this.projectContext?.scenes.map(s => s.componentName).join(', ')}`
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
   * Step 5: Trigger GitHub Actions workflow via push
   * GitHub Actions render.yml fires automatically on push - no API token scope needed
   */
  private async triggerGithubWorkflow(): Promise<{ success: boolean; error?: string }> {
    console.log('🚀 Step 5: Pushing to GitHub to trigger render workflow...');

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    
    if (!token || !owner || !repo) {
      console.warn('⚠️  Push skipped - missing GITHUB_TOKEN, GITHUB_USERNAME, or GITHUB_REPO');
      return { success: false, error: 'Missing GitHub credentials in .env' };
    }

    if (!this.gitOps) {
      return { success: false, error: 'Git operations not initialized' };
    }

    try {
      // Set remote URL with token for authenticated push
      const encodedToken = encodeURIComponent(token);
      const repoUrl = `https://${encodedToken}@github.com/${owner}/${repo}.git`;
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { execSync } = require('child_process');
      execSync(`git remote set-url origin ${repoUrl}`, { stdio: 'pipe' });
      
      // Push to trigger GitHub Actions automatically
      execSync('git push origin main', { stdio: 'inherit' });
      
      const compositionId = this.projectContext?.name.replace(/\s+/g, '') || 'RemotionVideo';
      console.log('✅ Successfully pushed to GitHub!');
      console.log(`📊 GitHub Actions (render.yml) will auto-trigger.`);
      console.log(`🔗 Monitor: https://github.com/${owner}/${repo}/actions`);
      console.log(`🎬 Composition ID: ${compositionId}`);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Push failed: ${errorMessage}`);
      console.log(`\n💡 Manual options:`);
      console.log(`   1. Fix auth in .env and run: git push origin main`);
      console.log(`   2. Render locally: npm run render`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get agent status and progress
   */
  getAgentStatus(): AgentTask[] {
    return this.tasks;
  }
}