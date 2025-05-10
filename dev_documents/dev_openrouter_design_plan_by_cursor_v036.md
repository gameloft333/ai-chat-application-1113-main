## OpenRouter Integration Design Document

**1. Introduction**

*   **Goal**: To integrate OpenRouter as an additional LLM provider within the `llm-service.ts`. This integration will allow the application to leverage OpenRouter's model catalog, specifically with a feature to randomly select and use a free model for generating responses.
*   **Rationale**: Adding OpenRouter expands the variety of available AI models and provides a cost-effective option by utilizing free models. This aligns with providing flexible and diverse LLM choices.
*   **Key Feature**: When OpenRouter is selected as the LLM type, the system will fetch a list of available models from the OpenRouter API, filter for those that are free, and randomly select one for the current request.

**2. Affected Files and High-Level Changes**

*   **`src/types/llm.ts`**:
    *   Modify `LLMType` to include `'openrouter'`.
*   **`src/config/llm-mapping.ts`**:
    *   Add `OPENROUTER: 'openrouter'` to the `LLM_TYPES` constant.
    *   Add a default model identifier for OpenRouter in `DEFAULT_MODEL_NAMES`, e.g., `[LLM_TYPES.OPENROUTER]: 'openrouter/random-free'`. This special identifier will signal the `callOpenRouterAPI` function to perform random free model selection.
*   **`src/config/llm-config.ts`**:
    *   Add the OpenRouter API key (fetched from `.env`) to the `availableLLMs` array.
    *   The functions `getRandomLLM()`, `getBackupLLM(currentType: string)`, and `getCharacterLLM(characterId: string)` will inherently be able to pick OpenRouter if it's configured with an API key and included in `availableLLMs`.
*   **`src/services/llm-service.ts`**:
    *   Add a new `case 'openrouter'` within the `switch` statement in the `callLLMAPI` function.
    *   Implement a new asynchronous function: `callOpenRouterAPI(prompt: string, apiKey: string, modelIdentifier: string): Promise<string>`.
*   **`.env` files (`.env`, `.env.example`, etc.)**:
    *   Add `VITE_OPENROUTER_API_KEY` for storing the OpenRouter API key.
    *   Consider adding `VITE_OPENROUTER_SITE_URL` and `VITE_OPENROUTER_SITE_NAME` for the optional headers `HTTP-Referer` and `X-Title` used by OpenRouter.

**3. Detailed Design for `callOpenRouterAPI` function**

This function will be responsible for interacting with the OpenRouter API.

*   **Function Signature**:
    ```typescript
    async function callOpenRouterAPI(prompt: string, apiKey: string, modelIdentifier: string): Promise<string>
    ```
*   **Parameters**:
    *   `prompt`: The user's input string.
    *   `apiKey`: The OpenRouter API key.
    *   `modelIdentifier`: A string that is either a specific OpenRouter model ID (e.g., `openai/gpt-4o`) or the special identifier (e.g., `openrouter/random-free`) indicating random free model selection.

*   **Core Logic**:
    1.  Initialize a variable `modelToUse: string`.
    2.  **Model Selection**:
        *   If `modelIdentifier` equals the special value for random free model selection (e.g., `'openrouter/random-free'`):
            a.  Make a GET request to the OpenRouter models endpoint: `https://openrouter.ai/api/v1/models`. This endpoint does not require authentication for listing models.
            b.  Parse the JSON response. The models are typically in a `data` array.
            c.  Filter this list to find "free" models. A model can be considered free if:
                *   Its `id` string contains the `:free` suffix (e.g., `"some-model/some-variant:free"`).
                *   OR, its `pricing` object shows zero cost for prompt and completion (e.g., `model.pricing.prompt === "0.000000"` and `model.pricing.completion === "0.000000"`). Verify the exact structure of the `pricing` object from an actual API response.
            d.  If one or more free models are found, randomly select one model ID from this filtered list and assign it to `modelToUse`.
            e.  If no free models are found, either throw an error ("No free OpenRouter models available") or fall back to a pre-defined default OpenRouter model (e.g., `openai/gpt-3.5-turbo` or a specific free one if known). This fallback needs to be decided.
        *   Else (a specific model ID is provided in `modelIdentifier`):
            a.  Assign `modelIdentifier` directly to `modelToUse`.
    3.  **API Call to OpenRouter Chat Completions**:
        *   Make a POST request to `https://openrouter.ai/api/v1/chat/completions`.
        *   **Headers**:
            *   `Authorization: Bearer ${apiKey}`
            *   `Content-Type: application/json`
            *   `HTTP-Referer: ${import.meta.env.VITE_OPENROUTER_SITE_URL || 'YOUR_DEFAULT_SITE_URL'}` (Optional, but recommended by OpenRouter docs)
            *   `X-Title: ${import.meta.env.VITE_OPENROUTER_SITE_NAME || 'YOUR_DEFAULT_SITE_NAME'}` (Optional)
        *   **Request Body** (JSON stringified):
            ```json
            {
              "model": modelToUse, // The selected model ID
              "messages": [
                { "role": "user", "content": prompt }
              ]
              // Other parameters like temperature, max_tokens can be added if needed
            }
            ```
    4.  **Response Handling**:
        *   Check if the request was successful (e.g., HTTP status 200).
        *   Parse the JSON response. The AI's message is typically in `response.choices[0].message.content`.
        *   Return the extracted content string.
    5.  **Error Handling**:
        *   Implement robust error handling for network issues, API errors from OpenRouter (e.g., invalid API key, rate limits, model not found), and cases where parsing fails.
        *   Log errors appropriately.

**4. Configuration for the "Switch Bool"**

*   The "switch bool" mentioned in the user query likely refers to a mechanism (UI toggle, configuration setting, or part of character-specific setup) that determines if OpenRouter should be used.
*   This design primarily addresses the backend service integration. The frontend or configuration logic that utilizes this "switch bool" would use the `LLMType` `'openrouter'` when invoking `getLLMResponse`.
*   For instance, if a character (`getCharacterLLM`) or the random LLM selection (`getRandomLLM`) in `llm-config.ts` is set to use `LLM_TYPES.OPENROUTER`, the `llm-service` will then route the request through `callOpenRouterAPI`.

**5. Adherence to Development Rules (as per `dev_rule_v017.md` and others)**

*   **Rule 1 & 18 (API Keys)**: `VITE_OPENROUTER_API_KEY` will be stored in `.env` files.
*   **Rule 2 (Function Definition)**: New functions (`callOpenRouterAPI`) and type modifications will be properly defined and declared.
*   **Rule 3 (Minimizing Code)**: The changes are modular, adding a new provider without extensively modifying existing ones.
*   **Rule 6 & 7 (No Impact on Existing Logic)**: The addition of OpenRouter is an extension and should not break existing LLM provider functionalities. They will continue to work as before.
*   **Rule 22 (No Redundancy)**: This adds a new, distinct LLM provider gateway (OpenRouter) which aggregates multiple models, different from direct integration of individual models like Zhipu or Gemini.
*   **README Update (Rule 12 & 33)**: After implementation, `README.md` should be updated to include OpenRouter in the list of supported LLMs, mention the new `.env` variables, and briefly describe the free model selection feature.

**6. Next Steps**

*   Review and approve this design document.
*   Proceed with implementation based on this design.
*   Thoroughly test the OpenRouter integration, including successful calls, random free model selection, and error handling.

This design provides a clear path to integrate OpenRouter. Please let me know if you have any questions or would like to proceed with the implementation.
