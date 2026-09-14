"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Difficulty = "Easy" | "Medium" | "Hard";

type Question = {
  id: number;
  question: string;
  difficulty: Difficulty;
  topic: string;
  expectedPoints: string[];
  keywords: string[];
};

type Evaluation = {
  score: number;
  communication: number;
  technical: number;
  relevance: number;
  strengths: string[];
  improvements: string[];
  missingPoints: string[];
  betterAnswer: string;
};

type CareerData = {
  description: string;
  questions: Question[];
};

const careerData: Record<string, CareerData> = {
  "Frontend Developer": {
    description:
      "Build modern web interfaces using HTML, CSS, JavaScript and frontend frameworks.",
    questions: [
      {
        id: 1,
        question: "What is the difference between let, const and var in JavaScript?",
        difficulty: "Easy",
        topic: "JavaScript",
        expectedPoints: [
          "var is function scoped",
          "let and const are block scoped",
          "const cannot be reassigned",
          "let can be reassigned",
        ],
        keywords: [
          "scope",
          "block",
          "function",
          "reassign",
          "const",
          "let",
          "var",
        ],
      },
      {
        id: 2,
        question: "Explain the difference between == and === in JavaScript.",
        difficulty: "Easy",
        topic: "JavaScript",
        expectedPoints: [
          "== performs type coercion",
          "=== checks value and type",
          "strict equality is safer",
        ],
        keywords: [
          "type",
          "coercion",
          "strict",
          "equality",
          "value",
        ],
      },
      {
        id: 3,
        question: "What is the Virtual DOM in React and why is it useful?",
        difficulty: "Medium",
        topic: "React",
        expectedPoints: [
          "Virtual DOM is an in-memory representation",
          "React compares changes",
          "reconciliation updates the real DOM efficiently",
        ],
        keywords: [
          "virtual dom",
          "react",
          "reconciliation",
          "dom",
          "render",
          "update",
        ],
      },
      {
        id: 4,
        question: "Explain React state and props.",
        difficulty: "Medium",
        topic: "React",
        expectedPoints: [
          "props are passed from parent",
          "state belongs to component",
          "state can change over time",
          "props are generally read-only",
        ],
        keywords: [
          "props",
          "state",
          "parent",
          "component",
          "read-only",
          "change",
        ],
      },
      {
        id: 5,
        question:
          "How would you optimize a React application that has become slow?",
        difficulty: "Hard",
        topic: "Performance",
        expectedPoints: [
          "identify bottlenecks first",
          "memoization",
          "code splitting",
          "lazy loading",
          "avoid unnecessary renders",
        ],
        keywords: [
          "performance",
          "memo",
          "memoization",
          "lazy",
          "code splitting",
          "render",
          "optimization",
        ],
      },
    ],
  },

  "Backend Developer": {
    description:
      "Design APIs, server-side applications, databases and backend services.",
    questions: [
      {
        id: 1,
        question: "What is an API?",
        difficulty: "Easy",
        topic: "Backend Fundamentals",
        expectedPoints: [
          "API is an interface for communication",
          "allows systems to exchange data",
          "HTTP APIs commonly use requests and responses",
        ],
        keywords: [
          "interface",
          "communication",
          "request",
          "response",
          "http",
          "data",
        ],
      },
      {
        id: 2,
        question: "What is the difference between GET and POST?",
        difficulty: "Easy",
        topic: "HTTP",
        expectedPoints: [
          "GET retrieves data",
          "POST sends data",
          "GET parameters may appear in URL",
          "POST commonly sends request body",
        ],
        keywords: [
          "get",
          "post",
          "retrieve",
          "send",
          "body",
          "url",
        ],
      },
      {
        id: 3,
        question: "What is database normalization?",
        difficulty: "Medium",
        topic: "Database",
        expectedPoints: [
          "reduces redundant data",
          "organizes tables",
          "improves data integrity",
        ],
        keywords: [
          "normalization",
          "redundancy",
          "tables",
          "integrity",
          "duplicate",
        ],
      },
      {
        id: 4,
        question: "Explain authentication versus authorization.",
        difficulty: "Medium",
        topic: "Security",
        expectedPoints: [
          "authentication verifies identity",
          "authorization determines permissions",
        ],
        keywords: [
          "authentication",
          "authorization",
          "identity",
          "permission",
          "access",
        ],
      },
      {
        id: 5,
        question:
          "How would you design a backend API that needs to handle very high traffic?",
        difficulty: "Hard",
        topic: "System Design",
        expectedPoints: [
          "horizontal scaling",
          "caching",
          "database optimization",
          "load balancing",
          "monitoring",
        ],
        keywords: [
          "scaling",
          "cache",
          "database",
          "load balancer",
          "monitoring",
          "traffic",
        ],
      },
    ],
  },

  "Full Stack Developer": {
    description:
      "Work across frontend, backend, APIs, databases and deployment.",
    questions: [
      {
        id: 1,
        question: "What happens when you enter a URL in a browser?",
        difficulty: "Easy",
        topic: "Web Fundamentals",
        expectedPoints: [
          "DNS resolves domain",
          "browser establishes connection",
          "HTTP request is sent",
          "server responds",
          "browser renders response",
        ],
        keywords: [
          "dns",
          "browser",
          "request",
          "response",
          "server",
          "http",
        ],
      },
      {
        id: 2,
        question: "What is REST API?",
        difficulty: "Easy",
        topic: "API",
        expectedPoints: [
          "uses HTTP",
          "resources are represented by URLs",
          "stateless communication",
        ],
        keywords: [
          "rest",
          "http",
          "resource",
          "stateless",
          "api",
        ],
      },
      {
        id: 3,
        question: "How does authentication work in a modern web application?",
        difficulty: "Medium",
        topic: "Security",
        expectedPoints: [
          "user identity is verified",
          "session or token is created",
          "protected resources check authentication",
        ],
        keywords: [
          "authentication",
          "session",
          "token",
          "user",
          "protected",
        ],
      },
      {
        id: 4,
        question:
          "How would you connect a React frontend to a Node.js backend?",
        difficulty: "Medium",
        topic: "Full Stack",
        expectedPoints: [
          "frontend sends HTTP requests",
          "backend exposes API endpoints",
          "JSON is commonly exchanged",
          "authentication may protect APIs",
        ],
        keywords: [
          "react",
          "node",
          "api",
          "request",
          "json",
          "backend",
          "frontend",
        ],
      },
      {
        id: 5,
        question:
          "How would you architect a production-ready full stack application?",
        difficulty: "Hard",
        topic: "Architecture",
        expectedPoints: [
          "separate frontend and backend concerns",
          "database design",
          "authentication",
          "caching",
          "monitoring",
          "deployment strategy",
        ],
        keywords: [
          "frontend",
          "backend",
          "database",
          "authentication",
          "cache",
          "monitoring",
          "deployment",
        ],
      },
    ],
  },

  "Data Analyst": {
    description:
      "Turn business data into insights using SQL, Python, Excel and visualization.",
    questions: [
      {
        id: 1,
        question: "What is the difference between mean, median and mode?",
        difficulty: "Easy",
        topic: "Statistics",
        expectedPoints: [
          "mean is arithmetic average",
          "median is middle value",
          "mode is most frequent value",
        ],
        keywords: [
          "mean",
          "median",
          "mode",
          "average",
          "middle",
          "frequency",
        ],
      },
      {
        id: 2,
        question: "What is a SQL JOIN?",
        difficulty: "Easy",
        topic: "SQL",
        expectedPoints: [
          "combines rows from tables",
          "uses related columns",
          "common types include inner and left join",
        ],
        keywords: [
          "join",
          "table",
          "inner",
          "left",
          "columns",
          "combine",
        ],
      },
      {
        id: 3,
        question: "How do you handle missing values in a dataset?",
        difficulty: "Medium",
        topic: "Data Cleaning",
        expectedPoints: [
          "identify missingness",
          "remove rows when appropriate",
          "impute values when appropriate",
          "understand why values are missing",
        ],
        keywords: [
          "missing",
          "null",
          "remove",
          "impute",
          "dataset",
          "clean",
        ],
      },
      {
        id: 4,
        question: "What makes a good data visualization?",
        difficulty: "Medium",
        topic: "Visualization",
        expectedPoints: [
          "clear purpose",
          "appropriate chart",
          "readable labels",
          "avoids unnecessary complexity",
        ],
        keywords: [
          "visualization",
          "chart",
          "labels",
          "clear",
          "data",
        ],
      },
      {
        id: 5,
        question:
          "A company's sales dropped 20%. How would you investigate the reason?",
        difficulty: "Hard",
        topic: "Analytics",
        expectedPoints: [
          "verify data quality",
          "compare periods",
          "segment by product or region",
          "identify patterns",
          "test possible causes",
        ],
        keywords: [
          "sales",
          "data",
          "compare",
          "product",
          "region",
          "trend",
          "cause",
          "segment",
        ],
      },
    ],
  },

  "AI / ML Engineer": {
    description:
      "Build intelligent systems using machine learning, Python and data.",
    questions: [
      {
        id: 1,
        question: "What is supervised learning?",
        difficulty: "Easy",
        topic: "Machine Learning",
        expectedPoints: [
          "uses labeled data",
          "learns relationship between inputs and targets",
          "used for classification and regression",
        ],
        keywords: [
          "supervised",
          "labeled",
          "classification",
          "regression",
          "training",
        ],
      },
      {
        id: 2,
        question: "What is overfitting?",
        difficulty: "Easy",
        topic: "Machine Learning",
        expectedPoints: [
          "model learns training data too closely",
          "performs poorly on unseen data",
          "regularization or more data can help",
        ],
        keywords: [
          "overfitting",
          "training",
          "unseen",
          "generalization",
          "regularization",
        ],
      },
      {
        id: 3,
        question: "What is the purpose of train, validation and test datasets?",
        difficulty: "Medium",
        topic: "ML Workflow",
        expectedPoints: [
          "training learns parameters",
          "validation helps tune model",
          "test evaluates final generalization",
        ],
        keywords: [
          "train",
          "validation",
          "test",
          "model",
          "evaluation",
          "generalization",
        ],
      },
      {
        id: 4,
        question: "Explain precision and recall.",
        difficulty: "Medium",
        topic: "Evaluation",
        expectedPoints: [
          "precision measures correctness of positive predictions",
          "recall measures detected actual positives",
          "tradeoff depends on application",
        ],
        keywords: [
          "precision",
          "recall",
          "positive",
          "prediction",
          "actual",
          "tradeoff",
        ],
      },
      {
        id: 5,
        question:
          "How would you deploy a machine learning model into production?",
        difficulty: "Hard",
        topic: "MLOps",
        expectedPoints: [
          "package model",
          "serve through API or service",
          "monitor performance",
          "track model versions",
          "monitor data drift",
        ],
        keywords: [
          "deploy",
          "model",
          "api",
          "monitor",
          "version",
          "drift",
          "production",
        ],
      },
    ],
  },

  "Cloud / DevOps Engineer": {
    description:
      "Automate deployment, infrastructure, reliability and cloud operations.",
    questions: [
      {
        id: 1,
        question: "What is Docker?",
        difficulty: "Easy",
        topic: "Containers",
        expectedPoints: [
          "containerization technology",
          "packages application and dependencies",
          "provides consistent environments",
        ],
        keywords: [
          "docker",
          "container",
          "image",
          "dependencies",
          "environment",
        ],
      },
      {
        id: 2,
        question: "What is CI/CD?",
        difficulty: "Easy",
        topic: "DevOps",
        expectedPoints: [
          "automates build and testing",
          "continuous integration",
          "continuous delivery or deployment",
        ],
        keywords: [
          "ci",
          "cd",
          "continuous",
          "build",
          "test",
          "deploy",
        ],
      },
      {
        id: 3,
        question: "What is the difference between a container and a virtual machine?",
        difficulty: "Medium",
        topic: "Infrastructure",
        expectedPoints: [
          "VM includes guest operating system",
          "containers share host kernel",
          "containers are generally lighter",
        ],
        keywords: [
          "container",
          "virtual machine",
          "vm",
          "kernel",
          "operating system",
        ],
      },
      {
        id: 4,
        question: "What is load balancing?",
        difficulty: "Medium",
        topic: "Networking",
        expectedPoints: [
          "distributes traffic",
          "uses multiple servers",
          "improves availability and scalability",
        ],
        keywords: [
          "load balancing",
          "traffic",
          "server",
          "availability",
          "scaling",
        ],
      },
      {
        id: 5,
        question:
          "How would you design a highly available cloud application?",
        difficulty: "Hard",
        topic: "Cloud Architecture",
        expectedPoints: [
          "multiple availability zones",
          "load balancing",
          "auto scaling",
          "database redundancy",
          "monitoring",
        ],
        keywords: [
          "availability",
          "zones",
          "load balancer",
          "scaling",
          "database",
          "monitoring",
        ],
      },
    ],
  },

  "Cybersecurity Engineer": {
    description:
      "Protect applications, networks, systems and data from security threats.",
    questions: [
      {
        id: 1,
        question: "What is phishing?",
        difficulty: "Easy",
        topic: "Security Fundamentals",
        expectedPoints: [
          "social engineering attack",
          "tricks users into revealing information",
          "often uses fake messages or websites",
        ],
        keywords: [
          "phishing",
          "social engineering",
          "fake",
          "credential",
          "email",
        ],
      },
      {
        id: 2,
        question: "What is the difference between authentication and authorization?",
        difficulty: "Easy",
        topic: "Security",
        expectedPoints: [
          "authentication verifies identity",
          "authorization controls permissions",
        ],
        keywords: [
          "authentication",
          "authorization",
          "identity",
          "permission",
          "access",
        ],
      },
      {
        id: 3,
        question: "What is SQL injection?",
        difficulty: "Medium",
        topic: "Web Security",
        expectedPoints: [
          "malicious SQL input",
          "targets vulnerable database queries",
          "parameterized queries help prevent it",
        ],
        keywords: [
          "sql injection",
          "database",
          "query",
          "parameterized",
          "input",
        ],
      },
      {
        id: 4,
        question: "What is the principle of least privilege?",
        difficulty: "Medium",
        topic: "Security Architecture",
        expectedPoints: [
          "give only necessary permissions",
          "limits attack impact",
          "reduces unnecessary access",
        ],
        keywords: [
          "least privilege",
          "permission",
          "access",
          "minimum",
          "security",
        ],
      },
      {
        id: 5,
        question:
          "A production server is compromised. What would you do first?",
        difficulty: "Hard",
        topic: "Incident Response",
        expectedPoints: [
          "contain incident",
          "preserve evidence",
          "investigate logs",
          "identify attack vector",
          "recover securely",
        ],
        keywords: [
          "contain",
          "evidence",
          "logs",
          "investigate",
          "attack",
          "recover",
          "incident",
        ],
      },
    ],
  },

  "UI/UX Designer": {
    description:
      "Design intuitive digital experiences through research, wireframes and prototypes.",
    questions: [
      {
        id: 1,
        question: "What is the difference between UI and UX?",
        difficulty: "Easy",
        topic: "Design Fundamentals",
        expectedPoints: [
          "UI focuses on interface",
          "UX focuses on overall user experience",
          "both work together",
        ],
        keywords: [
          "ui",
          "ux",
          "interface",
          "experience",
          "user",
        ],
      },
      {
        id: 2,
        question: "What is a wireframe?",
        difficulty: "Easy",
        topic: "Design Process",
        expectedPoints: [
          "basic layout",
          "focuses on structure",
          "used before detailed visual design",
        ],
        keywords: [
          "wireframe",
          "layout",
          "structure",
          "design",
        ],
      },
      {
        id: 3,
        question: "Why is user research important?",
        difficulty: "Medium",
        topic: "UX Research",
        expectedPoints: [
          "understands user needs",
          "identifies pain points",
          "reduces assumptions",
        ],
        keywords: [
          "research",
          "user",
          "needs",
          "pain points",
          "feedback",
        ],
      },
      {
        id: 4,
        question: "What makes a good mobile app interface?",
        difficulty: "Medium",
        topic: "Mobile UX",
        expectedPoints: [
          "clear hierarchy",
          "simple navigation",
          "readability",
          "consistent interaction",
        ],
        keywords: [
          "navigation",
          "hierarchy",
          "mobile",
          "readability",
          "consistent",
        ],
      },
      {
        id: 5,
        question:
          "How would you redesign a product that users find confusing?",
        difficulty: "Hard",
        topic: "Product Design",
        expectedPoints: [
          "conduct research",
          "identify usability problems",
          "create alternatives",
          "prototype",
          "test with users",
        ],
        keywords: [
          "research",
          "usability",
          "prototype",
          "test",
          "users",
          "feedback",
        ],
      },
    ],
  },
};

function normalizeAnswer(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s+#./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function evaluateAnswer(
  answer: string,
  question: Question
): Evaluation {
  const normalized = normalizeAnswer(answer);

  if (!normalized) {
    return {
      score: 0,
      communication: 0,
      technical: 0,
      relevance: 0,
      strengths: ["No answer was submitted."],
      improvements: [
        "Try answering the question before viewing the evaluation.",
      ],
      missingPoints: question.expectedPoints,
      betterAnswer:
        "Start with a direct definition, then explain the important concepts and give a short practical example.",
    };
  }

  const words = normalized.split(" ").filter(Boolean);
  const wordCount = words.length;

  const matchedKeywords = question.keywords.filter((keyword) =>
    normalized.includes(keyword.toLowerCase())
  );

  const keywordRatio =
    question.keywords.length > 0
      ? matchedKeywords.length / question.keywords.length
      : 0;

  const pointMatches = question.expectedPoints.filter((point) => {
    const importantWords = point
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 4);

    const hits = importantWords.filter((word) =>
      normalized.includes(word)
    ).length;

    return hits >= Math.max(1, Math.ceil(importantWords.length * 0.4));
  });

  const technical = Math.min(
    100,
    Math.round(
      keywordRatio * 65 +
        (pointMatches.length /
          Math.max(1, question.expectedPoints.length)) *
          35
    )
  );

  const communication = Math.min(
    100,
    Math.round(
      (wordCount >= 25 ? 45 : (wordCount / 25) * 45) +
        (normalized.includes(".") ? 10 : 0) +
        (wordCount >= 60 ? 25 : 10) +
        (wordCount >= 100 ? 20 : 10)
    )
  );

  const relevance = Math.min(
    100,
    Math.round(
      keywordRatio * 70 +
        Math.min(30, wordCount >= 20 ? 30 : wordCount)
    )
  );

  const score = Math.round(
    technical * 0.5 +
      communication * 0.2 +
      relevance * 0.3
  );

  const strengths: string[] = [];

  if (wordCount >= 30) {
    strengths.push(
      "Your answer contains enough detail to evaluate your understanding."
    );
  }

  if (matchedKeywords.length >= 2) {
    strengths.push(
      `You correctly used relevant concepts such as ${matchedKeywords
        .slice(0, 3)
        .join(", ")}.`
    );
  }

  if (pointMatches.length >= 2) {
    strengths.push(
      "You covered multiple important points expected in a strong answer."
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "You attempted the question, which gives a useful starting point."
    );
  }

  const improvements: string[] = [];

  if (wordCount < 25) {
    improvements.push(
      "Give a more complete answer with a definition, explanation and example."
    );
  }

  if (technical < 60) {
    improvements.push(
      "Include more technical concepts directly related to the question."
    );
  }

  if (relevance < 60) {
    improvements.push(
      "Keep the answer focused on the exact question being asked."
    );
  }

  if (communication < 60) {
    improvements.push(
      "Structure your answer more clearly instead of giving very short points."
    );
  }

  if (improvements.length === 0) {
    improvements.push(
      "Good response. Add a practical example to make the answer even stronger."
    );
  }

  const missingPoints = question.expectedPoints.filter(
    (point) => !pointMatches.includes(point)
  );

  const betterAnswer =
    question.expectedPoints
      .slice(0, 4)
      .map((point) => point)
      .join(". ") +
    ".";

  return {
    score,
    communication,
    technical,
    relevance,
    strengths,
    improvements,
    missingPoints,
    betterAnswer,
  };
}

export default function InterviewCoachPage() {
  const [career, setCareer] = useState(
    "Frontend Developer"
  );

  const [difficulty, setDifficulty] =
    useState<Difficulty>("Medium");

  const [questionIndex, setQuestionIndex] =
    useState(0);

  const [answer, setAnswer] = useState("");

  const [evaluation, setEvaluation] =
    useState<Evaluation | null>(null);

  const [scores, setScores] = useState<number[]>([]);

  const [started, setStarted] = useState(false);

  const [showHint, setShowHint] = useState(false);

  const [sessionComplete, setSessionComplete] =
    useState(false);

  const currentQuestions = useMemo(() => {
    const data =
      careerData[career]?.questions || [];

    const filtered = data.filter(
      (question) =>
        question.difficulty === difficulty
    );

    return filtered.length > 0 ? filtered : data;
  }, [career, difficulty]);

  const currentQuestion =
    currentQuestions[questionIndex] ||
    currentQuestions[0];

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (sum, score) => sum + score,
            0
          ) / scores.length
        )
      : 0;

  const readiness = Math.min(
    100,
    Math.round(
      averageScore * 0.8 +
        Math.min(20, scores.length * 4)
    )
  );

  const performanceLabel =
    readiness >= 80
      ? "Interview Ready"
      : readiness >= 60
        ? "Almost Ready"
        : readiness >= 40
          ? "Needs Practice"
          : "Beginner Stage";

  useEffect(() => {
    const saved = localStorage.getItem(
      "skilltrack_interview_scores"
    );

    if (saved) {
      try {
        setScores(JSON.parse(saved));
      } catch {
        setScores([]);
      }
    }
  }, []);

  function startSession() {
    setQuestionIndex(0);
    setAnswer("");
    setEvaluation(null);
    setSessionComplete(false);
    setShowHint(false);
    setStarted(true);
  }

  function changeCareer(value: string) {
    setCareer(value);
    setQuestionIndex(0);
    setAnswer("");
    setEvaluation(null);
    setSessionComplete(false);
    setShowHint(false);
  }

  function changeDifficulty(
    value: Difficulty
  ) {
    setDifficulty(value);
    setQuestionIndex(0);
    setAnswer("");
    setEvaluation(null);
    setSessionComplete(false);
    setShowHint(false);
  }

  function submitAnswer() {
    if (!currentQuestion || !answer.trim()) {
      return;
    }

    const result = evaluateAnswer(
      answer,
      currentQuestion
    );

    setEvaluation(result);

    const updatedScores = [
      ...scores,
      result.score,
    ];

    setScores(updatedScores);

    localStorage.setItem(
      "skilltrack_interview_scores",
      JSON.stringify(updatedScores)
    );
  }

  function nextQuestion() {
    if (
      questionIndex >=
      currentQuestions.length - 1
    ) {
      setSessionComplete(true);
      return;
    }

    setQuestionIndex(
      (previous) => previous + 1
    );

    setAnswer("");
    setEvaluation(null);
    setShowHint(false);
  }

  function restartSession() {
    setQuestionIndex(0);
    setAnswer("");
    setEvaluation(null);
    setSessionComplete(false);
    setShowHint(false);
    setScores([]);
    localStorage.removeItem(
      "skilltrack_interview_scores"
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* NAVBAR */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Skill<span className="text-cyan-400">
              Track
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
            <Link
              href="/"
              className="text-slate-400 hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="text-slate-400 hover:text-white"
            >
              Profile
            </Link>

            <Link
              href="/jobs"
              className="text-slate-400 hover:text-white"
            >
              Jobs
            </Link>

            <Link
              href="/skill-gap"
              className="text-slate-400 hover:text-white"
            >
              Skill Gap
            </Link>

            <Link
              href="/recommendations"
              className="text-slate-400 hover:text-white"
            >
              AI Career
            </Link>

            <Link
              href="/career-coach"
              className="text-slate-400 hover:text-white"
            >
              Career Coach
            </Link>

            <Link
              href="/resume-analyzer"
              className="text-slate-400 hover:text-white"
            >
              Resume AI
            </Link>

            <Link
              href="/interview-coach"
              className="font-bold text-cyan-400"
            >
              Interview
            </Link>

            <Link
              href="/applications"
              className="text-slate-400 hover:text-white"
            >
              Applications
            </Link>
          </nav>

          <Link
            href="/jobs"
            className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950"
          >
            Find Jobs
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {/* HERO */}

        <section className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-[#101d35] to-purple-500/10 p-7 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                âœ¦ AI Interview Intelligence
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Practice.
                <br />
                <span className="text-cyan-400">
                  Perform.
                </span>
                <br />
                Get hired.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
                Practice role-specific interview questions and receive
                instant feedback on technical knowledge, relevance and
                communication.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Interview readiness
              </p>

              <p className="mt-3 text-6xl font-black text-cyan-400">
                {readiness}%
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-400">
                {performanceLabel}
              </p>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all"
                  style={{
                    width: `${readiness}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SETUP */}

        <section className="mt-7 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#0c1a2d] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
              Target Role
            </p>

            <select
              value={career}
              onChange={(event) =>
                changeCareer(event.target.value)
              }
              className="mt-4 w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-400"
            >
              {Object.keys(careerData).map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              {careerData[career]?.description}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0c1a2d] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
              Difficulty
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(
                [
                  "Easy",
                  "Medium",
                  "Hard",
                ] as Difficulty[]
              ).map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    changeDifficulty(item)
                  }
                  className={`rounded-xl px-3 py-3 text-xs font-bold transition ${
                    difficulty === item
                      ? item === "Easy"
                        ? "bg-emerald-400 text-slate-950"
                        : item === "Medium"
                          ? "bg-yellow-400 text-slate-950"
                          : "bg-red-400 text-white"
                      : "bg-white/5 text-slate-500 hover:bg-white/10"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs text-slate-600">
              {currentQuestions.length} questions available
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Session
            </p>

            <p className="mt-3 text-4xl font-black">
              {scores.length}
            </p>

            <p className="text-sm text-slate-500">
              questions evaluated
            </p>

            <button
              onClick={startSession}
              className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-300"
            >
              {started
                ? "Restart Interview"
                : "Start Interview â†’"}
            </button>
          </div>
        </section>

        {/* INTERVIEW */}

        {started && !sessionComplete && currentQuestion && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* QUESTION */}

            <div className="rounded-3xl border border-white/10 bg-[#0c1a2d] p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                    Question{" "}
                    {questionIndex + 1} /{" "}
                    {currentQuestions.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-600">
                    Topic: {currentQuestion.topic}
                  </p>
                </div>

                <span
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                    currentQuestion.difficulty ===
                    "Easy"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : currentQuestion.difficulty ===
                          "Medium"
                        ? "bg-yellow-400/10 text-yellow-300"
                        : "bg-red-400/10 text-red-300"
                  }`}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>

              <h2 className="mt-7 text-2xl font-black leading-relaxed md:text-3xl">
                {currentQuestion.question}
              </h2>

              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-bold">
                    Your Answer
                  </label>

                  <span className="text-xs text-slate-600">
                    {answer.trim()
                      ? answer.trim().split(/\s+/)
                          .length
                      : 0}{" "}
                    words
                  </span>
                </div>

                <textarea
                  value={answer}
                  onChange={(event) =>
                    setAnswer(event.target.value)
                  }
                  placeholder="Type your interview answer here..."
                  className="min-h-[240px] w-full resize-none rounded-2xl border border-white/10 bg-[#07111f] p-5 text-sm leading-7 text-white outline-none placeholder:text-slate-700 focus:border-cyan-400/50"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setShowHint(!showHint)
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/10"
                >
                  ðŸ’¡ {showHint ? "Hide Hint" : "Show Hint"}
                </button>

                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim()}
                  className="ml-auto rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Evaluate Answer â†’
                </button>
              </div>

              {showHint && (
                <div className="mt-5 rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
                    Interview Hint
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Try to explain the concept clearly, mention the key
                    technical terms and give a practical example.
                  </p>
                </div>
              )}
            </div>

            {/* SIDE PANEL */}

            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-[#0c1a2d] p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
                  Interview Strategy
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    "Start with a direct answer.",
                    "Explain the important concept.",
                    "Give a practical example.",
                    "Mention trade-offs when relevant.",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <span className="font-black text-cyan-400">
                        0{index + 1}
                      </span>

                      <span className="text-xs leading-5 text-slate-500">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0c1a2d] p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Session Stats
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/[0.03] p-4">
                    <p className="text-xs text-slate-600">
                      Average
                    </p>

                    <p className="mt-1 text-2xl font-black text-cyan-400">
                      {averageScore}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] p-4">
                    <p className="text-xs text-slate-600">
                      Answered
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      {scores.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* EVALUATION */}

        {evaluation && !sessionComplete && (
          <section className="mt-7">
            <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-[#0c1a2d] to-purple-500/5 p-6 md:p-8">
              <div className="flex flex-col gap-7 lg:flex-row">
                <div className="flex shrink-0 flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/10 p-7 lg:w-52">
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Score
                  </p>

                  <p className="mt-2 text-6xl font-black text-cyan-400">
                    {evaluation.score}
                  </p>

                  <p className="text-sm text-slate-500">
                    / 100
                  </p>
                </div>

                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                    AI Evaluation
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Here is how you performed
                  </h2>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/[0.03] p-4">
                      <p className="text-xs text-slate-600">
                        Technical
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {evaluation.technical}%
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/[0.03] p-4">
                      <p className="text-xs text-slate-600">
                        Relevance
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {evaluation.relevance}%
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/[0.03] p-4">
                      <p className="text-xs text-slate-600">
                        Communication
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {evaluation.communication}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Strengths
                  </p>

                  <div className="mt-4 space-y-3">
                    {evaluation.strengths.map(
                      (item) => (
                        <div
                          key={item}
                          className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4 text-sm leading-6 text-slate-400"
                        >
                          âœ“ {item}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
                    Improve
                  </p>

                  <div className="mt-4 space-y-3">
                    {evaluation.improvements.map(
                      (item) => (
                        <div
                          key={item}
                          className="rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-4 text-sm leading-6 text-slate-400"
                        >
                          ! {item}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-400">
                    Missing Points
                  </p>

                  <div className="mt-4 space-y-3">
                    {evaluation.missingPoints
                      .slice(0, 4)
                      .map((item) => (
                        <div
                          key={item}
                          className="rounded-xl border border-red-400/10 bg-red-400/5 p-4 text-sm leading-6 text-slate-400"
                        >
                          + {item}
                        </div>
                      ))}

                    {evaluation.missingPoints.length ===
                      0 && (
                      <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4 text-sm text-emerald-300">
                        Excellent coverage!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-purple-400/10 bg-purple-400/5 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                  Better Answer Structure
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {evaluation.betterAnswer}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={nextQuestion}
                  className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300"
                >
                  {questionIndex >=
                  currentQuestions.length - 1
                    ? "Finish Interview â†’"
                    : "Next Question â†’"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* COMPLETE */}

        {sessionComplete && (
          <section className="mt-8 rounded-[32px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-[#0c1a2d] to-purple-500/10 p-7 text-center md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-400/10 text-4xl">
              ðŸ†
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              Interview Complete
            </p>

            <h2 className="mt-3 text-4xl font-black">
              {performanceLabel}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              You completed the {difficulty.toLowerCase()} interview session
              for {career}.
            </p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <p className="text-xs text-slate-600">
                  Average Score
                </p>

                <p className="mt-2 text-4xl font-black text-cyan-400">
                  {averageScore}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <p className="text-xs text-slate-600">
                  Readiness
                </p>

                <p className="mt-2 text-4xl font-black text-purple-300">
                  {readiness}%
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <p className="text-xs text-slate-600">
                  Questions
                </p>

                <p className="mt-2 text-4xl font-black">
                  {currentQuestions.length}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={restartSession}
                className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950"
              >
                Practice Again
              </button>

              <Link
                href="/jobs"
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold"
              >
                Find Jobs
              </Link>

              <Link
                href="/resume-analyzer"
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold"
              >
                Improve Resume
              </Link>
            </div>
          </section>
        )}

        {/* FINAL CTA */}

        <section className="mt-10 rounded-3xl border border-white/10 bg-[#0c1a2d] p-7 md:p-9">
          <div className="grid gap-7 md:grid-cols-3">
            <div>
              <p className="text-3xl">
                ðŸŽ¯
              </p>

              <h3 className="mt-4 font-black">
                Know your gaps
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use Skill Gap to discover which skills need improvement.
              </p>
            </div>

            <div>
              <p className="text-3xl">
                ðŸ“„
              </p>

              <h3 className="mt-4 font-black">
                Improve your resume
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Analyze your resume before applying.
              </p>
            </div>

            <div>
              <p className="text-3xl">
                ðŸš€
              </p>

              <h3 className="mt-4 font-black">
                Apply confidently
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Practice first, then apply to your strongest job matches.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-white/10 py-7 text-center text-xs text-slate-600">
          SkillTrack â€¢ AI Interview Intelligence
        </footer>
      </div>
    </main>
  );
}
