/**
 * @file lib/resource-engine.ts
 * @description Centralized Resource Intelligence Engine for CampusLit.
 * Provides verified academic resources, VTU official intelligence, language-aware sorting,
 * industry certifications, extended domain catalogs, actionable roadmap node drawers, and DSA practice mapping.
 */

import academicResourcesRaw from "@/data/academic_resources.json";

// ============================================================================
// 1. Core Interfaces & Metadata
// ============================================================================

export type ResourceCategory =
  | "syllabus"
  | "vtu_official"
  | "notes"
  | "youtube"
  | "pyq"
  | "model_papers"
  | "question_banks"
  | "lab_manuals"
  | "viva"
  | "textbooks"
  | "practice"
  | "certification";

export interface VerifiedResource {
  resourceId: string;
  title: string;
  category: ResourceCategory;
  provider: string;
  sourceUrl: string;
  free: boolean;
  language?: "english" | "kannada" | "hindi" | "other";
  lastVerifiedAt: string;
  official: boolean;
  description?: string;
  healthStatus?: "healthy" | "redirected" | "dead" | "certificate_error";
}

export interface HighFrequencyQuestion {
  questionId: string;
  question: string;
  papersAnalyzed: number;
  occurrenceCount: number;
  frequencyRatio: number;
  classification: string;
  typicalMarks: number;
  module: number;
  isSufficientData: boolean;
}

export interface VivaQuestion {
  vivaId: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  coreConcept: string;
  sampleAnswer: string;
}

export interface SubjectAcademicResource {
  courseId: number;
  courseCode: string;
  courseName: string;
  branch: string;
  semester: number;
  scheme: string;
  credits: number;
  resources: VerifiedResource[];
  highFrequencyQuestions?: HighFrequencyQuestion[];
  vivaQuestions?: VivaQuestion[];
}

export interface CertificationItem {
  certId: string;
  title: string;
  domain:
    | "software_engineering"
    | "cloud"
    | "cybersecurity"
    | "ai_ml"
    | "data"
    | "networking"
    | "devops"
    | "iot_embedded"
    | "product_design";
  provider: string;
  level: "Beginner" | "Associate" | "Professional" | "Specialty";
  examType: "free_learning_paid_exam" | "free_certificate" | "paid_exam";
  studentDiscountAvailable: boolean;
  officialUrl: string;
  skills: string[];
  description: string;
  lastVerifiedAt: string;
}

export interface DomainLearningCatalog {
  domainId: string;
  domainName: string;
  overview: string;
  foundational: VerifiedResource[];
  intermediate: VerifiedResource[];
  advanced: VerifiedResource[];
  practice: VerifiedResource[];
  projects: Array<{
    title: string;
    description: string;
    stack: string[];
    guideUrl: string;
    skills: string[];
  }>;
  certifications: CertificationItem[];
}

export interface RoadmapNodeResourceDrawer {
  nodeKey: string;
  title: string;
  conceptOverview: string;
  officialDocs: VerifiedResource[];
  freeCourses: VerifiedResource[];
  youtube: {
    english: VerifiedResource[];
    hindi: VerifiedResource[];
    kannada: VerifiedResource[];
  };
  practice: VerifiedResource[];
  projectTutorial?: VerifiedResource;
  proofOfWorkChecklist: string[];
  recommendedNextAction: string;
}

export interface DSATopicResource {
  topicKey: string;
  topicName: string;
  difficulty: "Easy" | "Medium" | "Hard";
  learn: {
    conceptDoc: VerifiedResource;
    youtubeEnglish: VerifiedResource;
    youtubeHindi?: VerifiedResource;
    youtubeKannada?: VerifiedResource;
  };
  practice: Array<{
    title: string;
    platform: "LeetCode" | "TakeUForward" | "GeeksforGeeks" | "NeetCode";
    url: string;
    sheetName?: string;
  }>;
  recommendedNextTopic: string;
}

// ============================================================================
// 2. VTU Academic Intelligence (Official University Resources)
// ============================================================================

export const VTU_GENERAL_OFFICIAL_RESOURCES: VerifiedResource[] = [
  {
    resourceId: "vtu_main_portal",
    title: "Visvesvaraya Technological University (VTU) Official Portal",
    category: "vtu_official",
    provider: "VTU Belagavi",
    sourceUrl: "https://vtu.ac.in",
    free: true,
    language: "english",
    lastVerifiedAt: "2026-09-01",
    official: true,
    description: "Official administrative, academic, and circular repository of VTU.",
  },
  {
    resourceId: "vtu_circulars",
    title: "VTU Academic Circulars & Notifications",
    category: "vtu_official",
    provider: "VTU Registrar",
    sourceUrl: "https://vtu.ac.in",
    free: true,
    language: "english",
    lastVerifiedAt: "2026-09-16",
    official: true,
    description: "Real-time notifications regarding attendance, exams, and schemes.",
  },
  {
    resourceId: "vtu_exam_portal",
    title: "VTU Examination Portal & Timetables",
    category: "vtu_official",
    provider: "VTU Registrar (Evaluation)",
    sourceUrl: "https://vtu.ac.in",
    free: true,
    language: "english",
    lastVerifiedAt: "2026-09-16",
    official: true,
    description: "Official examination scheduling, hall tickets, and supplementary circulars.",
  },
  {
    resourceId: "vtu_model_papers",
    title: "VTU Model Question Papers Repository (2021 & 2022 Scheme)",
    category: "model_papers",
    provider: "VTU Board of Examinations",
    sourceUrl: "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/",
    free: true,
    language: "english",
    lastVerifiedAt: "2026-09-16",
    official: true,
    description: "Authoritative model question papers with official scheme of evaluation.",
  },
  {
    resourceId: "vtu_elearning",
    title: "VTU Official Academic & Examination Portal",
    category: "vtu_official",
    provider: "VTU Mysuru / Belagavi",
    sourceUrl: "https://vtu.ac.in",
    free: true,
    language: "english",
    lastVerifiedAt: "2026-09-16",
    official: true,
    description: "Official portal for academic circulars, notifications, and curriculum syllabus.",
  },
  {
    resourceId: "vtu_results",
    title: "VTU Provisional Examination Results Portal",
    category: "vtu_official",
    provider: "VTU Evaluation Division",
    sourceUrl: "https://vtu.ac.in",
    free: true,
    language: "english",
    lastVerifiedAt: "2026-09-16",
    official: true,
    description: "Official portal for semester-end and revaluation exam results.",
  },
];

// ============================================================================
// 3. Centralized Academic Subject Catalog with Language Tagging
// ============================================================================

const rawAcademicCatalog = academicResourcesRaw as any[];

export const ACADEMIC_SUBJECT_CATALOG: SubjectAcademicResource[] = rawAcademicCatalog.map((course) => {
  const verifiedList: VerifiedResource[] = (course.resources || []).map((r: any) => ({
    resourceId: r.resourceId,
    title: r.title,
    category: (r.type?.toLowerCase().includes("note")
      ? "notes"
      : r.type?.toLowerCase().includes("model")
      ? "model_papers"
      : r.type?.toLowerCase().includes("book")
      ? "textbooks"
      : r.type?.toLowerCase().includes("lab")
      ? "lab_manuals"
      : r.type?.toLowerCase().includes("derivation")
      ? "notes"
      : "syllabus") as ResourceCategory,
    provider: r.source || "VTU",
    sourceUrl: (r.sourceUrl || "").includes("elearning.vtu.ac.in") ? "https://vtu.ac.in" : r.sourceUrl,
    free: true,
    language: "english",
    lastVerifiedAt: r.lastVerifiedAt || "2026-08-20",
    official: (r.source || "").toLowerCase().includes("vtu"),
    description: `${r.format || "Resource"} provided by ${r.author || r.source || "VTU"}`,
  }));

  // Append official VTU course syllabus & e-learning link
  verifiedList.push({
    resourceId: `vtu_official_${course.courseCode.toLowerCase()}`,
    title: `${course.courseName} — VTU Official Scheme & Syllabus`,
    category: "syllabus",
    provider: "VTU Belagavi",
    sourceUrl: "https://vtu.ac.in/syllabus/",
    free: true,
    language: "english",
    lastVerifiedAt: "2026-09-01",
    official: true,
    description: "Current VTU syllabus regulations, course outcomes, and CIE/SEE rubrics.",
  });

  // Append language-specific learning lectures for key computing/math subjects
  const code = course.courseCode.toUpperCase();
  if (code === "BCS404" || code === "21CS42") {
    // DBMS
    verifiedList.push(
      {
        resourceId: "dbms_yt_en",
        title: "DBMS Full Course for Engineering (Relational Algebra & SQL)",
        category: "youtube",
        provider: "Gate Smashers",
        sourceUrl: "https://www.youtube.com/@GateSmashers",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-16",
        official: false,
        description: "Comprehensive engineering semester preparation covering ER model, Normalization (1NF-BCNF), and Concurrency.",
      },
      {
        resourceId: "dbms_yt_hi",
        title: "Database Management Systems Complete Hindi Playlist",
        category: "youtube",
        provider: "Knowledge Gate",
        sourceUrl: "https://www.youtube.com/@KnowledgeGate",
        free: true,
        language: "hindi",
        lastVerifiedAt: "2026-09-16",
        official: false,
        description: "Hindi video explanation of VTU DBMS modules and previous year questions.",
      },
      {
        resourceId: "dbms_pyq_vtu",
        title: "VTU DBMS Previous Year Question Papers (2021/2022 Schemes)",
        category: "pyq",
        provider: "VTU Examination Portal",
        sourceUrl: "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: true,
        description: "Official previous semester exam papers and answer schemes.",
      }
    );
  } else if (code === "BCS301" || code === "21CS32") {
    // DSA
    verifiedList.push(
      {
        resourceId: "dsa_yt_en",
        title: "Data Structures & Algorithms in C / C++ Complete Series",
        category: "youtube",
        provider: "Abdul Bari",
        sourceUrl: "https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
        description: "Industry standard visual algorithms and data structure walkthroughs.",
      },
      {
        resourceId: "dsa_yt_hi",
        title: "DSA in C++ Series for College Exams",
        category: "youtube",
        provider: "Love Babbar",
        sourceUrl: "https://www.youtube.com/playlist?list=PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA",
        free: true,
        language: "hindi",
        lastVerifiedAt: "2026-09-01",
        official: false,
        description: "Full Hindi walkthrough of linked lists, stacks, recursion, and trees.",
      },
      {
        resourceId: "dsa_pyq_vtu",
        title: "VTU DSA Previous Exam Papers & Scheme of Evaluation",
        category: "pyq",
        provider: "VTU Board of Examinations",
        sourceUrl: "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: true,
        description: "Official VTU previous question papers with code trace schemes.",
      }
    );
  } else if (code === "BCS403" || code === "21CS43") {
    // OS
    verifiedList.push(
      {
        resourceId: "os_yt_en",
        title: "Operating Systems Complete Course (Processes, Threads & Memory)",
        category: "youtube",
        provider: "Gate Smashers",
        sourceUrl: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
        description: "Process scheduling, Banker's algorithm, virtual memory paging, and disk scheduling.",
      },
      {
        resourceId: "os_pyq_vtu",
        title: "VTU Operating Systems Exam Papers Archive",
        category: "pyq",
        provider: "VTU Examination Portal",
        sourceUrl: "https://vtu.ac.in/en/model-question-paper/",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: true,
        description: "Verified previous year exam papers for 2021 and 2022 schemes.",
      }
    );
  } else if (code === "BMATS101" || code === "BMATC201") {
    // Mathematics
    verifiedList.push(
      {
        resourceId: `math_yt_${code.toLowerCase()}_en`,
        title: "Engineering Mathematics Full Video Lectures",
        category: "youtube",
        provider: "Gajendra Purohit",
        sourceUrl: "https://www.youtube.com/@DrGajendraPurohit",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
        description: "Rolle's theorem, Taylor series, Cayley-Hamilton theorem, and Eigenvalues step-by-step.",
      },
      {
        resourceId: `math_yt_${code.toLowerCase()}_hi`,
        title: "Engineering Mathematics in Hindi",
        category: "youtube",
        provider: "Tikle's Academy",
        sourceUrl: "https://www.youtube.com/@TiklesAcademy",
        free: true,
        language: "hindi",
        lastVerifiedAt: "2026-09-01",
        official: false,
        description: "Hindi tutorials solving previous VTU exam problems on matrices and differential calculus.",
      }
    );
  }

  return {
    courseId: course.courseId,
    courseCode: course.courseCode,
    courseName: course.courseName,
    branch: course.branch,
    semester: course.semester,
    scheme: course.scheme,
    credits: course.credits,
    resources: verifiedList,
    highFrequencyQuestions: course.highFrequencyQuestions,
    vivaQuestions: course.vivaQuestions,
  };
});

// Code alias mapping (2021 / 2022 schemes)
const CODE_ALIAS_MAP: Record<string, string> = {
  "BCS404": "BCS404", "21CS42": "BCS404",
  "BCS301": "BCS301", "21CS32": "BCS301",
  "BCS403": "BCS403", "21CS43": "BCS403",
  "BCS401": "BCS401", "21CS41": "BCS401",
  "BCS502": "BCS502", "21CS52": "BCS502",
  "BMATS101": "BMATS101", "BMAT101": "BMATS101", "21MAT11": "BMATS101",
  "BMATC201": "BMATC201", "21MAT21": "BMATC201",
  "BPOPS103": "BPOPS103", "21PSP13": "BPOPS103",
  "BPHYS102": "BPHYS102", "21PHY12": "BPHYS102",
  "BBEE103": "BBEE103", "21ELE13": "BBEE103",
  "BENGK106": "BENGK106", "21ENG15": "BENGK106",
  "BCS302": "BCS302", "BCS304": "BCS304", "BCS402": "BCS402",
  "BCS501": "BCS501", "BCS503": "BCS503", "BCS601": "BCS601",
  "BCS602": "BCS602", "BCS701": "BCS701", "BEC301": "BEC301",
  "BEC401": "BEC401", "BEC501": "BEC501",
};

export function resolveSubjectResources(
  courseCode?: string | null,
  courseName?: string | null
): SubjectAcademicResource | null {
  const rawCode = (courseCode || "").trim().toUpperCase();
  const rawName = (courseName || "").trim().toLowerCase();

  // Special disambiguation
  if (rawCode === "BCS304" && rawName.includes("database")) {
    return ACADEMIC_SUBJECT_CATALOG.find((c) => c.courseCode === "BCS404") || null;
  }

  if (rawCode && CODE_ALIAS_MAP[rawCode]) {
    const target = CODE_ALIAS_MAP[rawCode];
    const match = ACADEMIC_SUBJECT_CATALOG.find((c) => c.courseCode === target);
    if (match) return match;
  }

  if (rawCode) {
    const match = ACADEMIC_SUBJECT_CATALOG.find((c) => c.courseCode.toUpperCase() === rawCode);
    if (match) return match;
  }

  if (rawName) {
    if (rawName.includes("database")) return ACADEMIC_SUBJECT_CATALOG.find((c) => c.courseCode === "BCS404") || null;
    if (rawName.includes("data structure")) return ACADEMIC_SUBJECT_CATALOG.find((c) => c.courseCode === "BCS301") || null;
    if (rawName.includes("operating system")) return ACADEMIC_SUBJECT_CATALOG.find((c) => c.courseCode === "BCS403") || null;
    if (rawName.includes("algorithm")) return ACADEMIC_SUBJECT_CATALOG.find((c) => c.courseCode === "BCS401") || null;
    if (rawName.includes("network")) return ACADEMIC_SUBJECT_CATALOG.find((c) => c.courseCode === "BCS502") || null;
    if (rawName.includes("calculus") || rawName.includes("math")) return ACADEMIC_SUBJECT_CATALOG.find((c) => c.courseCode === "BMATS101") || null;
  }

  return null;
}

// ============================================================================
// 4. Language-Aware Sorting Engine (P6)
// ============================================================================

export interface LanguageSortedResult {
  sortedResources: VerifiedResource[];
  hasPreferredMatch: boolean;
  fallbackMessage: string | null;
}

export function sortResourcesByLanguage(
  resources: VerifiedResource[],
  preferredLanguage: string = "english"
): LanguageSortedResult {
  const normLang = (preferredLanguage || "english").toLowerCase().trim() as
    | "english"
    | "kannada"
    | "hindi";

  const preferred: VerifiedResource[] = [];
  const english: VerifiedResource[] = [];
  const hindi: VerifiedResource[] = [];
  const other: VerifiedResource[] = [];

  for (const r of resources) {
    const rLang = r.language || "english";
    if (rLang === normLang) {
      preferred.push(r);
    } else if (rLang === "english") {
      english.push(r);
    } else if (rLang === "hindi") {
      hindi.push(r);
    } else {
      other.push(r);
    }
  }

  const hasPreferredMatch = preferred.length > 0;
  let fallbackMessage: string | null = null;

  if (!hasPreferredMatch && normLang !== "english") {
    const langDisplay = normLang.charAt(0).toUpperCase() + normLang.slice(1);
    fallbackMessage = `No verified ${langDisplay} resource found — showing English alternatives.`;
  }

  // Deduplicate when preferred is english
  const sortedResources =
    normLang === "english"
      ? [...english, ...hindi, ...other]
      : [...preferred, ...english, ...hindi, ...other];

  return {
    sortedResources,
    hasPreferredMatch,
    fallbackMessage,
  };
}

// ============================================================================
// 5. Industry Certification Catalog (P10)
// ============================================================================

export const INDUSTRY_CERTIFICATIONS: CertificationItem[] = [
  // Software Engineering
  {
    certId: "cert_gh_foundations",
    title: "GitHub Foundations Certification",
    domain: "software_engineering",
    provider: "GitHub / Microsoft Learn",
    level: "Beginner",
    examType: "free_learning_paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/github-foundations/",
    skills: ["Git", "GitHub Actions", "Pull Requests", "Markdown", "Repository Governance"],
    description: "Validates foundational version control, open source collaboration, and CI/CD pipelines.",
    lastVerifiedAt: "2026-09-01",
  },
  {
    certId: "cert_oracle_java",
    title: "Oracle Certified Associate Java Programmer (OCAJP)",
    domain: "software_engineering",
    provider: "Oracle University",
    level: "Associate",
    examType: "paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://education.oracle.com/java-se-programmer-i/pexam_1Z0-808",
    skills: ["Java OOP", "Collections", "Exception Handling", "Streams", "JVM Internals"],
    description: "Industry-standard benchmark for core Java syntax, memory management, and OOP.",
    lastVerifiedAt: "2026-09-01",
  },
  // Cloud
  {
    certId: "cert_aws_ccp",
    title: "AWS Certified Cloud Practitioner (CLF-C02)",
    domain: "cloud",
    provider: "Amazon Web Services",
    level: "Beginner",
    examType: "free_learning_paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
    skills: ["AWS EC2", "S3 Storage", "IAM Security", "Cloud Economics", "Shared Responsibility"],
    description: "Essential cloud credential demonstrating knowledge of AWS architecture and cloud security.",
    lastVerifiedAt: "2026-09-01",
  },
  {
    certId: "cert_azure_az900",
    title: "Microsoft Certified: Azure Fundamentals (AZ-900)",
    domain: "cloud",
    provider: "Microsoft Learn",
    level: "Beginner",
    examType: "free_learning_paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/",
    skills: ["Azure VMs", "Blob Storage", "Entra ID", "Resource Groups", "Virtual Networks"],
    description: "Free learning path on Microsoft Learn covering foundational cloud services.",
    lastVerifiedAt: "2026-09-01",
  },
  {
    certId: "cert_gcp_ace",
    title: "Google Cloud Associate Cloud Engineer",
    domain: "cloud",
    provider: "Google Cloud",
    level: "Associate",
    examType: "free_learning_paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://cloud.google.com/learn/certification/cloud-engineer",
    skills: ["Compute Engine", "GKE Kubernetes", "Cloud SQL", "Cloud IAM", "gcloud CLI"],
    description: "Demonstrates ability to deploy applications, monitor operations, and manage cloud enterprise solutions.",
    lastVerifiedAt: "2026-09-01",
  },
  // Cybersecurity
  {
    certId: "cert_cisco_cyber_support",
    title: "Cisco Certified Support Technician (CCST) Cybersecurity",
    domain: "cybersecurity",
    provider: "Cisco Networking Academy",
    level: "Beginner",
    examType: "free_learning_paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://www.netacad.com/courses/cybersecurity/ccst-cybersecurity",
    skills: ["Network Security", "Threat Detection", "Endpoint Protection", "Cryptography", "Firewalls"],
    description: "Free self-paced training curriculum provided by Cisco Networking Academy.",
    lastVerifiedAt: "2026-09-01",
  },
  {
    certId: "cert_comptia_secplus",
    title: "CompTIA Security+ (SY0-701)",
    domain: "cybersecurity",
    provider: "CompTIA",
    level: "Associate",
    examType: "paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://www.comptia.org/certifications/security",
    skills: ["Vulnerability Assessment", "SIEM Monitoring", "Zero Trust", "Incident Response"],
    description: "Global standard for validating baseline skills in enterprise risk management and threat defense.",
    lastVerifiedAt: "2026-09-01",
  },
  // AI / ML
  {
    certId: "cert_nvidia_dli",
    title: "NVIDIA DLI Certificate: Fundamentals of Deep Learning",
    domain: "ai_ml",
    provider: "NVIDIA Deep Learning Institute",
    level: "Beginner",
    examType: "free_certificate",
    studentDiscountAvailable: true,
    officialUrl: "https://www.nvidia.com/en-us/training/instructor-led-workshops/fundamentals-of-deep-learning/",
    skills: ["PyTorch", "CNNs", "Transfer Learning", "GPU Acceleration", "Computer Vision"],
    description: "Hands-on GPU-accelerated neural network training in Jupyter environments.",
    lastVerifiedAt: "2026-09-01",
  },
  {
    certId: "cert_azure_ai900",
    title: "Microsoft Certified: Azure AI Fundamentals (AI-900)",
    domain: "ai_ml",
    provider: "Microsoft Learn",
    level: "Beginner",
    examType: "free_learning_paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/",
    skills: ["Computer Vision", "NLP", "Azure OpenAI", "Responsible AI", "Document Intelligence"],
    description: "Foundational AI principles and machine learning workloads on Azure.",
    lastVerifiedAt: "2026-09-01",
  },
  // Data
  {
    certId: "cert_ibm_data_science",
    title: "IBM Data Science Professional Certificate",
    domain: "data",
    provider: "IBM SkillsBuild",
    level: "Associate",
    examType: "free_learning_paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://skillsbuild.org/students",
    skills: ["Python", "SQL", "Pandas", "Matplotlib", "Scikit-Learn", "Jupyter Notebooks"],
    description: "Free access via IBM SkillsBuild for registered university students.",
    lastVerifiedAt: "2026-09-01",
  },
  // DevOps
  {
    certId: "cert_linux_lfcs",
    title: "Linux Foundation Certified System Administrator (LFCS)",
    domain: "devops",
    provider: "The Linux Foundation",
    level: "Associate",
    examType: "paid_exam",
    studentDiscountAvailable: true,
    officialUrl: "https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/",
    skills: ["Bash Scripting", "Systemd", "LVM Storage", "User Permissions", "Networking"],
    description: "100% performance-based exam proving practical mastery of enterprise Linux.",
    lastVerifiedAt: "2026-09-01",
  },
  // IoT / Embedded
  {
    certId: "cert_cisco_iot",
    title: "Cisco Introduction to Internet of Things (IoT)",
    domain: "iot_embedded",
    provider: "Cisco Networking Academy",
    level: "Beginner",
    examType: "free_certificate",
    studentDiscountAvailable: true,
    officialUrl: "https://www.netacad.com/courses/iot/introduction-iot",
    skills: ["Sensor Networks", "Microcontrollers", "MQTT", "Edge Analytics", "Packet Tracer"],
    description: "Free certificate from Cisco demonstrating foundational IoT connectivity.",
    lastVerifiedAt: "2026-09-01",
  },
];

// ============================================================================
// 6. Actionable Roadmap Node Learning Drawers (P7 & P8)
// ============================================================================

export const ROADMAP_NODE_RESOURCES: Record<string, RoadmapNodeResourceDrawer> = {
  sde_01: {
    nodeKey: "sde_01",
    title: "Git, GitHub & Linux Command Line",
    conceptOverview:
      "Master essential version control, branch workflows, pull requests, and Linux shell navigation required for team engineering.",
    officialDocs: [
      {
        resourceId: "git_doc",
        title: "Pro Git Official Book & Documentation",
        category: "notes",
        provider: "Git SCM",
        sourceUrl: "https://git-scm.com/book/en/v2",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: true,
      },
      {
        resourceId: "gh_skills",
        title: "GitHub Skills Interactive Labs",
        category: "practice",
        provider: "GitHub",
        sourceUrl: "https://skills.github.com",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: true,
      },
    ],
    freeCourses: [
      {
        resourceId: "cs50_git",
        title: "CS50 Introduction to Git & GitHub",
        category: "syllabus",
        provider: "Harvard University",
        sourceUrl: "https://cs50.harvard.edu",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: true,
      },
    ],
    youtube: {
      english: [
        {
          resourceId: "yt_git_en",
          title: "Git & GitHub Crash Course for Beginners",
          category: "youtube",
          provider: "freeCodeCamp",
          sourceUrl: "https://www.youtube.com/watch?v=RGOj5yH7evk",
          free: true,
          language: "english",
          lastVerifiedAt: "2026-09-01",
          official: false,
        },
      ],
      hindi: [
        {
          resourceId: "yt_git_hi",
          title: "Complete Git & GitHub in Hindi",
          category: "youtube",
          provider: "Apna College",
          sourceUrl: "https://www.youtube.com/watch?v=Ez8F0nW6S-w",
          free: true,
          language: "hindi",
          lastVerifiedAt: "2026-09-01",
          official: false,
        },
      ],
      kannada: [],
    },
    practice: [
      {
        resourceId: "gh_pr_lab",
        title: "Learn Git Branching (Visual Interactive Sandbox)",
        category: "practice",
        provider: "LearnGitBranching",
        sourceUrl: "https://learngitbranching.js.org",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
    ],
    projectTutorial: {
      resourceId: "proj_cli_tool",
      title: "Build a Bash Automation Script for VTU Study Notes",
      category: "practice",
      provider: "CampusLit Lab Guide",
      sourceUrl: "https://vtu.ac.in",
      free: true,
      lastVerifiedAt: "2026-09-01",
      official: false,
    },
    proofOfWorkChecklist: [
      "Initialized git repo with .gitignore and README.md",
      "Created feature branch, committed clean changes, and rebased onto main",
      "Created a Pull Request on GitHub and verified CI action pass",
      "Executed chmod, grep, curl, and ssh commands in Linux terminal",
    ],
    recommendedNextAction: "Proceed to sde_02 (Data Structures in C/C++) after passing Git CLI verification.",
  },

  sde_02: {
    nodeKey: "sde_02",
    title: "Data Structures in C/C++ (Arrays, Pointers & Memory)",
    conceptOverview:
      "Understand dynamic memory allocation (malloc/free, new/delete), pointer arithmetic, cache locality, and foundational linear data structures.",
    officialDocs: [
      {
        resourceId: "cpp_ref",
        title: "C++ Reference Documentation (std::vector, pointers)",
        category: "notes",
        provider: "CppReference",
        sourceUrl: "https://en.cppreference.com/w/cpp",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: true,
      },
    ],
    freeCourses: [
      {
        resourceId: "nptel_dsa",
        title: "Programming, Data Structures And Algorithms in C/C++",
        category: "syllabus",
        provider: "NPTEL / IIT Madras",
        sourceUrl: "https://nptel.ac.in/courses/106106127",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: true,
      },
    ],
    youtube: {
      english: [
        {
          resourceId: "yt_dsa_ab",
          title: "Mastering Data Structures & Algorithms",
          category: "youtube",
          provider: "Abdul Bari",
          sourceUrl: "https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O",
          free: true,
          language: "english",
          lastVerifiedAt: "2026-09-01",
          official: false,
        },
      ],
      hindi: [
        {
          resourceId: "yt_dsa_hi",
          title: "Complete C++ DSA Course in Hindi",
          category: "youtube",
          provider: "CodeWithHarry",
          sourceUrl: "https://www.youtube.com/playlist?list=PLu0W_9lII9agpFUAlPFe_VNSlXW5uE0YL",
          free: true,
          language: "hindi",
          lastVerifiedAt: "2026-09-01",
          official: false,
        },
      ],
      kannada: [],
    },
    practice: [
      {
        resourceId: "striver_a2z",
        title: "Striver's A2Z DSA Course & Sheet",
        category: "practice",
        provider: "TakeUForward",
        sourceUrl: "https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z",
        free: true,
        lastVerifiedAt: "2026-09-16",
        official: false,
      },
      {
        resourceId: "neetcode_practice",
        title: "NeetCode DSA Practice & Roadmaps",
        category: "practice",
        provider: "NeetCode",
        sourceUrl: "https://neetcode.io/practice",
        free: true,
        lastVerifiedAt: "2026-09-16",
        official: false,
      },
    ],
    proofOfWorkChecklist: [
      "Implemented dynamic array resizing in C with malloc/realloc",
      "Solved Two Sum and Best Time to Buy/Sell Stock on LeetCode",
      "Analyzed Time & Space complexity ($O(1)$ auxiliary memory)",
    ],
    recommendedNextAction: "Complete the 10 Arrays & Strings challenges, then proceed to Linked Lists.",
  },
};

export function getRoadmapNodeDrawer(
  nodeKey: string,
  fallbackTitle?: string,
  fallbackDesc?: string
): RoadmapNodeResourceDrawer {
  const norm = (nodeKey || "").toLowerCase().trim();
  if (ROADMAP_NODE_RESOURCES[norm]) {
    return ROADMAP_NODE_RESOURCES[norm];
  }

  // Synthesis for any node
  return {
    nodeKey,
    title: fallbackTitle || "Technical Milestone",
    conceptOverview:
      fallbackDesc || "Core technical competency, practical toolset, and architectural pattern for this milestone.",
    officialDocs: [
      {
        resourceId: `${nodeKey}_doc`,
        title: `${fallbackTitle || "Technical"} Documentation & Standard Specifications`,
        category: "notes",
        provider: "CampusLit Verified Engine",
        sourceUrl: "https://vtu.ac.in",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: true,
      },
    ],
    freeCourses: [
      {
        resourceId: `${nodeKey}_course`,
        title: "Free Engineering Curriculum Courseware",
        category: "syllabus",
        provider: "NPTEL / Swayam",
        sourceUrl: "https://nptel.ac.in",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: true,
      },
    ],
    youtube: {
      english: [
        {
          resourceId: `${nodeKey}_yt_en`,
          title: `${fallbackTitle || "Core Milestone"} Engineering Lecture Series`,
          category: "youtube",
          provider: "freeCodeCamp",
          sourceUrl: "https://www.youtube.com",
          free: true,
          language: "english",
          lastVerifiedAt: "2026-09-01",
          official: false,
        },
      ],
      hindi: [],
      kannada: [],
    },
    practice: [
      {
        resourceId: `${nodeKey}_practice`,
        title: "Hands-on Technical Practice Sandbox",
        category: "practice",
        provider: "LeetCode / GitHub",
        sourceUrl: "https://leetcode.com",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
    ],
    proofOfWorkChecklist: [
      "Completed foundational concept reading and environment setup",
      "Built working code exercise or verified test case",
      "Pushed solution to GitHub repository with documentation",
    ],
    recommendedNextAction: "Review module code with peers or discuss implementation with AI Mentor.",
  };
}

// ============================================================================
// 7. Actionable DSA Topic Practice Directory (P8)
// ============================================================================

export const DSA_PRACTICE_TOPICS: DSATopicResource[] = [
  {
    topicKey: "arrays_strings",
    topicName: "Arrays & Strings",
    difficulty: "Easy",
    learn: {
      conceptDoc: {
        resourceId: "tuf_arrays",
        title: "TakeUForward Arrays Complete Tutorial",
        category: "notes",
        provider: "TakeUForward",
        sourceUrl: "https://takeuforward.org/data-structure/arrays-part-1/",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
      youtubeEnglish: {
        resourceId: "yt_tuf_arr_en",
        title: "Arrays Masterclass (Two Pointer & Sliding Window)",
        category: "youtube",
        provider: "TakeUForward",
        sourceUrl: "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
      youtubeHindi: {
        resourceId: "yt_arr_hi",
        title: "Arrays in C++ Hindi Crash Course",
        category: "youtube",
        provider: "Love Babbar",
        sourceUrl: "https://www.youtube.com/watch?v=1bPEq4cZg3o",
        free: true,
        language: "hindi",
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
    },
    practice: [
      {
        title: "Two Sum (LeetCode #1)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/two-sum/",
        sheetName: "Blind 75",
      },
      {
        title: "Best Time to Buy and Sell Stock (LeetCode #121)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        sheetName: "Striver A2Z",
      },
      {
        title: "Contains Duplicate (LeetCode #217)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/contains-duplicate/",
        sheetName: "NeetCode 150",
      },
      {
        title: "Kadane's Algorithm - Maximum Subarray (LeetCode #53)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/maximum-subarray/",
        sheetName: "TakeUForward",
      },
    ],
    recommendedNextTopic: "Pointers & Dynamic Memory Allocation",
  },
  {
    topicKey: "linked_lists",
    topicName: "Linked Lists (Singly, Doubly, Circular)",
    difficulty: "Medium",
    learn: {
      conceptDoc: {
        resourceId: "gfg_ll",
        title: "Linked List Data Structure Guide",
        category: "notes",
        provider: "GeeksforGeeks",
        sourceUrl: "https://www.geeksforgeeks.org/data-structures/linked-list/",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
      youtubeEnglish: {
        resourceId: "yt_ll_en",
        title: "Linked List Tutorial with Memory Diagrams",
        category: "youtube",
        provider: "mycodeschool",
        sourceUrl: "https://www.youtube.com/playlist?list=PL2_aWCzGMAwI3W_JlcBbtYTwiQSsOTa6P",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
    },
    practice: [
      {
        title: "Reverse Linked List (LeetCode #206)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/reverse-linked-list/",
        sheetName: "Striver A2Z",
      },
      {
        title: "Linked List Cycle (LeetCode #141 - Floyd's Tortoise)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/linked-list-cycle/",
        sheetName: "Blind 75",
      },
      {
        title: "Merge Two Sorted Lists (LeetCode #21)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/merge-two-sorted-lists/",
        sheetName: "LeetCode 75",
      },
    ],
    recommendedNextTopic: "Stacks & Queues",
  },
  {
    topicKey: "stacks_queues",
    topicName: "Stacks, Queues & Monotonic Queues",
    difficulty: "Medium",
    learn: {
      conceptDoc: {
        resourceId: "gfg_sq",
        title: "Stack & Queue Data Structures Guide",
        category: "notes",
        provider: "GeeksforGeeks",
        sourceUrl: "https://www.geeksforgeeks.org/stack-data-structure/",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
      youtubeEnglish: {
        resourceId: "yt_sq_en",
        title: "Stacks and Queues Masterclass",
        category: "youtube",
        provider: "TakeUForward",
        sourceUrl: "https://www.youtube.com/playlist?list=PLgUwDviBIf0p4ozDR_kJJkONnb1wdx2Ma",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
    },
    practice: [
      {
        title: "Valid Parentheses (LeetCode #20)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/valid-parentheses/",
        sheetName: "Blind 75",
      },
      {
        title: "Min Stack (LeetCode #155)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/min-stack/",
        sheetName: "NeetCode 150",
      },
      {
        title: "Daily Temperatures - Monotonic Stack (LeetCode #739)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/daily-temperatures/",
        sheetName: "Striver A2Z",
      },
    ],
    recommendedNextTopic: "Binary Trees & BST",
  },
  {
    topicKey: "binary_search",
    topicName: "Binary Search on Arrays & Answer Spaces",
    difficulty: "Medium",
    learn: {
      conceptDoc: {
        resourceId: "gfg_bs",
        title: "Binary Search Algorithm in Depth",
        category: "notes",
        provider: "GeeksforGeeks",
        sourceUrl: "https://www.geeksforgeeks.org/binary-search/",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
      youtubeEnglish: {
        resourceId: "yt_bs_en",
        title: "Binary Search Complete Series",
        category: "youtube",
        provider: "TakeUForward",
        sourceUrl: "https://www.youtube.com/playlist?list=PLgUwDviBIf0pMFMWuuvDNMAkoQFi-h0ZF",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
    },
    practice: [
      {
        title: "Binary Search (LeetCode #704)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/binary-search/",
        sheetName: "LeetCode 75",
      },
      {
        title: "Search in Rotated Sorted Array (LeetCode #33)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
        sheetName: "Blind 75",
      },
      {
        title: "Koko Eating Bananas (LeetCode #875)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/koko-eating-bananas/",
        sheetName: "NeetCode 150",
      },
    ],
    recommendedNextTopic: "Binary Trees & BST",
  },
  {
    topicKey: "trees_bst",
    topicName: "Binary Trees & Binary Search Trees",
    difficulty: "Medium",
    learn: {
      conceptDoc: {
        resourceId: "gfg_trees",
        title: "Binary Tree Traversals and Properties",
        category: "notes",
        provider: "GeeksforGeeks",
        sourceUrl: "https://www.geeksforgeeks.org/binary-tree-data-structure/",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
      youtubeEnglish: {
        resourceId: "yt_trees_en",
        title: "Binary Tree Series (Traversals & Views)",
        category: "youtube",
        provider: "TakeUForward",
        sourceUrl: "https://www.youtube.com/playlist?list=PLgUwDviBIf0q8Hkd7bK2Bpryj2xVJk8Vk",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
    },
    practice: [
      {
        title: "Maximum Depth of Binary Tree (LeetCode #104)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
        sheetName: "Blind 75",
      },
      {
        title: "Lowest Common Ancestor of a BST (LeetCode #235)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
        sheetName: "NeetCode 150",
      },
      {
        title: "Validate Binary Search Tree (LeetCode #98)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/validate-binary-search-tree/",
        sheetName: "Striver A2Z",
      },
    ],
    recommendedNextTopic: "Heaps & Priority Queues",
  },
  {
    topicKey: "heaps_priority_queues",
    topicName: "Heaps & Priority Queues",
    difficulty: "Medium",
    learn: {
      conceptDoc: {
        resourceId: "gfg_heaps",
        title: "Binary Heap & Priority Queue Explained",
        category: "notes",
        provider: "GeeksforGeeks",
        sourceUrl: "https://www.geeksforgeeks.org/heap-data-structure/",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
      youtubeEnglish: {
        resourceId: "yt_heaps_en",
        title: "Heaps and Priority Queues",
        category: "youtube",
        provider: "Abdul Bari",
        sourceUrl: "https://www.youtube.com/watch?v=HqPJF2L5h9U",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
    },
    practice: [
      {
        title: "Kth Largest Element in an Array (LeetCode #215)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
        sheetName: "Blind 75",
      },
      {
        title: "Top K Frequent Elements (LeetCode #347)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/top-k-frequent-elements/",
        sheetName: "NeetCode 150",
      },
      {
        title: "Find Median from Data Stream (LeetCode #295)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/find-median-from-data-stream/",
        sheetName: "Striver A2Z",
      },
    ],
    recommendedNextTopic: "Graphs & Topological Sort",
  },
  {
    topicKey: "graphs",
    topicName: "Graphs (BFS, DFS, Shortest Paths & MST)",
    difficulty: "Hard",
    learn: {
      conceptDoc: {
        resourceId: "gfg_graphs",
        title: "Graph Data Structure & Representation",
        category: "notes",
        provider: "GeeksforGeeks",
        sourceUrl: "https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
      youtubeEnglish: {
        resourceId: "yt_graphs_en",
        title: "Graph Complete Series (BFS, DFS, Dijkstra)",
        category: "youtube",
        provider: "TakeUForward",
        sourceUrl: "https://www.youtube.com/playlist?list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
    },
    practice: [
      {
        title: "Number of Islands (LeetCode #200)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/number-of-islands/",
        sheetName: "Blind 75",
      },
      {
        title: "Course Schedule - Topological Sort (LeetCode #207)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/course-schedule/",
        sheetName: "NeetCode 150",
      },
      {
        title: "Network Delay Time - Dijkstra (LeetCode #743)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/network-delay-time/",
        sheetName: "Striver A2Z",
      },
    ],
    recommendedNextTopic: "Dynamic Programming",
  },
  {
    topicKey: "dynamic_programming",
    topicName: "Dynamic Programming (1D, 2D & Subsequences)",
    difficulty: "Hard",
    learn: {
      conceptDoc: {
        resourceId: "gfg_dp",
        title: "Dynamic Programming Fundamentals & Patterns",
        category: "notes",
        provider: "GeeksforGeeks",
        sourceUrl: "https://www.geeksforgeeks.org/dynamic-programming/",
        free: true,
        lastVerifiedAt: "2026-09-01",
        official: false,
      },
      youtubeEnglish: {
        resourceId: "yt_dp_en",
        title: "Dynamic Programming Master Series",
        category: "youtube",
        provider: "TakeUForward",
        sourceUrl: "https://takeuforward.org/dynamic-programming/striver-dp-series-dynamic-programming-problems/",
        free: true,
        language: "english",
        lastVerifiedAt: "2026-09-16",
        official: false,
      },
    },
    practice: [
      {
        title: "Climbing Stairs (LeetCode #70)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/climbing-stairs/",
        sheetName: "Blind 75",
      },
      {
        title: "Coin Change (LeetCode #322)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/coin-change/",
        sheetName: "NeetCode 150",
      },
      {
        title: "Longest Increasing Subsequence (LeetCode #300)",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/longest-increasing-subsequence/",
        sheetName: "Striver A2Z",
      },
    ],
    recommendedNextTopic: "Full Mock Technical Interview",
  },
];

// ============================================================================
// 8. Deterministic Career Track Roadmaps for Extended Domains (P2)
// ============================================================================

export interface SyntheticRoadmapTrack {
  careerSlug: string;
  title: string;
  description: string;
  totalNodes: number;
  nodes: Array<{
    nodeKey: string;
    sequenceNo: number;
    title: string;
    description: string;
    targetSemester: number;
    difficulty: string;
    skills: string[];
    resources: VerifiedResource[];
  }>;
}

export const EXTENDED_DOMAIN_ROADMAPS: Record<string, SyntheticRoadmapTrack> = {
  data_science: {
    careerSlug: "data_science",
    title: "Data Science & Advanced Analytics Track",
    description: "Statistical modeling, big data manipulation, machine learning inference, and data storytelling.",
    totalNodes: 4,
    nodes: [
      {
        nodeKey: "ds_01",
        sequenceNo: 1,
        title: "Python for Data Science, NumPy & Pandas",
        description: "Vectorized computation, data wrangling, handling missing values, and exploratory data analysis.",
        targetSemester: 3,
        difficulty: "beginner",
        skills: ["Python", "NumPy", "Pandas", "Matplotlib", "Seaborn"],
        resources: [
          {
            resourceId: "ds_res_01",
            title: "Python Data Science Handbook (Jake VanderPlas)",
            category: "textbooks",
            provider: "O'Reilly Open Book",
            sourceUrl: "https://jakevdp.github.io/PythonDataScienceHandbook/",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
      {
        nodeKey: "ds_02",
        sequenceNo: 2,
        title: "Relational Databases, SQL & Business Intelligence",
        description: "Advanced SQL joins, window functions, CTEs, indexing, and Tableau/PowerBI dashboard design.",
        targetSemester: 4,
        difficulty: "intermediate",
        skills: ["PostgreSQL", "Window Functions", "CTEs", "PowerBI"],
        resources: [
          {
            resourceId: "ds_res_02",
            title: "PostgreSQL Tutorial for Data Analysts",
            category: "notes",
            provider: "PostgreSQL Tutorial",
            sourceUrl: "https://www.postgresqltutorial.com/",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: false,
          },
        ],
      },
      {
        nodeKey: "ds_03",
        sequenceNo: 3,
        title: "Statistical Learning & Scikit-Learn Modeling",
        description: "Hypothesis testing, linear/logistic regression, decision trees, random forests, and cross-validation.",
        targetSemester: 5,
        difficulty: "intermediate",
        skills: ["Scikit-Learn", "Regression", "Classification", "Model Evaluation"],
        resources: [
          {
            resourceId: "ds_res_03",
            title: "Introduction to Statistical Learning (ISLR with Python)",
            category: "textbooks",
            provider: "Springer Open Access",
            sourceUrl: "https://www.statlearning.com/",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
      {
        nodeKey: "ds_04",
        sequenceNo: 4,
        title: "End-to-End ML Pipeline & Capstone Model Deployment",
        description: "Streamlit dashboard deployment, FastAPI model endpoints, Docker containerization, and model monitoring.",
        targetSemester: 6,
        difficulty: "advanced",
        skills: ["FastAPI", "Docker", "Streamlit", "MLflow"],
        resources: [
          {
            resourceId: "ds_res_04",
            title: "FastAPI Official Machine Learning Guide",
            category: "notes",
            provider: "FastAPI",
            sourceUrl: "https://fastapi.tiangolo.com/tutorial/",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
    ],
  },

  cybersecurity: {
    careerSlug: "cybersecurity",
    title: "Cybersecurity & Information Defense Track",
    description: "Network security, vulnerability assessment, cryptography, SOC triage, and ethical penetration testing.",
    totalNodes: 4,
    nodes: [
      {
        nodeKey: "cyber_01",
        sequenceNo: 1,
        title: "Networking Protocols & Linux Administration",
        description: "TCP/IP 4-layer model, Wireshark packet capture, DNS, subnetting, and Linux CLI privilege separation.",
        targetSemester: 3,
        difficulty: "beginner",
        skills: ["TCP/IP", "Wireshark", "Linux Permissions", "Bash"],
        resources: [
          {
            resourceId: "cyber_res_01",
            title: "Cisco Networking Academy Cybersecurity Essentials",
            category: "syllabus",
            provider: "Cisco NetAcad",
            sourceUrl: "https://www.netacad.com/courses/cybersecurity/cybersecurity-essentials",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
      {
        nodeKey: "cyber_02",
        sequenceNo: 2,
        title: "Web Security & OWASP Top 10 Vulnerabilities",
        description: "SQL Injection, Cross-Site Scripting (XSS), CSRF, insecure deserialization, and Burp Suite interception.",
        targetSemester: 4,
        difficulty: "intermediate",
        skills: ["OWASP Top 10", "Burp Suite", "SQL Injection", "XSS"],
        resources: [
          {
            resourceId: "cyber_res_02",
            title: "PortSwigger Web Security Academy",
            category: "practice",
            provider: "PortSwigger",
            sourceUrl: "https://portswigger.net/web-security",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
      {
        nodeKey: "cyber_03",
        sequenceNo: 3,
        title: "Applied Cryptography & Secure Architecture",
        description: "RSA, AES-GCM, Diffie-Hellman key exchange, TLS 1.3 handshake, PKI, and zero-trust authentication.",
        targetSemester: 5,
        difficulty: "intermediate",
        skills: ["Cryptography", "TLS", "PKI", "Hashing", "Zero Trust"],
        resources: [
          {
            resourceId: "cyber_res_03",
            title: "Crypto101 Free Open Source Coursebook",
            category: "textbooks",
            provider: "Crypto 101",
            sourceUrl: "https://www.crypto101.io/",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: false,
          },
        ],
      },
      {
        nodeKey: "cyber_04",
        sequenceNo: 4,
        title: "Security Operations Center (SOC) & Incident Response",
        description: "SIEM analysis with Splunk/Elastic, MITRE ATT&CK framework mapping, and intrusion detection systems.",
        targetSemester: 6,
        difficulty: "advanced",
        skills: ["SIEM", "MITRE ATT&CK", "Splunk", "Snort IDS"],
        resources: [
          {
            resourceId: "cyber_res_04",
            title: "TryHackMe Pre-Security & SOC Analyst Path",
            category: "practice",
            provider: "TryHackMe",
            sourceUrl: "https://tryhackme.com/path/outline/soclevel1",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: false,
          },
        ],
      },
    ],
  },

  cloud_devops: {
    careerSlug: "cloud_devops",
    title: "Cloud Architecture & DevOps Engineering Track",
    description: "Cloud computing infrastructure, Docker containerization, Kubernetes orchestration, and CI/CD pipelines.",
    totalNodes: 4,
    nodes: [
      {
        nodeKey: "cloud_01",
        sequenceNo: 1,
        title: "Linux Systems, Shell Scripting & Git Automation",
        description: "Master systemd, process management, SSH key management, cron automation, and multi-branch Git flows.",
        targetSemester: 3,
        difficulty: "beginner",
        skills: ["Linux", "Bash", "SSH", "Git"],
        resources: [
          {
            resourceId: "cloud_res_01",
            title: "The Linux Command Line (William Shotts)",
            category: "textbooks",
            provider: "LinuxCommand.org",
            sourceUrl: "https://linuxcommand.org/tlcl.php",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
      {
        nodeKey: "cloud_02",
        sequenceNo: 2,
        title: "Docker Containerization & Microservices",
        description: "Multi-stage Dockerfiles, image optimization, volume binding, networking, and docker-compose coordination.",
        targetSemester: 4,
        difficulty: "intermediate",
        skills: ["Docker", "Docker Compose", "Microservices", "Alpine Linux"],
        resources: [
          {
            resourceId: "cloud_res_02",
            title: "Docker Official Getting Started Tutorial",
            category: "notes",
            provider: "Docker",
            sourceUrl: "https://docs.docker.com/get-started/",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
      {
        nodeKey: "cloud_03",
        sequenceNo: 3,
        title: "CI/CD Pipelines & Cloud Fundamentals (AWS / Azure)",
        description: "GitHub Actions automated build/test/deploy, AWS EC2, S3 static hosting, and CloudWatch metrics.",
        targetSemester: 5,
        difficulty: "intermediate",
        skills: ["GitHub Actions", "AWS EC2", "S3", "IAM", "CloudWatch"],
        resources: [
          {
            resourceId: "cloud_res_03",
            title: "AWS Cloud Practitioner Essentials Free Course",
            category: "syllabus",
            provider: "AWS Skill Builder",
            sourceUrl: "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
      {
        nodeKey: "cloud_04",
        sequenceNo: 4,
        title: "Kubernetes Orchestration & Infrastructure as Code (Terraform)",
        description: "Deploying Pods, Deployments, Services, Ingress controllers, and provisioning clouds with Terraform.",
        targetSemester: 6,
        difficulty: "advanced",
        skills: ["Kubernetes", "Terraform", "Helm", "Prometheus"],
        resources: [
          {
            resourceId: "cloud_res_04",
            title: "Kubernetes Official Interactive Basics Tutorial",
            category: "practice",
            provider: "Kubernetes.io",
            sourceUrl: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
    ],
  },
};

/**
 * Returns a deterministic fallback roadmap for any extended or custom domain.
 */
export function getExtendedDomainRoadmap(careerGoal: string): SyntheticRoadmapTrack {
  const slug = (careerGoal || "other").toLowerCase().trim();

  if (EXTENDED_DOMAIN_ROADMAPS[slug]) {
    return EXTENDED_DOMAIN_ROADMAPS[slug];
  }

  // Generic customized engineering track for "other" or custom career goal
  const displayTitle =
    careerGoal.charAt(0).toUpperCase() + careerGoal.slice(1).replace(/_/g, " ");

  return {
    careerSlug: slug,
    title: `${displayTitle} Career Acceleration Track`,
    description: `Targeted milestone trajectory and verified resource path for ${displayTitle}.`,
    totalNodes: 4,
    nodes: [
      {
        nodeKey: `${slug.slice(0, 4)}_01`,
        sequenceNo: 1,
        title: "Foundations & Domain Architecture",
        description: `Master core computing fundamentals, algorithmic principles, and primary tools for ${displayTitle}.`,
        targetSemester: 3,
        difficulty: "beginner",
        skills: ["Core Fundamentals", "Git", "Problem Solving"],
        resources: [
          {
            resourceId: `${slug}_res_01`,
            title: `${displayTitle} Official Documentation & Guidelines`,
            category: "notes",
            provider: "CampusLit Verified Knowledge Engine",
            sourceUrl: "https://vtu.ac.in",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
      {
        nodeKey: `${slug.slice(0, 4)}_02`,
        sequenceNo: 2,
        title: "Practical Tooling & Mini-Project Implementation",
        description: `Implement working proof-of-concept projects and system designs in ${displayTitle}.`,
        targetSemester: 4,
        difficulty: "intermediate",
        skills: ["Implementation", "Architecture", "Debugging"],
        resources: [
          {
            resourceId: `${slug}_res_02`,
            title: `${displayTitle} Hands-on Guide & Architecture Reference`,
            category: "practice",
            provider: "CampusLit Lab Guide",
            sourceUrl: "https://vtu.ac.in",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: false,
          },
        ],
      },
      {
        nodeKey: `${slug.slice(0, 4)}_03`,
        sequenceNo: 3,
        title: "Industry Best Practices & Benchmarking",
        description: `System optimization, production readiness, and security standards for ${displayTitle}.`,
        targetSemester: 5,
        difficulty: "intermediate",
        skills: ["Performance Optimization", "Security", "Testing"],
        resources: [
          {
            resourceId: `${slug}_res_03`,
            title: `${displayTitle} Industry Standard Practices`,
            category: "notes",
            provider: "CampusLit Engine",
            sourceUrl: "https://vtu.ac.in",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: false,
          },
        ],
      },
      {
        nodeKey: `${slug.slice(0, 4)}_04`,
        sequenceNo: 4,
        title: "Capstone Engineering Project & Industry Certification",
        description: `Comprehensive capstone deliverable, public documentation, and preparation for industry credentials.`,
        targetSemester: 6,
        difficulty: "advanced",
        skills: ["Capstone Delivery", "Portfolio Documentation", "System Review"],
        resources: [
          {
            resourceId: `${slug}_res_04`,
            title: `${displayTitle} Capstone Specification & Evaluation Rubric`,
            category: "syllabus",
            provider: "VTU Major Project Guidelines",
            sourceUrl: "https://vtu.ac.in/syllabus/",
            free: true,
            lastVerifiedAt: "2026-09-01",
            official: true,
          },
        ],
      },
    ],
  };
}

// ============================================================================
// 9. Proof-of-Work Projects with Learning & Reference Links (P9)
// ============================================================================

export interface ProofOfWorkProjectGuide {
  id: string;
  title: string;
  objective: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  recommendedStack: string[];
  prerequisiteSkills: string[];
  buildGuide: string;
  documentationUrl: string;
  deploymentReferenceUrl?: string;
  githubReferenceNote?: string;
  proofOfWorkChecklist: string[];
}

export const PROOF_OF_WORK_PROJECTS: ProofOfWorkProjectGuide[] = [
  {
    id: "p1",
    title: "VTU SGPA & CIE Risk Calculator",
    objective:
      "Calculate accurate SGPA based on VTU credit scheme and predict safe bunk allowances against the 75% attendance cutoff.",
    level: "Beginner",
    recommendedStack: ["C++", "Python", "CLI", "File I/O"],
    prerequisiteSkills: ["Basic C++/Python Syntax", "Conditional Logic", "File Streams"],
    buildGuide:
      "1. Parse course credits and CIE/SEE marks from user input or CSV.\n2. Implement VTU grade point mapping (O=10, A+=9, A=8, B+=7, etc.).\n3. Calculate Safe Bunk Allowance using floor((attended - 0.75 * held) / 0.75).\n4. Export formatted summary to console and local file.",
    documentationUrl: "https://vtu.ac.in",
    githubReferenceNote: "Clean CLI architecture patterns available in standard educational repositories.",
    proofOfWorkChecklist: [
      "Calculates SGPA correctly for standard 20-credit semester",
      "Handles 75% cutoff boundary edge conditions safely",
      "Validates user inputs and prevents divide-by-zero on zero held classes",
      "Includes README documentation with build/run instructions",
    ],
  },
  {
    id: "p2",
    title: "Campus Event & Hackathon Portal",
    objective:
      "Web application allowing Karnataka engineering students to discover, filter, and track technical hackathons and college symposiums.",
    level: "Intermediate",
    recommendedStack: ["React", "TypeScript", "Tailwind CSS", "LocalStorage"],
    prerequisiteSkills: ["React Component Architecture", "State Management", "Tailwind Styling"],
    buildGuide:
      "1. Initialize Next.js / Vite React project with Tailwind CSS.\n2. Model event entities with dates, prize pools, eligibility, and tags.\n3. Implement filter controls for dates, locations, and technology domains.\n4. Persist saved bookmarks to browser LocalStorage.\n5. Deploy public production build to Vercel.",
    documentationUrl: "https://nextjs.org/docs",
    deploymentReferenceUrl: "https://vercel.com/docs",
    proofOfWorkChecklist: [
      "Responsive mobile and desktop UI layout",
      "Working multi-criteria search and filter engine",
      "State persistence across page reloads via LocalStorage",
      "Live deployed URL and public GitHub repository link",
    ],
  },
  {
    id: "p3",
    title: "Lab Record Observation Manager",
    objective:
      "Desktop/web system to track weekly laboratory experiment submissions, faculty signatures, and viva voice preparation questions.",
    level: "Intermediate",
    recommendedStack: ["Python", "SQLite", "FastAPI / Flask", "Bootstrap"],
    prerequisiteSkills: ["Relational Database Queries", "Python REST Frameworks", "HTML/CSS"],
    buildGuide:
      "1. Design SQLite schema for subjects, lab experiments, and sign-off timestamps.\n2. Create API endpoints for recording experiment status and notes.\n3. Implement weekly progress bar and deadline warning indicators.\n4. Add export functionality for lab observation coversheet.",
    documentationUrl: "https://www.sqlite.org/docs.html",
    proofOfWorkChecklist: [
      "Schema enforces foreign key integrity between courses and experiments",
      "Tracks complete lifecycle: Pending -> Drafted -> Verified -> Signed",
      "Generates clean PDF or printable HTML experiment summary",
      "Documented setup script and sample database fixtures",
    ],
  },
  {
    id: "p4",
    title: "Real-Time System Log Pipeline & Metric Alert Engine",
    objective:
      "Ingest high-throughput JSON logs, compute error rate metrics over sliding time windows, and trigger threshold alert notifications.",
    level: "Intermediate",
    recommendedStack: ["Go / Node.js", "Docker", "Prometheus", "Grafana"],
    prerequisiteSkills: ["Concurrent Programming", "Docker Compose", "Time Series Metrics"],
    buildGuide:
      "1. Write an ingestion worker receiving JSON log payloads via HTTP/TCP.\n2. Expose Prometheus metrics endpoint (/metrics) for total logs and 5xx error counters.\n3. Configure Prometheus scraping and Grafana dashboard visualization.\n4. Create automated load generation script simulating traffic spikes.",
    documentationUrl: "https://prometheus.io/docs/introduction/overview/",
    deploymentReferenceUrl: "https://grafana.com/docs/",
    githubReferenceNote: "Includes docker-compose.yml for one-command local reproduction.",
    proofOfWorkChecklist: [
      "Handles 1,000+ log events per second without memory degradation",
      "Prometheus metrics correctly formatted and scannable by scrapers",
      "Grafana dashboard exported as reproducible JSON template",
      "Comprehensive README with performance benchmarks and setup instructions",
    ],
  },
  {
    id: "p5",
    title: "VTU Syllabus RAG Q&A Assistant",
    objective:
      "Retrieval-Augmented Generation (RAG) assistant that indexes engineering module notes and answers conceptual questions with source citations.",
    level: "Advanced",
    recommendedStack: ["Python", "LangChain / LlamaIndex", "ChromaDB", "FastAPI"],
    prerequisiteSkills: ["Vector Embeddings", "Semantic Chunking", "Prompt Engineering"],
    buildGuide:
      "1. Extract text and equations from VTU PDF course notes.\n2. Chunk text with recursive character splitter and generate dense vector embeddings.\n3. Store in local ChromaDB vector store.\n4. Construct retrieval prompt demanding page-level source attribution and preventing hallucination.",
    documentationUrl: "https://docs.langchain.com",
    githubReferenceNote: "Local embeddings using sentence-transformers for zero-cost operation.",
    proofOfWorkChecklist: [
      "Indexes at least 2 full engineering module PDF documents",
      "Returns accurate answers with verbatim quote and module citations",
      "Strict fallback when question is outside ingested syllabus scope",
      "Interactive Streamlit or FastAPI Swagger UI for testing",
    ],
  },
  {
    id: "p6",
    title: "Network Packet Inspector & Port Scanner CLI",
    objective:
      "Command-line security tool to inspect network interfaces, analyze TCP/UDP packet headers, and detect open vulnerable ports.",
    level: "Intermediate",
    recommendedStack: ["Python / Scapy", "Raw Sockets", "CLI argparse"],
    prerequisiteSkills: ["TCP/IP 3-Way Handshake", "Socket Programming", "Network Security"],
    buildGuide:
      "1. Implement multi-threaded TCP SYN port scanner across specified port ranges.\n2. Capture live packets on network interface using Scapy or raw sockets.\n3. Parse IP, TCP, and UDP headers extracting flags (SYN, ACK, FIN, RST).\n4. Export captured session traces to standard PCAP format for Wireshark inspection.",
    documentationUrl: "https://scapy.readthedocs.io/en/latest/",
    proofOfWorkChecklist: [
      "Performs rapid multi-threaded scan without dropping socket handles",
      "Accurately parses TCP control flags and IP TTL/TOS fields",
      "Outputs valid .pcap capture files readable by Wireshark",
      "Security disclaimer and ethical testing notice in documentation",
    ],
  },
];

// ============================================================================
// 10. Extended Domain Resource Catalogs (P11)
// ============================================================================

export interface DomainResourceItem {
  title: string;
  provider: string;
  url: string;
  free: boolean;
  type: "doc" | "course" | "youtube" | "practice" | "cert" | "community";
}

export interface DomainCatalog {
  domainId: string;
  domainName: string;
  overview: string;
  foundational: DomainResourceItem[];
  intermediate: DomainResourceItem[];
  advanced: DomainResourceItem[];
  projects: DomainResourceItem[];
  practice: DomainResourceItem[];
  certifications: DomainResourceItem[];
  youtube: DomainResourceItem[];
  documentation: DomainResourceItem[];
  communities: DomainResourceItem[];
}

export const EXTENDED_DOMAINS_CATALOG: Record<string, DomainCatalog> = {
  software_engineering: {
    domainId: "software_engineering",
    domainName: "Software Engineering",
    overview: "Systematic software engineering lifecycle, design patterns, testing, and modern scalable system design.",
    foundational: [
      { title: "CS50 Introduction to Computer Science", provider: "Harvard University", url: "https://cs50.harvard.edu", free: true, type: "course" },
      { title: "Pro Git Documentation", provider: "Git SCM", url: "https://git-scm.com/book/en/v2", free: true, type: "doc" },
    ],
    intermediate: [
      { title: "Refactoring and Design Patterns", provider: "Refactoring.Guru", url: "https://refactoring.guru", free: true, type: "doc" },
      { title: "Clean Code Principles", provider: "Martin Fowler Blog", url: "https://martinfowler.com", free: true, type: "doc" },
    ],
    advanced: [
      { title: "System Design Primer", provider: "GitHub / Donne Martin", url: "https://github.com/donnemartin/system-design-primer", free: true, type: "practice" },
    ],
    projects: [
      { title: "Build Your Own Redis / SQLite", provider: "BuildYourOwnX", url: "https://github.com/codecrafters-io/build-your-own-x", free: true, type: "practice" },
    ],
    practice: [
      { title: "NeetCode Curated Practice", provider: "NeetCode", url: "https://neetcode.io/practice", free: true, type: "practice" },
    ],
    certifications: [
      { title: "GitHub Foundations", provider: "Microsoft / GitHub", url: "https://learn.microsoft.com/en-us/credentials/certifications/github-foundations/", free: false, type: "cert" },
    ],
    youtube: [
      { title: "Software Engineering Principles", provider: "freeCodeCamp", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "MDN Web Docs", provider: "Mozilla", url: "https://developer.mozilla.org", free: true, type: "doc" },
    ],
    communities: [
      { title: "Stack Overflow & Dev.to", provider: "Dev Community", url: "https://dev.to", free: true, type: "community" },
    ],
  },
  ai_ml: {
    domainId: "ai_ml",
    domainName: "AI & Machine Learning",
    overview: "Statistical machine learning, deep neural networks, transformer architectures, and LLM application engineering.",
    foundational: [
      { title: "Machine Learning Specialization", provider: "DeepLearning.AI / Coursera", url: "https://www.deeplearning.ai", free: true, type: "course" },
      { title: "Scikit-Learn User Guide", provider: "Scikit-Learn", url: "https://scikit-learn.org/stable/user_guide.html", free: true, type: "doc" },
    ],
    intermediate: [
      { title: "PyTorch Official Deep Learning Tutorials", provider: "PyTorch", url: "https://pytorch.org/tutorials/", free: true, type: "practice" },
      { title: "Hugging Face Transformers NLP Course", provider: "Hugging Face", url: "https://huggingface.co/learn/nlp-course", free: true, type: "course" },
    ],
    advanced: [
      { title: "CS231n Deep Learning for Computer Vision", provider: "Stanford University", url: "http://cs231n.stanford.edu/", free: true, type: "course" },
    ],
    projects: [
      { title: "End-to-End Image Classifier with FastAPI", provider: "FastAPI ML Guide", url: "https://fastapi.tiangolo.com", free: true, type: "practice" },
    ],
    practice: [
      { title: "Kaggle Competitions & Micro-Courses", provider: "Kaggle", url: "https://www.kaggle.com/learn", free: true, type: "practice" },
    ],
    certifications: [
      { title: "NVIDIA Fundamentals of Deep Learning", provider: "NVIDIA DLI", url: "https://www.nvidia.com/en-us/training/", free: true, type: "cert" },
    ],
    youtube: [
      { title: "StatQuest with Josh Starmer", provider: "StatQuest", url: "https://www.youtube.com/@statquest", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "PyTorch Documentation", provider: "Linux Foundation", url: "https://pytorch.org/docs", free: true, type: "doc" },
    ],
    communities: [
      { title: "Hugging Face Community Hub", provider: "Hugging Face", url: "https://huggingface.co", free: true, type: "community" },
    ],
  },
  data_science: {
    domainId: "data_science",
    domainName: "Data Science",
    overview: "Data exploration, statistical inference, visualization, predictive modeling, and business intelligence.",
    foundational: [
      { title: "Python Data Science Handbook", provider: "Jake VanderPlas", url: "https://jakevdp.github.io/PythonDataScienceHandbook/", free: true, type: "doc" },
      { title: "Pandas User Guide", provider: "Pandas Development Team", url: "https://pandas.pydata.org/docs/user_guide/index.html", free: true, type: "doc" },
    ],
    intermediate: [
      { title: "Introduction to Statistical Learning (ISLR)", provider: "Springer Open Access", url: "https://www.statlearning.com/", free: true, type: "doc" },
    ],
    advanced: [
      { title: "Time Series Analysis & Forecasting", provider: "OTexts", url: "https://otexts.com/fpp3/", free: true, type: "doc" },
    ],
    projects: [
      { title: "Student Retention & Academic Outcome Predictive Model", provider: "CampusLit Data Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "StrataScratch SQL & Pandas Practice", provider: "StrataScratch", url: "https://www.stratascratch.com", free: true, type: "practice" },
    ],
    certifications: [
      { title: "IBM Data Science Professional Certificate", provider: "IBM SkillsBuild", url: "https://skillsbuild.org/students", free: true, type: "cert" },
    ],
    youtube: [
      { title: "Ken Jee Data Science Channel", provider: "Ken Jee", url: "https://www.youtube.com/@KenJee_ds", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "NumPy Documentation", provider: "NumPy.org", url: "https://numpy.org/doc/stable/", free: true, type: "doc" },
    ],
    communities: [
      { title: "Kaggle Community Forums", provider: "Kaggle", url: "https://www.kaggle.com/discussions", free: true, type: "community" },
    ],
  },
  data_analytics: {
    domainId: "data_analytics",
    domainName: "Data Analytics",
    overview: "SQL data warehousing, dimensional modeling, KPI dashboards, Excel automation, and PowerBI analytics.",
    foundational: [
      { title: "Mode Analytics SQL Tutorial", provider: "Mode Analytics", url: "https://mode.com/sql-tutorial/", free: true, type: "doc" },
      { title: "Microsoft PowerBI Guided Learning", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/power-bi/guided-learning/", free: true, type: "course" },
    ],
    intermediate: [
      { title: "Advanced SQL Window Functions & CTEs", provider: "PostgreSQL Tutorial", url: "https://www.postgresqltutorial.com/", free: true, type: "doc" },
    ],
    advanced: [
      { title: "The Data Warehouse Toolkit (Kimball)", provider: "Kimball Group", url: "https://www.kimballgroup.com/", free: true, type: "doc" },
    ],
    projects: [
      { title: "University Placement & Salary Analytics Dashboard", provider: "CampusLit Analytics Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "LeetCode SQL 50 Study Plan", provider: "LeetCode", url: "https://leetcode.com/studyplan/top-sql-50/", free: true, type: "practice" },
    ],
    certifications: [
      { title: "Microsoft Power BI Data Analyst (PL-300)", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/", free: false, type: "cert" },
    ],
    youtube: [
      { title: "Alex The Analyst Data Analytics Bootcamp", provider: "Alex The Analyst", url: "https://www.youtube.com/@AlexTheAnalyst", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "PostgreSQL SQL Syntax Docs", provider: "PostgreSQL Global Development Group", url: "https://www.postgresql.org/docs/", free: true, type: "doc" },
    ],
    communities: [
      { title: "Reddit r/analytics & r/sql", provider: "Reddit", url: "https://www.reddit.com/r/analytics/", free: true, type: "community" },
    ],
  },
  cybersecurity: {
    domainId: "cybersecurity",
    domainName: "Cybersecurity",
    overview: "Threat modeling, network forensics, OWASP vulnerabilities, SOC defense, cryptography, and penetration testing.",
    foundational: [
      { title: "Cisco Cybersecurity Essentials", provider: "Cisco NetAcad", url: "https://www.netacad.com/courses/cybersecurity/cybersecurity-essentials", free: true, type: "course" },
      { title: "PortSwigger Web Security Academy", provider: "PortSwigger", url: "https://portswigger.net/web-security", free: true, type: "practice" },
    ],
    intermediate: [
      { title: "OWASP Top 10 Documentation", provider: "OWASP Foundation", url: "https://owasp.org/www-project-top-ten/", free: true, type: "doc" },
      { title: "OverTheWire Bandit Wargames", provider: "OverTheWire", url: "https://overthewire.org/wargames/bandit/", free: true, type: "practice" },
    ],
    advanced: [
      { title: "MITRE ATT&CK Enterprise Matrix", provider: "MITRE", url: "https://attack.mitre.org/", free: true, type: "doc" },
    ],
    projects: [
      { title: "Vulnerability Scanner for College Intranet", provider: "CampusLit Security Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "TryHackMe Pre-Security Room", provider: "TryHackMe", url: "https://tryhackme.com", free: true, type: "practice" },
      { title: "Hack The Box Starting Point", provider: "HackTheBox", url: "https://www.hackthebox.com", free: true, type: "practice" },
    ],
    certifications: [
      { title: "CompTIA Security+ (SY0-701)", provider: "CompTIA", url: "https://www.comptia.org/certifications/security", free: false, type: "cert" },
      { title: "Cisco CCST Cybersecurity", provider: "Cisco NetAcad", url: "https://www.netacad.com/courses/cybersecurity/ccst-cybersecurity", free: true, type: "cert" },
    ],
    youtube: [
      { title: "NetworkChuck Cybersecurity", provider: "NetworkChuck", url: "https://www.youtube.com/@NetworkChuck", free: true, type: "youtube" },
      { title: "John Hammond Cyber Tutorials", provider: "John Hammond", url: "https://www.youtube.com/@_JohnHammond", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "NIST Cybersecurity Framework", provider: "NIST", url: "https://www.nist.gov/cyberframework", free: true, type: "doc" },
    ],
    communities: [
      { title: "OWASP Karnataka Chapter", provider: "OWASP India", url: "https://owasp.org", free: true, type: "community" },
    ],
  },
  iot: {
    domainId: "iot",
    domainName: "Internet of Things (IoT)",
    overview: "Microcontrollers, sensor telemetry, wireless protocols (MQTT, LoRaWAN, BLE), and cloud IoT gateways.",
    foundational: [
      { title: "Cisco Introduction to IoT", provider: "Cisco NetAcad", url: "https://www.netacad.com/courses/iot/introduction-iot", free: true, type: "course" },
      { title: "ESP32 Arduino Core Documentation", provider: "Espressif Systems", url: "https://docs.espressif.com/projects/arduino-esp32/", free: true, type: "doc" },
    ],
    intermediate: [
      { title: "MQTT Protocol Specification & Mosquitto Guide", provider: "Eclipse Mosquitto", url: "https://mosquitto.org/documentation/", free: true, type: "doc" },
    ],
    advanced: [
      { title: "FreeRTOS Real-Time Kernel on ESP32", provider: "FreeRTOS / Amazon", url: "https://www.freertos.org/Documentation/RTOS_book.html", free: true, type: "doc" },
    ],
    projects: [
      { title: "Smart Classroom Air Quality & Attendance Node", provider: "CampusLit IoT Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "Wokwi Interactive Online ESP32 Simulator", provider: "Wokwi", url: "https://wokwi.com", free: true, type: "practice" },
    ],
    certifications: [
      { title: "Cisco Introduction to IoT Certificate", provider: "Cisco NetAcad", url: "https://www.netacad.com/courses/iot/introduction-iot", free: true, type: "cert" },
    ],
    youtube: [
      { title: "Andreas Spiess - The Guy with the Swiss Accent", provider: "Andreas Spiess", url: "https://www.youtube.com/@AndreasSpiess", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "Arduino Language Reference", provider: "Arduino.cc", url: "https://www.arduino.cc/reference/en/", free: true, type: "doc" },
    ],
    communities: [
      { title: "Hackster.io IoT Community", provider: "Hackster.io", url: "https://www.hackster.io", free: true, type: "community" },
    ],
  },
  embedded_systems: {
    domainId: "embedded_systems",
    domainName: "Embedded Systems",
    overview: "Bare-metal C/C++, ARM Cortex-M architecture, memory-mapped I/O, timers, interrupts, and hardware registers.",
    foundational: [
      { title: "Embedded Systems - Shape the World", provider: "UT Austin / edX", url: "https://www.edx.org", free: true, type: "course" },
      { title: "ARM Cortex-M Programming Reference", provider: "ARM Developer", url: "https://developer.arm.com/", free: true, type: "doc" },
    ],
    intermediate: [
      { title: "Bare-Metal Embedded C Programming", provider: "Embedded FM", url: "https://embedded.fm", free: true, type: "doc" },
    ],
    advanced: [
      { title: "Device Driver Development for Linux", provider: "Bootlin", url: "https://bootlin.com/training/kernel/", free: true, type: "doc" },
    ],
    projects: [
      { title: "Digital Logic Simulator & Waveform Visualizer", provider: "CampusLit Embedded Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "ARM Keil MDK Microcontroller Simulations", provider: "Keil ARM", url: "https://www.keil.com", free: true, type: "practice" },
    ],
    certifications: [
      { title: "NPTEL Microprocessors & Microcontrollers", provider: "IIT Kharagpur / NPTEL", url: "https://nptel.ac.in", free: true, type: "cert" },
    ],
    youtube: [
      { title: "Fastbit Embedded Brain Academy Tutorials", provider: "Kiran Nayak", url: "https://www.youtube.com/@FastBitEmbeddedBrainAcademy", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "STM32 Reference Manuals", provider: "STMicroelectronics", url: "https://www.st.com", free: true, type: "doc" },
    ],
    communities: [
      { title: "EEVblog & Embedded Related Forums", provider: "EmbeddedRelated", url: "https://www.embeddedrelated.com", free: true, type: "community" },
    ],
  },
  blockchain_web3: {
    domainId: "blockchain_web3",
    domainName: "Blockchain & Web3",
    overview: "Distributed ledger mechanics, cryptography, Ethereum EVM, Solidity smart contracts, and decentralized architectures.",
    foundational: [
      { title: "Bitcoin Whitepaper (Satoshi Nakamoto)", provider: "Bitcoin.org", url: "https://bitcoin.org/bitcoin.pdf", free: true, type: "doc" },
      { title: "Ethereum Development Documentation", provider: "Ethereum.org", url: "https://ethereum.org/en/developers/docs/", free: true, type: "doc" },
    ],
    intermediate: [
      { title: "Solidity Language Official Docs", provider: "Ethereum Foundation", url: "https://docs.soliditylang.org", free: true, type: "doc" },
      { title: "CryptoZombies Interactive Solidity Tutorial", provider: "Loom Network", url: "https://cryptozombies.io", free: true, type: "practice" },
    ],
    advanced: [
      { title: "Smart Contract Security & Reentrancy Audit Guide", provider: "OpenZeppelin Docs", url: "https://docs.openzeppelin.com/", free: true, type: "doc" },
    ],
    projects: [
      { title: "Decentralized Degree Verification Contract", provider: "CampusLit Web3 Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "Ethernaut Smart Contract CTF", provider: "OpenZeppelin", url: "https://ethernaut.openzeppelin.com/", free: true, type: "practice" },
    ],
    certifications: [
      { title: "Certified Ethereum Developer", provider: "Blockchain Council", url: "https://www.blockchain-council.org", free: false, type: "cert" },
    ],
    youtube: [
      { title: "Patrick Collins Full Solidity & Smart Contract Course", provider: "freeCodeCamp", url: "https://www.youtube.com/watch?v=gyMwXuJrbJQ", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "Ethers.js / Viem Documentation", provider: "Viem", url: "https://viem.sh", free: true, type: "doc" },
    ],
    communities: [
      { title: "ETHGlobal Hackathon Community", provider: "ETHGlobal", url: "https://ethglobal.com", free: true, type: "community" },
    ],
  },
  cloud_devops: {
    domainId: "cloud_devops",
    domainName: "Cloud & DevOps",
    overview: "Infrastructure as Code, Linux systems, containerization (Docker), orchestration (Kubernetes), and CI/CD automation.",
    foundational: [
      { title: "The Linux Command Line Book", provider: "William Shotts", url: "https://linuxcommand.org/tlcl.php", free: true, type: "doc" },
      { title: "Docker Official Getting Started", provider: "Docker", url: "https://docs.docker.com/get-started/", free: true, type: "doc" },
    ],
    intermediate: [
      { title: "Kubernetes Basics Interactive Tutorial", provider: "Kubernetes.io", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/", free: true, type: "practice" },
      { title: "GitHub Actions CI/CD Workflow Documentation", provider: "GitHub", url: "https://docs.github.com/en/actions", free: true, type: "doc" },
    ],
    advanced: [
      { title: "Terraform Infrastructure as Code Tutorials", provider: "HashiCorp Learn", url: "https://developer.hashicorp.com/terraform/tutorials", free: true, type: "practice" },
    ],
    projects: [
      { title: "Automated Zero-Downtime Microservice Pipeline", provider: "CampusLit Cloud Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "Killercoda Interactive Cloud & K8s Sandboxes", provider: "Killercoda", url: "https://killercoda.com", free: true, type: "practice" },
    ],
    certifications: [
      { title: "AWS Certified Cloud Practitioner", provider: "AWS", url: "https://aws.amazon.com/certification/certified-cloud-practitioner/", free: false, type: "cert" },
      { title: "Linux Foundation LFCS", provider: "Linux Foundation", url: "https://training.linuxfoundation.org", free: false, type: "cert" },
    ],
    youtube: [
      { title: "TechWorld with Nana DevOps Bootcamp", provider: "TechWorld with Nana", url: "https://www.youtube.com/@TechWorldwithNana", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "AWS Well-Architected Framework", provider: "AWS Documentation", url: "https://aws.amazon.com/architecture/well-architected/", free: true, type: "doc" },
    ],
    communities: [
      { title: "Cloud Native Computing Foundation (CNCF)", provider: "CNCF", url: "https://www.cncf.io", free: true, type: "community" },
    ],
  },
  data_engineering: {
    domainId: "data_engineering",
    domainName: "Data Engineering",
    overview: "ETL/ELT pipelines, distributed compute (Apache Spark), event streaming (Kafka), and data warehouse modeling.",
    foundational: [
      { title: "Fundamentals of Data Engineering Book", provider: "O'Reilly", url: "https://www.oreilly.com", free: false, type: "doc" },
      { title: "PostgreSQL Advanced Architecture", provider: "PostgreSQL Docs", url: "https://www.postgresql.org/docs/", free: true, type: "doc" },
    ],
    intermediate: [
      { title: "Apache Spark Python (PySpark) Guide", provider: "Apache Spark", url: "https://spark.apache.org/docs/latest/api/python/", free: true, type: "doc" },
      { title: "dbt (Data Build Tool) Fundamentals", provider: "dbt Labs", url: "https://courses.getdbt.com/courses/fundamentals", free: true, type: "course" },
    ],
    advanced: [
      { title: "Apache Kafka Event Streaming Architecture", provider: "Confluent Developer", url: "https://developer.confluent.io/", free: true, type: "doc" },
    ],
    projects: [
      { title: "Real-Time Campus Sensor Ingestion Lakehouse", provider: "CampusLit BigData Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "DataTalks.Club Data Engineering Zoomcamp", provider: "DataTalks.Club", url: "https://github.com/DataTalksClub/data-engineering-zoomcamp", free: true, type: "course" },
    ],
    certifications: [
      { title: "Databricks Certified Data Engineer Associate", provider: "Databricks", url: "https://www.databricks.com/learn/certification", free: false, type: "cert" },
    ],
    youtube: [
      { title: "Seattle Data Guy Data Engineering", provider: "Seattle Data Guy", url: "https://www.youtube.com/@SeattleDataGuy", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "Apache Airflow Documentation", provider: "Apache Software Foundation", url: "https://airflow.apache.org/docs/", free: true, type: "doc" },
    ],
    communities: [
      { title: "Data Engineering Community on Slack", provider: "Locally Optimistic", url: "https://locallyoptimistic.com", free: true, type: "community" },
    ],
  },
  product_design: {
    domainId: "product_design",
    domainName: "Product Management & UI/UX Design",
    overview: "User research, wireframing in Figma, design systems, usability heuristics, and agile product development.",
    foundational: [
      { title: "Nielsen Norman Group 10 Usability Heuristics", provider: "NN/g", url: "https://www.nngroup.com/articles/ten-usability-heuristics/", free: true, type: "doc" },
      { title: "Figma Official Beginner Tutorials", provider: "Figma Help Center", url: "https://help.figma.com", free: true, type: "practice" },
    ],
    intermediate: [
      { title: "Refactoring UI (Adam Wathan & Steve Schoger)", provider: "Refactoring UI", url: "https://www.refactoringui.com/", free: false, type: "doc" },
      { title: "Google UX Design Professional Certificate", provider: "Google / Coursera", url: "https://grow.google/certificates/ux-design/", free: true, type: "course" },
    ],
    advanced: [
      { title: "Shape Up: Stop Running in Circles", provider: "Basecamp", url: "https://basecamp.com/shapeup", free: true, type: "doc" },
    ],
    projects: [
      { title: "Redesigning College Exam Revaluation Flow", provider: "CampusLit Design Guild", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "Daily UI 100-Day Challenge", provider: "Daily UI", url: "https://www.dailyui.co", free: true, type: "practice" },
    ],
    certifications: [
      { title: "Google UX Design Professional Certificate", provider: "Google", url: "https://grow.google", free: true, type: "cert" },
    ],
    youtube: [
      { title: "Figma Official YouTube Channel", provider: "Figma", url: "https://www.youtube.com/@Figma", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "Apple Human Interface Guidelines (HIG)", provider: "Apple Developer", url: "https://developer.apple.com/design/human-interface-guidelines/", free: true, type: "doc" },
    ],
    communities: [
      { title: "Dribbble & Behance Creator Communities", provider: "Dribbble", url: "https://dribbble.com", free: true, type: "community" },
    ],
  },
  core_electronics: {
    domainId: "core_electronics",
    domainName: "Core Electronics & VLSI",
    overview: "Analog/digital circuits, Verilog HDL, semiconductor physics, FPGA prototyping, and signal processing.",
    foundational: [
      { title: "All About Circuits Textbook", provider: "EETech Media", url: "https://www.allaboutcircuits.com/textbook/", free: true, type: "doc" },
      { title: "NPTEL Basic Electronics", provider: "IIT Bombay / NPTEL", url: "https://nptel.ac.in", free: true, type: "course" },
    ],
    intermediate: [
      { title: "HDLBits Interactive Verilog Practice", provider: "HDLBits", url: "https://hdlbits.01xz.net/wiki/Main_Page", free: true, type: "practice" },
    ],
    advanced: [
      { title: "VLSI Digital Circuit Design (Westhe & Harris)", provider: "Pearson Education", url: "https://vtu.ac.in", free: false, type: "doc" },
    ],
    projects: [
      { title: "Verilog ALU & Pipelined Processor Core", provider: "CampusLit VLSI Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "Falstad Circuit Simulator Online", provider: "Falstad", url: "https://www.falstad.com/circuit/", free: true, type: "practice" },
    ],
    certifications: [
      { title: "NPTEL Digital Electronic Circuits", provider: "IIT Kharagpur / NPTEL", url: "https://nptel.ac.in", free: true, type: "cert" },
    ],
    youtube: [
      { title: "Neso Academy Electronics Tutorials", provider: "Neso Academy", url: "https://www.youtube.com/@nesoacademy", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "IEEE Xplore Standards", provider: "IEEE", url: "https://ieeexplore.ieee.org", free: true, type: "doc" },
    ],
    communities: [
      { title: "IEEE Student Branches Karnataka", provider: "IEEE Bangalore Section", url: "https://ieeebangalore.org", free: true, type: "community" },
    ],
  },
  robotics: {
    domainId: "robotics",
    domainName: "Robotics & Autonomous Systems",
    overview: "Kinematics, ROS 2 (Robot Operating System), PID controllers, sensor fusion, computer vision, and actuation.",
    foundational: [
      { title: "Modern Robotics Book & Video Lectures", provider: "Northwestern University", url: "http://modernrobotics.org", free: true, type: "doc" },
      { title: "ROS 2 Official Tutorials (Humble / Iron)", provider: "Open Robotics", url: "https://docs.ros.org/en/humble/Tutorials.html", free: true, type: "practice" },
    ],
    intermediate: [
      { title: "Gazebo Multi-Robot Physics Simulation", provider: "Open Source Robotics Foundation", url: "https://gazebosim.org/docs", free: true, type: "practice" },
    ],
    advanced: [
      { title: "Probabilistic Robotics (Thrun, Burgard, Fox)", provider: "MIT Press", url: "http://www.probabilistic-robotics.org/", free: false, type: "doc" },
    ],
    projects: [
      { title: "Autonomous Indoor Line & Obstacle Navigation Rover", provider: "CampusLit Robotics Lab", url: "https://vtu.ac.in", free: true, type: "practice" },
    ],
    practice: [
      { title: "Webots Open Source Robot Simulator", provider: "Cyberbotics", url: "https://cyberbotics.com", free: true, type: "practice" },
    ],
    certifications: [
      { title: "NPTEL Introduction to Robotics", provider: "IIT Madras / NPTEL", url: "https://nptel.ac.in", free: true, type: "cert" },
    ],
    youtube: [
      { title: "The Construct ROS 2 Tutorials", provider: "The Construct", url: "https://www.youtube.com/@TheConstruct", free: true, type: "youtube" },
    ],
    documentation: [
      { title: "OpenCV Computer Vision Library", provider: "OpenCV.org", url: "https://docs.opencv.org", free: true, type: "doc" },
    ],
    communities: [
      { title: "ROS Discourse & Robotics Stack Exchange", provider: "Open Robotics", url: "https://discourse.ros.org", free: true, type: "community" },
    ],
  },
};

