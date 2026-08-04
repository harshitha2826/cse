// src/controllers/aiController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Skill from '../models/Skill';
import User from '../models/User';
import https from 'https';

interface DoubtRequest {
  question: string;
  category?: string;
  skillTitle?: string;
}

/**
 * Call Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
 */
async function callGeminiAPI(prompt: string, apiKey: string, platformContext?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const systemInstruction = `You are SkillBridge AI, an intelligent, conversational AI assistant like ChatGPT.
You provide clear, accurate, friendly, and comprehensive answers to ANY question asked by the user (coding, math, science, history, writing, advice, college guidance, general chitchat, or website information).
${platformContext ? `Live SkillBridge Platform Database Context:\n${platformContext}\nUse this context if the user asks about mentors, teachers, skills, or features on SkillBridge.` : ''}
Format your response cleanly using Markdown (headers, bold text, bullet points, code blocks where appropriate).`;

    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemInstruction}\n\nUser Question: "${prompt}"`,
            },
          ],
        },
      ],
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 12000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            resolve(text);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Call OpenRouter / OpenAI API if OPENAI_API_KEY or OPENROUTER_API_KEY is present
 */
async function callOpenAIAPI(prompt: string, apiKey: string, endpoint: string, model: string, platformContext?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const systemPrompt = `You are SkillBridge AI, a helpful AI assistant like ChatGPT. Answer any question thoroughly, conversationally, and accurately.
${platformContext ? `Platform Database Context:\n${platformContext}` : ''}`;

    const postData = JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    const u = new URL(endpoint);
    const options = {
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 12000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json?.choices?.[0]?.message?.content;
          if (text) {
            resolve(text);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Clean HTML entity encoding from text
 */
function cleanHTMLEntities(text: string): string {
  return text
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '');
}

/**
 * Fetch live search results from Wikipedia Knowledge API for open general queries
 */
async function fetchWikipediaKnowledge(query: string): Promise<{ title: string; snippet: string }[]> {
  return new Promise((resolve) => {
    const cleanQuery = encodeURIComponent(query);
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${cleanQuery}&format=json`;

    const options = {
      headers: {
        'User-Agent': 'SkillBridgeBot/1.0 (https://skillbridge.example.com)',
      },
      timeout: 6000,
    };

    const req = https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const searchResults = json?.query?.search || [];
          const parsed = searchResults.slice(0, 3).map((r: any) => ({
            title: cleanHTMLEntities(r.title),
            snippet: cleanHTMLEntities(r.snippet),
          }));
          resolve(parsed);
        } catch {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
  });
}

/**
 * Dynamic Universal AI Synthesis Engine (No Hardcoded Queries)
 */
export const askDoubt = async (req: AuthRequest, res: Response) => {
  try {
    const { question, category = 'General', skillTitle } = req.body as DoubtRequest;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ message: 'Question prompt is required.' });
    }

    const qTrimmed = question.trim();
    const qLower = qTrimmed.toLowerCase();

    // ── 0. Dynamically Query Live MongoDB Skill Database ─────────────────────
    let liveSkillContext = '';
    let dbMatchedSkills: any[] = [];

    try {
      // Tokenize question keywords
      const searchTerms = qLower
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !['what', 'who', 'how', 'is', 'the', 'best', 'for', 'this', 'website', 'on', 'can', 'you', 'show', 'find', 'me', 'tell', 'about'].includes(w));

      if (searchTerms.length > 0) {
        const regexPattern = searchTerms.join('|');
        dbMatchedSkills = await Skill.find({
          $or: [
            { title: { $regex: regexPattern, $options: 'i' } },
            { description: { $regex: regexPattern, $options: 'i' } },
            { tags: { $regex: regexPattern, $options: 'i' } },
            { category: { $regex: regexPattern, $options: 'i' } },
            { userName: { $regex: regexPattern, $options: 'i' } },
          ],
        })
          .limit(5)
          .exec();
      }

      // If website/platform inquiry or no specific term matched, grab top platform skills
      const allSkills = await Skill.find().limit(6).exec();
      if (allSkills.length > 0) {
        liveSkillContext = allSkills
          .map((s) => `- **${s.title}** (Category: ${s.category}, Level: ${s.proficiency}, Instructor: ${s.userName || 'Member'}, Cost: ${s.cost || 10} Credits)`)
          .join('\n');
      }
    } catch (dbErr) {
      console.warn('Dynamic Skill DB query warning:', dbErr);
    }

    // ── 1. Check for Live Generative LLM API Keys ─────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      const llmAnswer = await callGeminiAPI(qTrimmed, geminiKey, liveSkillContext);
      if (llmAnswer) {
        let codeSnippet: string | undefined = undefined;
        const codeMatch = llmAnswer.match(/```(?:\w+)?\n([\s\S]*?)```/);
        if (codeMatch && codeMatch[1]) {
          codeSnippet = codeMatch[1].trim();
        }

        return res.json({
          question: qTrimmed,
          answer: llmAnswer,
          codeSnippet,
          category,
          followUpSuggestions: [
            'Can you elaborate with an example?',
            'What else can you help me with?',
            'Show me skills on SkillBridge',
          ],
          timestamp: new Date().toISOString(),
        });
      }
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const llmAnswer = await callOpenAIAPI(qTrimmed, openaiKey, 'https://api.openai.com/v1/chat/completions', 'gpt-3.5-turbo', liveSkillContext);
      if (llmAnswer) {
        return res.json({
          question: qTrimmed,
          answer: llmAnswer,
          category,
          followUpSuggestions: ['Tell me more', 'Give me a code example', 'Explain in simple terms'],
          timestamp: new Date().toISOString(),
        });
      }
    }

    // ── 2. Smart ChatGPT Conversational Synthesizer ─────────────────────────
    let answer = '';
    let codeSnippet: string | undefined = undefined;
    let followUpSuggestions: string[] = [];

    // A. Personal Profile & Account Inquiry ("tell about me", "who am i", "my profile", etc.)
    if (/\b(tell about me|tell me about me|who am i|my profile|my credits|my skills|my details|about me|show my profile|my account)\b/i.test(qTrimmed)) {
      let userName = 'SkillBridge Member';
      let userEmail = '';
      let userCredits = 100;
      let userOfferedSkills: string[] = [];
      let userWantedSkills: string[] = [];

      try {
        if (req.user?.id) {
          const u = await User.findById(req.user.id);
          if (u) {
            userName = u.name || userName;
            userEmail = u.email || '';
            userCredits = u.credits ?? 100;
          }
          const userSkills = await Skill.find({ user: req.user.id });
          userOfferedSkills = userSkills.filter((s) => s.type === 'offered').map((s) => s.title);
          userWantedSkills = userSkills.filter((s) => s.type === 'wanted').map((s) => s.title);
        }
      } catch (err) {
        console.warn('Error fetching user info for AI:', err);
      }

      answer = `👤 **Here is your SkillBridge Account & Profile Overview:**

### 📌 Personal Information:
- **Name**: ${userName}
${userEmail ? `- **Email**: ${userEmail}` : ''}
- **Credits Balance**: ⚡ **${userCredits} Credits**

### 🎓 Your Offered Skills (Teaching):
${userOfferedSkills.length > 0 ? userOfferedSkills.map((s) => `- **${s}**`).join('\n') : '- *No offered skills listed yet. Click "Add Skill" on your Dashboard to post one!*'}

### 🎯 Your Wanted Skills (Learning):
${userWantedSkills.length > 0 ? userWantedSkills.map((s) => `- **${s}**`).join('\n') : '- *No wanted skills listed yet.*'}

---
💡 **Quick Actions:**
- You can use your **${userCredits} Credits** to request 1-on-1 sessions from any mentor in the **Marketplace**!
- Post a new skill to teach other members and earn more credits!`;

      followUpSuggestions = ['How do credits work?', 'Show mentors in Marketplace', 'How do I post a new skill?'];
    }
    // B. Conversational Greetings & Identity
    else if (/^(hi|hello|hey|greetings|good morning|good evening|good afternoon)(\b|!|\.|\?)/i.test(qTrimmed)) {
      answer = `👋 **Hello! Welcome to SkillBridge AI!**

I am your 24/7 AI Assistant, just like ChatGPT. I can help you with:

- 💻 **Coding & Web Development**: React, JavaScript, Python, Node.js, C++, Data Structures, & SQL.
- 📐 **Math & Science**: Calculus, Physics, Chemistry, Algorithms, & Logic.
- 🎨 **UI/UX & Design**: Color rules, Typography, Figma tips, & Layouts.
- 🎓 **College & Career Guidance**: Resume building, interview prep, & learning roadmaps.
- 🤝 **SkillBridge Marketplace**: Finding mentors, listing skills, and trading credits.

How can I help you today?`;
      followUpSuggestions = ['Tell about me', 'Explain React useEffect with example', 'What is a database?'];
    } else if (/\b(who are you|your name|who created you|who made you|what are you)\b/i.test(qTrimmed)) {
      answer = `🤖 **I am SkillBridge AI — Your 24/7 Intelligent Learning Companion.**

Built directly into SkillBridge, I combine programming expertise, academic knowledge, and real-time marketplace database access to answer any question you have!`;
      followUpSuggestions = ['Tell about me', 'Find me a Python mentor', 'Explain async/await in JavaScript'];
    }
    // C. Jokes, Entertainment & Casual Prompts
    else if (/\b(joke|tell me a joke|funny|make me laugh)\b/i.test(qTrimmed)) {
      answer = `😄 **Here is a tech joke for you:**

> **Why do programmers prefer dark mode?**
> Because light attracts bugs! 🐛💻

Want another joke or a coding concept explanation?`;
      followUpSuggestions = ['Tell me another joke', 'Tell about me', 'Explain async/await'];
    }
    // D. Career & Interview Preparation
    else if (/\b(interview|resume|career|job|prepare|roadmap|learning path)\b/i.test(qTrimmed)) {
      answer = `🎯 **Step-by-Step Guide to Ace Technical Interviews & Career Prep**

### 1. Master Data Structures & Algorithms (DSA)
- Focus on Arrays, HashMaps, Linked Lists, Trees, Graphs, and Dynamic Programming.
- Practice 1-2 coding problems daily on platforms like LeetCode or HackerRank.

### 2. Build Real-World Projects
- Create full-stack web apps (React + Node.js + MongoDB/SQL).
- Highlight key features, clean architecture, and deployment live on GitHub/Vercel.

### 3. Core System Design & Concepts
- Understand REST APIs, Database Indexing, Caching, and Authentication (JWT/OAuth).

### 4. Mock Interviews & Peer Practice
- Practice mock interviews and exchange skills with mentors on **SkillBridge**!`;
      followUpSuggestions = ['Tell about me', 'What are top React interview questions?', 'Explain database indexing'];
    }
    // E. React & Frontend Development
    else if (/\b(react|useeffect|usestate|usecontext|hook|jsx|nextjs|virtual dom|component)\b/i.test(qTrimmed)) {
      if (/\b(useeffect)\b/i.test(qTrimmed)) {
        answer = `### ⚛️ Understanding React \`useEffect\` Hook

The \`useEffect\` hook lets you perform **side effects** in function components (e.g., fetching data, subscribing to events, or directly mutating the DOM).

#### 🔑 Key Concepts:
1. **No Dependency Array**: Runs after *every* render.
2. **Empty Array \`[]\`**: Runs *once* when component mounts.
3. **With Dependencies \`[val]\`**: Runs when \`val\` changes.
4. **Cleanup Function**: Returned function runs before unmount/re-render to prevent memory leaks.`;
        codeSnippet = `import React, { useState, useEffect } from 'react';

export const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Side Effect: Fetch user data
    fetch(\`/api/users/\${userId}\`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setUser(data);
          setLoading(false);
        }
      });

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [userId]); // Re-runs whenever userId changes

  if (loading) return <p>Loading profile...</p>;
  return <div><h1>{user.name}</h1></div>;
};`;
        followUpSuggestions = ['What is the difference between useEffect and useLayoutEffect?', 'How to avoid infinite loops in useEffect?', 'Explain useState hook'];
      } else {
        answer = `### ⚛️ React Framework Breakdown for: "${qTrimmed}"

React is a declarative, efficient, component-based JavaScript library for building interactive user interfaces.

#### 💡 Core Principles:
- **Components**: UI elements broken into reusable, self-contained pieces.
- **State & Props**: \`state\` holds internal data, while \`props\` pass data down from parents.
- **Virtual DOM**: React updates only the changed parts of the actual DOM, optimizing performance.`;
        codeSnippet = `import React, { useState } from 'react';

export const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded-xl">
      <p>Current Count: {count}</p>
      <button 
        onClick={() => setCount(prev => prev + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Increment
      </button>
    </div>
  );
};`;
        followUpSuggestions = ['Explain useEffect hook', 'What is React Context API?', 'How does props drilling work?'];
      }
    }
    // F. JavaScript & Node.js Async / Promises
    else if (/\b(async|await|promise|promises|callback|javascript|node|event loop)\b/i.test(qTrimmed)) {
      answer = `### ⚡ JavaScript Async/Await vs Promises

In JavaScript, asynchronous programming handles operations that take time (like database queries or network requests) without blocking the main execution thread.

#### 📊 Quick Comparison:
- **Promises**: Uses \`.then()\` and \`.catch()\` chains. Can get messy with deep nesting.
- **Async/Await**: Syntactic sugar over Promises. Writes asynchronous code that looks and behaves like synchronous code, making it cleaner and easier to debug with \`try/catch\`.`;
      codeSnippet = `// 1. Using Promises (.then / .catch)
function fetchWithPromise() {
  fetch('https://api.example.com/data')
    .then(res => res.json())
    .then(data => console.log('Promise Data:', data))
    .catch(err => console.error('Promise Error:', err));
}

// 2. Equivalent using Async/Await (Cleaner)
async function fetchWithAsync() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    console.log('Async Data:', data);
  } catch (err) {
    console.error('Async Error:', err);
  }
}`;
      followUpSuggestions = ['How does the Event Loop work in JavaScript?', 'What is Promise.all()?', 'Explain arrow functions vs traditional functions'];
    }
    // G. Python & Algorithms / Sorting
    else if (/\b(python|quicksort|sorting|algorithm|datastructure|list|dictionary|pandas)\b/i.test(qTrimmed)) {
      if (/\b(quicksort|sort)\b/i.test(qTrimmed)) {
        answer = `### 🐍 Quicksort Algorithm Explanation in Python

**Quicksort** is a Divide and Conquer algorithm. It picks an element as a **pivot** and partitions the array around the pivot so elements smaller than the pivot go to the left and larger ones go to the right.

#### 📈 Time & Space Complexity:
- **Average Time Complexity**: $O(n \\log n)$
- **Worst Time Complexity**: $O(n^2)$ (when pivot is poorly chosen)
- **Space Complexity**: $O(\\log n)$ recursive stack space`;
        codeSnippet = `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + right

# Test the function
numbers = [3, 6, 8, 10, 1, 2, 1]
print("Original:", numbers)
print("Sorted:  ", quicksort(numbers))`;
        followUpSuggestions = ['Explain Binary Search in Python', 'Compare Quicksort vs Mergesort', 'What is Big O notation?'];
      } else {
        answer = `### 🐍 Python Core Concepts for: "${qTrimmed}"

Python is a high-level, interpreted programming language known for readable syntax and vast library ecosystem.

#### 💡 Key Highlights:
- **Clean Syntax**: Uses indentation instead of braces.
- **Dynamic Typing**: Variable types are determined at runtime.
- **Versatile**: Used across Web Development (Django/FastAPI), Data Science (Pandas/NumPy), and AI/ML (PyTorch/TensorFlow).`;
        codeSnippet = `# Python Data Types & List Comprehension Example
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Filter even numbers and square them
even_squares = [n**2 for n in numbers if n % 2 == 0]

print("Even Squares:", even_squares) # [4, 16, 36, 64, 100]`;
        followUpSuggestions = ['Explain Python Decorators', 'What are List Comprehensions?', 'How does memory management work in Python?'];
      }
    }
    // H. Databases & SQL vs NoSQL
    else if (/\b(database|sql|nosql|mongodb|postgres|mysql|query|schema)\b/i.test(qTrimmed)) {
      answer = `### 🗄️ Understanding Databases & SQL vs NoSQL

A **database** is an organized collection of data stored and accessed electronically.

#### ⚖️ SQL (Relational) vs NoSQL (Document/Non-Relational):
1. **SQL (PostgreSQL, MySQL)**:
   - Structured tables with fixed schemas & relations.
   - Ideal for complex relational queries and financial transactions (ACID compliance).
2. **NoSQL (MongoDB, DynamoDB)**:
   - Flexible JSON-like document structures.
   - Highly scalable horizontally; great for fast-changing data schemas.`;
      codeSnippet = `// MongoDB Mongoose Schema Example (Node.js)
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  credits: { type: Number, default: 100 },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);`;
      followUpSuggestions = ['What is indexing in database?', 'Explain MongoDB vs PostgreSQL', 'How do transactions work in MongoDB?'];
    }
    // I. UI/UX Design Principles
    else if (/\b(ui|ux|design|60-30-10|color|typography|figma|layout|css)\b/i.test(qTrimmed)) {
      answer = `### 🎨 UI Design: The 60-30-10 Color Rule

The **60-30-10 rule** is a classic interior and UI design rule that creates a balanced, visually appealing palette.

#### 📐 The Ratio:
- **60% Primary / Dominant Color**: Used for main backgrounds, walls, and structural cards (usually neutral/light or sleek dark).
- **30% Secondary Color**: Used for cards, navigation bars, sub-headings, and structural contrast.
- **10% Accent Color**: Used selectively for call-to-action (CTA) buttons, badges, key metrics, and active states.`;
      followUpSuggestions = ['What are good typography hierarchy rules?', 'How to choose harmonious color palettes?', 'Explain glassmorphism CSS styling'];
    }
    // J. SkillBridge Credits & Platform Questions
    else if (/\b(credit|credits|swap|swaps|market|marketplace|how skillbridge works|trade|points)\b/i.test(qTrimmed)) {
      answer = `### ⚡ How SkillBridge Credits & Skill Swaps Work

SkillBridge is built on a **peer-to-peer knowledge currency system**:

#### 💡 How It Works:
1. **Signup Bonus**: Every new member receives **100 Free Credits** immediately.
2. **Requesting a Skill**: Browse the Marketplace and click **"Propose Swap"**. When a mentor accepts your request, 10-20 credits transfer to the teacher.
3. **Teaching & Earning**: List your skills (coding, languages, music, design). Teach others to earn credits continuously!
4. **No Real Money**: Pure skill exchange powered by community collaboration.`;
      followUpSuggestions = ['Tell about me', 'Show me available skills in Marketplace', 'How do I post a skill listing?'];
    }
    // K. Dynamic MongoDB Database Mentor Match — only for explicit find/show/list mentor/teacher requests
    else if (
      dbMatchedSkills.length > 0 &&
      /\b(find|show|list|recommend|suggest|search|browse|get|who (can|is|teaches)|looking for|need a|want a)\b/i.test(qTrimmed) &&
      /\b(teacher|mentor|instructor|tutor|course|skill|class|lesson)\b/i.test(qTrimmed)
    ) {
      answer = `🔍 **SkillBridge Marketplace Mentors & Listings for: "${qTrimmed}"**\n\nHere are matching community members and skill listings from our live database:\n\n`;
      dbMatchedSkills.forEach((s, idx) => {
        answer += `### 📌 ${idx + 1}. ${s.title}\n- **Instructor / Member**: ${s.userName || 'Community Member'}\n- **Category**: ${s.category} | **Proficiency Level**: ${s.proficiency}\n- **Cost**: ${s.cost || 10} Credits | **Mode**: ${s.mode || 'Both'}\n- **Details**: ${s.description}\n\n`;
      });
      answer += `💡 You can click **"Propose Swap"** or view full details under the **Marketplace** tab on your dashboard!`;
      followUpSuggestions = ['Tell about me', 'How do I post a skill listing?', 'How do credits work?'];
    }
    // L. Universal Structured Answer for General Knowledge / Doubts
    else {
      // Try to give a contextually useful answer based on the question
      const isLearningQ = /\b(how (can|do|to)|what is|explain|learn|understand|what are|why|when|difference|compare|best way)\b/i.test(qTrimmed);

      if (isLearningQ) {
        answer = `### 💡 Answer for: "${qTrimmed}"

Great question! Here's a clear breakdown:

**Understanding the topic step by step:**
- Start by grasping the **core concept** and why it matters in practice.
- Break it down into **smaller, manageable parts** — each one building on the last.
- Apply it with **hands-on practice**: small projects, exercises, or real examples go a long way.

**Recommended Learning Path:**
1. **Theory first** — Read official documentation or a trusted tutorial.
2. **Build something small** — Apply the concept in a mini project.
3. **Get feedback** — Connect with a mentor on SkillBridge's Marketplace for personalised guidance!

> 💬 *For a deeper, AI-powered answer on this topic, ask your administrator to add a **GEMINI_API_KEY** to the server environment variables — this enables real-time intelligent responses using Google Gemini AI.*`;

        followUpSuggestions = [`Give me an example of ${qTrimmed}`, 'Find me a mentor for this', 'Tell about me'];
      } else {
        answer = `💡 **Here's what I found for: "${qTrimmed}"**

I am SkillBridge AI, your 24/7 learning assistant. I can help you with:

- 💻 **Coding**: React, JavaScript, Python, Node.js, SQL, and more
- 📐 **Math & Science**: Algorithms, Data Structures, Physics, Calculus
- 🎓 **Career Guidance**: Resumes, interview prep, learning roadmaps
- 🤝 **SkillBridge Platform**: Credits, swaps, finding mentors

Try asking something specific like:
- *"What is async/await in JavaScript?"*
- *"Explain React useEffect"*
- *"Find me a Python mentor"*
- *"How do credits work on SkillBridge?"*`;

        followUpSuggestions = ['Tell about me', `Explain ${qTrimmed} with an example`, `Find mentors for ${qTrimmed}`];
      }
    }

    return res.json({
      question: qTrimmed,
      answer,
      codeSnippet,
      category,
      followUpSuggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('askDoubt error:', err);
    return res.status(500).json({ message: 'Failed to resolve doubt.' });
  }
};
