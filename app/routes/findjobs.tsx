import React, { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";

// Assuming these imports are available in your environment
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { prepareInstructionsFindJob } from "~/constants";

const FindJobs = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore(); // Puter store hook
  const navigate = useNavigate();

  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [relevantJobs, setRelevantJobs] = useState<RelevantJob[]>([]); // New state for job results

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  // --- PHASE 1 & 2: Main Logic ---
  const handleSearch = async ({
    city,
    jobTitle,
    file,
  }: JobDetails & { file: File | null }) => {
    setIsProcessing(true);
    setRelevantJobs([]); // Clear previous results

    // 1. Resume Processing & Skill Extraction (Only if a file is provided)
    let extractedSkills: string[] = [];
    let uploadedFile: any = null;

    if (file) {
      try {
        // The AI analysis part is similar to your Upload component
        setStatusText("Uploading resume file...");
        uploadedFile = await fs.upload([file]);
        if (!uploadedFile) throw new Error("Failed to upload file");

        setStatusText("Extracting skills using AI...");

        // --- NEW AI INSTRUCTION FOR SKILL EXTRACTION ---
        // We ask the AI to extract and format the skills from the resume content
        const skillExtractionInstructions =
          "Analyze the resume at the provided path. Extract all technical and soft skills and return them as a comma-separated list ONLY. Do not include any other text or formatting.";

        const extractionResponse = await ai.feedback(
          uploadedFile.path,
          skillExtractionInstructions
        );

        if (!extractionResponse)
          throw new Error("Failed to extract skills from resume");

        const skillsText =
          typeof extractionResponse.message.content === "string"
            ? extractionResponse.message.content
            : extractionResponse.message.content[0].text;

        // Simple parsing of the comma-separated list
        extractedSkills = skillsText
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);

        setStatusText(
          `Skills extracted: ${extractedSkills.slice(0, 3).join(", ")}...`
        );
      } catch (error) {
        console.error("Resume analysis failed:", error);
        setStatusText(
          `Error during resume analysis: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        // Continue to search even if analysis fails, just without skills
      }
    }

    // 2. Job Search
    setStatusText("Searching for relevant jobs...");

    // --- CONSTRUCT SEARCH QUERY ---
    let searchQuery = `${jobTitle} ${city}`;
    if (extractedSkills.length > 0) {
      searchQuery += ` skills: ${extractedSkills.join(" OR ")}`;
    }

    console.log(`Final Search Query: ${searchQuery}`);
    // AI-Powered Job Search
    setStatusText("Searching web for relevant jobs...");

    // *** Use the new instruction function here ***
    const jobSearchInstructions = prepareInstructionsFindJob({ searchQuery });

    // Call the AI to perform the job search
    const searchResponse = await ai.feedback(
      uploadedFile.path,
      jobSearchInstructions
    );

    if (!searchResponse) {
      setIsProcessing(false);
      return setStatusText("Error: Failed to get job search results from AI");
    }

    try {
      const responseText =
        typeof searchResponse.message.content === "string"
          ? searchResponse.message.content
          : searchResponse.message.content[0].text;

      // The AI is instructed to return a strict JSON object
      const jobData: AIJobSearchResult = JSON.parse(responseText);

      // Update state with the jobs found by the AI
      setRelevantJobs(jobData.jobsFound);

      setStatusText(`Found ${jobData.jobsFound.length} jobs.`);
    } catch (error) {
      console.error("Failed to parse AI job search response:", error);
      setStatusText("Error: Failed to parse job search results.");
    }

    setIsProcessing(false);
  };

  // --- FORM SUBMISSION HANDLER ---
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const city = formData.get("city") as string;
    const jobTitle = formData.get("job-title") as string;

    // Log the data (as requested)
    console.log("Find Jobs Form Submitted Data:", {
      city,
      jobTitle,
      fileName: file?.name,
    });

    handleSearch({ city, jobTitle, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Find Your Next Role</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan-2.gif"
                className="w-full h-auto max-w-sm mx-auto"
                alt="Processing"
              />
            </>
          ) : (
            <h2>
              Enter your criteria and upload your resume for tailored results.
            </h2>
          )}

          {!isProcessing && relevantJobs.length === 0 && (
            <form
              id="find-jobs-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              {/* City Input */}
              <div className="form-div">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="e.g., London, Remote"
                  id="city"
                  required
                />
              </div>

              {/* Job Title Input */}
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="e.g., Software Engineer"
                  id="job-title"
                  required
                />
              </div>

              {/* Resume Uploader */}
              <div className="form-div">
                <label htmlFor="uploader">
                  Upload Resume (for skill-based matching)
                </label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              {/* Submit Button */}
              <button className="primary-button" type="submit">
                Search & Analyze Jobs
              </button>
            </form>
          )}

          {/* Job Results Display */}
          {/* Job Results Display */}
{relevantJobs.length > 0 && (
    <div className="mt-10 max-w-xl mx-auto p-4 border border-gray-700 rounded-xl shadow-lg bg-gray-900/50">
        <h3 className="text-2xl font-extrabold mb-6 text-center text-gray-100">
            Found {relevantJobs.length} Relevant Jobs:
        </h3>
        
        <div className="space-y-4">
            {relevantJobs.map((job, index) => (
                <a 
                    key={index}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    // SIMPLIFIED CLASSES: Clean background, subtle hover
                    className="
                        block p-4 bg-gray-800 rounded-lg border border-gray-800 
                        hover:bg-gray-700 hover:border-cyan-500 transition duration-150 
                        group
                    "
                >
                    <div className="flex justify-between items-start">
                        {/* Job Title */}
                        <p className="font-bold text-lg text-white group-hover:text-cyan-400">
                            {job.title}
                        </p>
                        {/* External Link Icon */}
                        <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 ml-3 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            ></path>
                        </svg>
                    </div>
                </a>
            ))}
        </div>
        
        {/* Start New Search Button with Simple Styling */}
        <button
            onClick={() => setRelevantJobs([])}
            className="
                mt-8 w-full py-3 px-4 rounded-lg 
                bg-transparent border border-gray-500 text-gray-300 font-semibold 
                hover:bg-gray-700 hover:border-gray-500 transition duration-150
            "
        >
            Start New Search
        </button>
    </div>
)}

        </div>
      </section>
    </main>
  );
};

export default FindJobs;
