// --- END TYPE DEFINITIONS ---
interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    imagePath: string;
    resumePath: string;
    feedback: Feedback;
}

interface Feedback {
    overallScore: number;
    ATS: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
        }[];
    };
    toneAndStyle: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    content: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    structure: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    skills: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
}

interface Job {
    title: string;
    description: string;
    location: string;
    requiredSkills: string[];
}

interface JobDetails {
    city: string;
    jobTitle: string;
}

interface RelevantJob {
    title: string;
    company: string;
    url: string;
}

interface AIJobSearchResult {
    searchQueryUsed: string;
    jobsFound: RelevantJob[]; // Using the existing RelevantJob interface
}
