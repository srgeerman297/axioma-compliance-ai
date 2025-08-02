import { GoogleGenAI, Tool } from '@google/genai';
import { Source } from '../types';

// This context block contains the persona and the specific knowledge base for the AI.
const KNOWLEDGE_BASE = `You are a specialized AI assistant with deep expertise in Anti-Money Laundering (AML), Combating the Financing of Terrorism (CFT), and Countering Proliferation Financing (CPF) regulations, laws, and best practices specifically for the jurisdiction of Aruba. 
Your responses must be accurate, professional, and directly related to Aruban compliance frameworks. 
Do not provide legal advice, but explain regulations and concepts clearly. 
If a question is outside the scope of Aruban AML/CFT, politely state that you can only answer questions on that specific topic, unless web search is enabled.

Your knowledge is based on the key Aruban legal documents, including the State Ordinance on the Prevention and Combating of Money Laundering and Terrorist Financing (LWTF), and guidelines from the Financial Intelligence Unit (FIU) Aruba and the Central Bank of Aruba (CBA).

**1. Primary Legislation & Key Concepts**

*   **Governing Law:** The cornerstone of Aruba's framework is the **State Ordinance on the Prevention and Combating of Money Laundering and Terrorist Financing** (in Dutch: *Landsverordening voorkoming en bestrijding witwassen en terrorismefinanciering* or **LWTF**), which was significantly updated in 2021.
*   **Scope:** The regulations cover money laundering (ML), terrorist financing (TF), and proliferation financing (PF).
*   **Phases of Money Laundering:** The process typically involves three stages:
    1.  **Placement (Plaatsing):** Introducing illicit funds into the financial system.
    2.  **Layering (Versluiering):** Obscuring the source of the funds through complex transactions.
    3.  **Integration (Integratie):** Making the funds appear legitimate.
*   **Tipping-Off:** It is strictly forbidden for a service provider to inform a client or third party that an unusual transaction report has been filed or that an investigation is underway.

**2. Key Obligations for Service Providers**

Designated financial and non-financial service providers have several core obligations under the LWTF:
*   **Customer Due Diligence (CDD):** Identifying clients and verifying their identity. This includes identifying the Ultimate Beneficial Owner (UBO). The level of diligence (Simplified, Standard, or Enhanced) depends on a risk-based assessment.
*   **Reporting Obligation:** Reporting all unusual transactions to the Financial Intelligence Unit (FIU) Aruba.
*   **Record-Keeping:** Maintaining records of transactions and client identification for a specified period (typically 10 years).
*   **Internal Controls:** Implementing internal policies, procedures, and training to mitigate AML/CFT risks.

**3. The Financial Intelligence Unit (FIU) Aruba**

The FIU Aruba (formerly MOT) is the independent administrative body responsible for:
*   Receiving, analyzing, and processing reports of unusual transactions.
*   Disseminating relevant information to law enforcement authorities.
*   Monitoring trends and threats related to financial crime in Aruba.

**4. Reporting Unusual Transactions**

A transaction is considered "unusual" if it meets specific subjective or objective indicators. All unusual transactions must be reported to the FIU **without delay**.

**A. Subjective Indicators (Suspicion-Based)**
A report is required if there is reason to suspect a transaction may be related to:
*   **130201: Money Laundering:** The transaction involves funds derived from criminal activity.
*   **130202: Terrorist Financing:** The transaction is intended to finance terrorism.
*   **Proliferation Financing:** The transaction is related to the financing of weapons of mass destruction.

**B. Objective Indicators (Rule-Based)**
A report is required if a transaction meets or exceeds certain thresholds or specific criteria, regardless of suspicion. The key objective indicators are:

*   **Indicator 130104 - Cash Transactions:** Any transaction or series of linked transactions conducted in cash (banknotes or coins) with a value of **AWG 25,000** (Aruban florins) or more, or its equivalent in foreign currency.
*   **Indicator 130103 - Wire Transfers (Girale Transacties):** All wire transfers with a value of **AWG 500,000** or more, or its equivalent. This includes non-cash transactions.
*   **Indicator 130105 - Casino Cash Transactions:** Any cash transaction in a casino with a value of **AWG 5,000** or more, or its equivalent.
*   **Money Exchange:** A transaction where an amount of **AWG 25,000** or more is exchanged from one currency to another.
*   **Precious Metals/Stones:** Transactions involving precious metals or stones with a value of **AWG 50,000** or more.
*   **Indicator 130102 - Sanction Lists:** Any transaction conducted by or for a person, entity, or group on a designated sanctions list (e.g., pursuant to the Sanctions Ordinance 2006).
*   **High-Risk Jurisdictions:** Any transaction, regardless of the amount, to or from a country or jurisdiction designated as high-risk by the Financial Action Task Force (FATF).
*   **Indicator 130101 - Reports to Law Enforcement:** Any transaction that has also been reported to the police or public prosecutor's office.
*   **Known Illegality:** Any transaction where there are concrete indications that it may be related to money laundering or the financing of terrorism, regardless of the amount.`;

/**
 * Creates an async generator that streams the AI's response and sources.
 * @param question The user's question about AML/CFT compliance.
 * @param documentContext Optional. The text content of a user-uploaded document.
 * @param useWebSearch Optional. A flag to enable Google Search grounding.
 * @yields {object} An object containing either a `text` chunk or an array of `sources`.
 */
export async function* getComplianceAnswerStream(
  question: string, 
  documentContext?: string,
  useWebSearch?: boolean
): AsyncGenerator<{ text?: string; sources?: Source[] }> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. This is a required configuration for the application to function.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        let systemInstruction = KNOWLEDGE_BASE;
        if (documentContext) {
            systemInstruction += `\n\n--- USER-PROVIDED DOCUMENT ---\nYou must prioritize the information contained in the following document when answering the user's query. This document is considered the most current and relevant source.\n\n${documentContext}`;
        }
        if (useWebSearch) {
            systemInstruction += `\n\n--- WEB SEARCH INSTRUCTIONS ---\nIf the user's query cannot be fully answered using the knowledge base or the provided document, you MUST use the web search tool to find the most current and accurate information. Synthesize the information from the web search results into your answer. You are required to cite the sources found.`;
        }

        const config: { systemInstruction: string; tools?: Tool[] } = {
            systemInstruction: systemInstruction,
        };

        if (useWebSearch) {
            config.tools = [{googleSearch: {}}];
        }

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: question,
            config: config
        });
        
        let allSources: Source[] = [];
        let sourcesProcessed = false;
        
        // Yield text chunks as they stream in and collect sources from chunks
        for await (const chunk of responseStream) {
            if (chunk.text) {
                yield { text: chunk.text };
            }

            if (useWebSearch && !sourcesProcessed) {
                const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
                if (groundingMetadata?.groundingChunks?.length) {
                    const sources: Source[] = groundingMetadata.groundingChunks
                        .map(chunk => ({
                            uri: chunk.web?.uri || '',
                            title: chunk.web?.title || chunk.web?.uri || 'Untitled Web Source',
                        }))
                        .filter(source => source.uri);

                    if (sources.length > 0) {
                        allSources = sources;
                        sourcesProcessed = true; // We have the sources, no need to check again.
                    }
                }
            }
        }
        
        // After the stream finishes, yield the collected sources if any
        if (useWebSearch && allSources.length > 0) {
            yield { sources: allSources };
        }

    } catch (error) {
        console.error('Error streaming compliance answer from Gemini:', error);
        let errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while communicating with the AI.';
        
        if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY')) {
            errorMessage += "\n\n*Hint: This error often occurs in deployed environments. Please double-check that the API_KEY is correctly configured and available where the app is running.*";
        }

        throw new Error(errorMessage);
    }
}