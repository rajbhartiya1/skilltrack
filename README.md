This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API routes.
- [Next.js Learn](https://nextjs.org/learn) - an interactive tutorial.
- [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# SkillTrack

SkillTrack is an AI-assisted skills-gap and employment-tracking platform for students and job seekers. It connects a user's profile, skills, target roles, job applications, resume evidence, and career guidance in one workflow.

The project is also packaged as the **SIH Prototype: Skills Gap and Employment Tracking Dashboard**.

## Product capabilities

- Authenticated student profile and skill management
- Skill-gap scoring against job requirements
- Job discovery and personalized recommendations
- Application tracking with `Wishlist`, `Applied`, `Interview`, and `Offer` states
- AI career assistant with multilingual and Hinglish responses
- Resume analysis for PDF, DOCX, and TXT files
- Career coach and interview coach workflows
- Dashboard-level readiness and progress signals

## Architecture at a glance

```text
Browser
	|
	v
Next.js App Router / React UI
	|                    \
	|                     \-- /api/ai-career
	|                     \-- /api/resume-analyze
	v
Supabase Auth + Database       OpenAI Responses API
	|
	+-- profiles                 +-- Career guidance
	+-- jobs                     +-- Resume analysis
	+-- applications
```

## Technology stack

### Frontend

- Next.js `16.3.5` with the App Router
- React `19.2.8`
- TypeScript
- Tailwind CSS v4 through PostCSS
- Shared application shell and navigation in `components/AppShell.tsx` and `components/TopNav.tsx`
- Client-side Supabase authentication and data access

### Backend

- Next.js Route Handlers running on the Node.js runtime where file parsing is required
- `/api/ai-career` for AI career guidance
- `/api/resume-analyze` for resume upload, text extraction, and structured AI analysis
- Server-side validation for file type, file size, missing API keys, and malformed requests
- Fallback career guidance when the AI request fails in the career assistant route

### Database and authentication

Supabase provides both authentication and the PostgreSQL database. The browser client is initialized in `lib/supabase.ts` using:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The current application reads and writes these logical tables:

| Table | Purpose | Main fields used |
| --- | --- | --- |
| `profiles` | User identity, bio, and skills | `id`, `full_name`, `bio`, `skills` |
| `jobs` | Job catalogue and role requirements | `id`, `title`, `company`, `required_skills`, `description`, `location`, `created_at` |
| `applications` | Per-user job pipeline | `id`, `user_id`, `job_id`, `status`, `applied_at` |

`applications.job_id` is queried with the related job record. In production, enable Supabase Row Level Security so users can only read and modify their own profile and applications.

### Skill engine

The deterministic skill engine is implemented in `lib/skillGap.ts`.

1. User skills are normalized from either strings or `{ name, level }` objects.
2. Skill names are trimmed and compared case-insensitively.
3. Proficiency is clamped to `0-100`.
4. Each required job skill is compared against a default readiness level of `70`.
5. The engine returns:
	 - `matchPercentage`
	 - `matchedSkills`
	 - `missingSkills`
	 - `improvingSkills`

The current score is an explainable average of the user's proficiency against each required skill. A missing skill contributes zero. Legacy string-only skills are treated as level `70` for backward compatibility.

### External APIs and document processing

#### OpenAI

OpenAI is called only from Next.js server routes using `OPENAI_API_KEY`:

- `app/api/ai-career/route.ts` uses the Responses API with `gpt-4o-mini` for career guidance.
- `app/api/resume-analyze/route.ts` uses the Responses API for structured resume analysis.

The resume analyzer asks for JSON fields including `overallScore`, `summary`, `strengths`, `weaknesses`, `missingSkills`, `recommendedSkills`, `improvements`, `atsTips`, and `careerFit`.

#### Resume parsing libraries

- `unpdf` extracts text from PDF files.
- `mammoth` extracts raw text from DOCX files.
- Native `Buffer` handling is used for TXT files.

Resume uploads are limited to PDF, DOCX, or TXT and must be smaller than 8 MB. Extracted text is normalized and capped before it is sent to the model.

There is no external jobs API wired into the current code. Jobs are currently loaded from the Supabase `jobs` table.

## Frontend routes

| Route | Purpose |
| --- | --- |
| `/` | Authenticated dashboard with readiness, skills, jobs, and applications |
| `/login` | Existing-user authentication |
| `/signup` | New-user registration and profile creation |
| `/profile` | Profile and skills editing |
| `/skills` | Skill management |
| `/skill-gap` | Skill-gap analysis |
| `/jobs` | Job catalogue and filtering |
| `/jobs/[id]` | Job details and application action |
| `/recommendations` | Recommended jobs based on skill match |
| `/applications` | Application pipeline tracking |
| `/resume-analyzer` | Resume upload and AI analysis |
| `/career-coach` | Career coaching workflow |
| `/interview-coach` | Interview preparation workflow |
| `/ai-assistant` | Conversational AI career assistant |

## API routes

### `POST /api/ai-career`

Request body:

```json
{
	"question": "Which skill should I learn next?",
	"context": "Optional SkillTrack context",
	"conversation": [
		{ "role": "user", "text": "I want a data analyst role" }
	]
}
```

Returns an `answer` string. The assistant is instructed to reply in the user's language, including Hindi and Hinglish, and to use the supplied SkillTrack context without inventing user data.

### `POST /api/resume-analyze`

Multipart form fields:

- `file`: PDF, DOCX, or TXT resume
- `targetCareer`: optional target role
- `targetSkills`: optional target skills
- `profileSkills`: optional current profile skills

Returns the uploaded file name, extracted text length, and the structured `analysis` object. The route returns validation errors for unsupported files, files over 8 MB, unreadable documents, short extracted text, and missing `OPENAI_API_KEY`.

## Environment variables

Create a local `.env.local` file. Do not commit it.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
OPENAI_API_KEY=your-openai-api-key
```

The `NEXT_PUBLIC_` values are intentionally available to the browser because the Supabase client is browser-side. The OpenAI key must remain server-side and must never be prefixed with `NEXT_PUBLIC_`.

## Local development

Requirements:

- Node.js 20 or newer recommended
- npm
- A Supabase project
- An OpenAI API key for AI features

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available scripts:

```bash
npm run dev      # Start Next.js development server
npm run build    # Create a production build
npm run start    # Start the production build
npm run lint     # Run ESLint
```

## Supabase setup checklist

1. Create a Supabase project.
2. Enable email/password authentication.
3. Create the `profiles`, `jobs`, and `applications` tables with the fields used above.
4. Add a foreign key from `applications.job_id` to `jobs.id`.
5. Add Row Level Security policies for user-owned profile and application data.
6. Seed the `jobs` table with roles and `required_skills` arrays.
7. Add the project URL and publishable key to `.env.local`.

The repository does not currently include a Supabase migration folder, so schema creation and policies must be maintained in the Supabase dashboard or added as migrations before production rollout.

## Hosting and deployment

The app is compatible with Vercel's Next.js deployment model.

1. Import the repository into Vercel.
2. Set the three environment variables in the Vercel project settings.
3. Use the default Next.js build settings.
4. Deploy and verify authentication, database policies, and both API routes.

The resume analyzer explicitly uses the Node.js runtime because it parses uploaded documents. Keep the API route on a runtime that supports the installed parsing libraries and confirm the hosting platform's request-size and execution-time limits.

## Security and production notes

- Never expose `OPENAI_API_KEY` to the client.
- Enforce Supabase RLS before production use.
- Add rate limiting and abuse monitoring to AI endpoints.
- Consider malware scanning and stricter content validation for uploaded resumes.
- Avoid logging resume contents or other sensitive personal data.
- Validate model output against a schema before presenting it as trusted data.
- Add automated tests for skill scoring, ownership filters, upload validation, and API failure paths.
- Review and pin the model names used by the OpenAI routes before deployment.

## Project structure

```text
skilltrack/
├── app/
│   ├── api/
│   │   ├── ai-career/route.ts
│   │   └── resume-analyze/route.ts
│   ├── jobs/[id]/page.tsx
│   ├── applications/page.tsx
│   ├── ai-assistant/page.tsx
│   ├── resume-analyzer/page.tsx
│   ├── skill-gap/page.tsx
│   ├── recommendations/page.tsx
│   ├── profile/page.tsx
│   ├── skills/page.tsx
│   ├── career-coach/page.tsx
│   ├── interview-coach/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AppShell.tsx
│   └── TopNav.tsx
├── lib/
│   ├── applications.ts
│   ├── jobs.ts
│   ├── skillGap.ts
│   ├── supabase.ts
│   └── text.ts
├── public/
├── package.json
└── next.config.ts
```

## Presentation prototype

The SIH presentation is generated with `scripts/create-deck.cjs` and exported as:

- `SIH_Prototype.pptx`
- `public/SIH Prototype.pptx`

These files are presentation artifacts and are not required to run the web application.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
