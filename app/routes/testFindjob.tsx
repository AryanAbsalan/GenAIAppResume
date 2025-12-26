// ... (existing imports)
import { prepareInstructionsFindJob } from '~/constants'; // Import the new instruction creator

import React, { type FormEvent, useState } from 'react';
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";

// Assuming these imports are available in your environment
import { usePuterStore } from "~/lib/puter"; 
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from '~/constants'; // Assuming this provides the prompt for AI

// --- TYPE DEFINITIONS (For clarity) ---
interface JobDetails {
    city: string;
    jobTitle: string;
}

interface RelevantJob {
    title: string;
    company: string;
    url: string;
}
// --- END TYPE DEFINITIONS ---


const FindJobs = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [relevantJobs, setRelevantJobs] = useState<RelevantJob[]>([]); // New state for job results
        const [statusText, setStatusText] = useState('');
        const [file, setFile] = useState<File | null>(null);
    
    // ... (existing state)

    // --- NEW TYPE FOR AI RESPONSE ---
    interface AIJobSearchResult {
        searchQueryUsed: string;
        jobsFound: RelevantJob[]; // Using the existing RelevantJob interface
    }
    // --- END NEW TYPE ---
    
    // ... (existing handleFileSelect)

    // --- PHASE 1 & 2: Main Logic ---
    const handleSearch = async ({ city, jobTitle, file }: JobDetails & { file: File | null }) => {
        setIsProcessing(true);
        setRelevantJobs([]); 

        let extractedSkills: string[] = [];
        let searchQuery = `${jobTitle} in ${city}`; // Start with title and city
        let uploadedFile: any = null;

        // 1. Resume Processing & Skill Extraction (If a file is provided)
        // ... (This section remains the same as before to get extractedSkills) ...
        if (file) {
            // ... (Your existing file upload and skill extraction logic here) ...
            try {
                setStatusText('Uploading resume file...');
                const uploadedFile = await fs.upload([file]);
                if (!uploadedFile) throw new Error('Failed to upload file');

                setStatusText('Extracting skills using AI...');
                
                const skillExtractionInstructions = 
                    "Analyze the resume at the provided path. Extract all technical and soft skills and return them as a comma-separated list ONLY. Do not include any other text or formatting.";

                const extractionResponse = await ai.feedback(
                    uploadedFile.path,
                    skillExtractionInstructions
                );
                
                if (!extractionResponse) throw new Error('Failed to extract skills from resume');

                const skillsText = typeof extractionResponse.message.content === 'string'
                    ? extractionResponse.message.content
                    : extractionResponse.message.content[0].text;
                
                extractedSkills = skillsText
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter((s: string) => s.length > 0);
                
                setStatusText(`Skills extracted: ${extractedSkills.slice(0, 3).join(', ')}...`);

            } catch (error) {
                console.error("Resume analysis failed:", error);
                setStatusText(`Error during resume analysis, searching without skills: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        // 2. Refine Search Query with Extracted Skills
        if (extractedSkills.length > 0) {
            // Refine the search query using the extracted skills
            searchQuery += ` (${extractedSkills.join(' OR ')})`;
        }
        
        console.log(`Final Job Search Query Sent to AI: ${searchQuery}`);
        
        // 3. AI-Powered Job Search
        setStatusText('Searching web for relevant jobs...');

        // *** Use the new instruction function here ***
        const jobSearchInstructions = prepareInstructionsFindJob({ searchQuery });

        // Call the AI to perform the job search
        const searchResponse = await ai.feedback(
            uploadedFile.path,
            jobSearchInstructions
        );

        if (!searchResponse) {
            setIsProcessing(false);
            return setStatusText('Error: Failed to get job search results from AI');
        }

        try {
            const responseText = typeof searchResponse.message.content === 'string'
                ? searchResponse.message.content
                : searchResponse.message.content[0].text;
            
            // The AI is instructed to return a strict JSON object
            const jobData: AIJobSearchResult = JSON.parse(responseText);
            
            // Update state with the jobs found by the AI
            setRelevantJobs(jobData.jobsFound);
            
            setStatusText(`Found ${jobData.jobsFound.length} jobs.`);
        } catch (error) {
            console.error("Failed to parse AI job search response:", error);
            setStatusText('Error: Failed to parse job search results.');
        }

        setIsProcessing(false);
    }
    // ... (rest of the component remains the same, including handleSubmit and the return block) ...

    
}

export default FindJobs;