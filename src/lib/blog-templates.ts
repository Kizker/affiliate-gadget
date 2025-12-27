export interface BlogTemplate {
  id: string
  name: string
  description: string
  icon: string
  content: string
}

export const blogTemplates: BlogTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch with a clean slate',
    icon: '📄',
    content: '<p>Start writing your content here...</p>',
  },
  {
    id: 'tech-tutorial',
    name: 'Tech Tutorial',
    description: 'Perfect for step-by-step technical guides',
    icon: '💻',
    content: `
<h1>Tutorial Title</h1>
<p><em>Last updated: ${new Date().toLocaleDateString('id-ID')}</em></p>

<h2>📋 Introduction</h2>
<p>Brief overview of what this tutorial covers and what readers will learn...</p>

<h2>✅ Prerequisites</h2>
<ul>
  <li>Requirement 1</li>
  <li>Requirement 2</li>
  <li>Requirement 3</li>
</ul>

<h2>🚀 Step-by-Step Guide</h2>

<h3>Step 1: Getting Started</h3>
<p>Detailed explanation of the first step...</p>
<pre><code>// Code example
console.log('Hello World');</code></pre>

<h3>Step 2: Configuration</h3>
<p>Explanation of configuration steps...</p>

<h3>Step 3: Implementation</h3>
<p>Implementation details...</p>

<h2>💡 Tips & Best Practices</h2>
<ul>
  <li>Tip 1</li>
  <li>Tip 2</li>
</ul>

<h2>🎯 Conclusion</h2>
<p>Summary of what was covered and next steps...</p>
    `.trim(),
  },
  {
    id: 'product-review',
    name: 'Product Review',
    description: 'Comprehensive product review template',
    icon: '⭐',
    content: `
<h1>Product Name Review</h1>
<div style="font-size: 24px; margin: 20px 0;">⭐⭐⭐⭐⭐ <span style="color: #10B981; font-weight: bold;">4.5/5</span></div>

<h2>📦 Overview</h2>
<p>Brief introduction to the product and what it does...</p>

<h2>✨ Key Features</h2>
<ul>
  <li><strong>Feature 1:</strong> Description</li>
  <li><strong>Feature 2:</strong> Description</li>
  <li><strong>Feature 3:</strong> Description</li>
</ul>

<h2>⚖️ Pros & Cons</h2>

<h3 style="color: #10B981;">✅ Pros</h3>
<ul>
  <li>Advantage 1</li>
  <li>Advantage 2</li>
  <li>Advantage 3</li>
</ul>

<h3 style="color: #EF4444;">❌ Cons</h3>
<ul>
  <li>Disadvantage 1</li>
  <li>Disadvantage 2</li>
</ul>

<h2>💰 Price & Value</h2>
<p>Discussion of pricing and value proposition...</p>

<h2>🎯 Final Verdict</h2>
<p><strong>Who should buy this:</strong> Target audience description...</p>
<p><strong>Bottom line:</strong> Final recommendation...</p>
    `.trim(),
  },
  {
    id: 'news-article',
    name: 'News Article',
    description: 'Breaking news and announcements',
    icon: '📰',
    content: `
<h1>Headline Goes Here</h1>
<p style="font-size: 18px; color: #6B7280; margin: 20px 0;"><strong>Lead paragraph:</strong> The most important information in 1-2 sentences...</p>

<p><em>${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</em></p>

<h2>📖 The Story</h2>
<p>Detailed explanation of what happened, when, where, and who was involved...</p>

<h2>💡 What This Means</h2>
<p>Analysis and implications of the news...</p>

<h2>📊 Key Facts</h2>
<ul>
  <li>Fact 1</li>
  <li>Fact 2</li>
  <li>Fact 3</li>
</ul>

<h2>🔮 Looking Ahead</h2>
<p>What to expect next and future developments...</p>
    `.trim(),
  },
  {
    id: 'how-to-guide',
    name: 'How-To Guide',
    description: 'Quick and practical how-to guides',
    icon: '🛠️',
    content: `
<h1>How to [Task Name]</h1>

<div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
  <p style="margin: 0;"><strong>⏱️ Time needed:</strong> X minutes</p>
  <p style="margin: 5px 0 0 0;"><strong>📊 Difficulty:</strong> Beginner / Intermediate / Advanced</p>
</div>

<h2>🎯 What You'll Need</h2>
<ul>
  <li>Tool/Material 1</li>
  <li>Tool/Material 2</li>
  <li>Tool/Material 3</li>
</ul>

<h2>📝 Instructions</h2>

<h3>1. First Step</h3>
<p>Detailed instructions for the first step...</p>

<h3>2. Second Step</h3>
<p>Detailed instructions for the second step...</p>

<h3>3. Third Step</h3>
<p>Detailed instructions for the third step...</p>

<h2>💡 Tips & Tricks</h2>
<ul>
  <li>Helpful tip 1</li>
  <li>Helpful tip 2</li>
</ul>

<h2>⚠️ Common Mistakes to Avoid</h2>
<ul>
  <li>Mistake 1 and how to avoid it</li>
  <li>Mistake 2 and how to avoid it</li>
</ul>
    `.trim(),
  },
  {
    id: 'listicle',
    name: 'Listicle',
    description: 'Top 10, best of, comparison lists',
    icon: '📝',
    content: `
<h1>Top 10 [Topic]</h1>
<p>Introduction explaining what this list is about and why it matters...</p>

<h2>10. Item Ten</h2>
<p>Description and why it made the list...</p>

<h2>9. Item Nine</h2>
<p>Description and why it made the list...</p>

<h2>8. Item Eight</h2>
<p>Description and why it made the list...</p>

<h2>7. Item Seven</h2>
<p>Description and why it made the list...</p>

<h2>6. Item Six</h2>
<p>Description and why it made the list...</p>

<h2>5. Item Five</h2>
<p>Description and why it made the list...</p>

<h2>4. Item Four</h2>
<p>Description and why it made the list...</p>

<h2>3. Item Three</h2>
<p>Description and why it made the list...</p>

<h2>2. Item Two</h2>
<p>Description and why it made the list...</p>

<h2>1. Item One - The Best!</h2>
<p>Description of the top item and why it's number one...</p>

<h2>🎯 Conclusion</h2>
<p>Summary and final thoughts...</p>
    `.trim(),
  },
]

export function getTemplateById(id: string): BlogTemplate | undefined {
  return blogTemplates.find((template) => template.id === id)
}
