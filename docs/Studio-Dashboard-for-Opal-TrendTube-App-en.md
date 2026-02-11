# Studio Dashboard Implement - Opal TrendTube App Style

## Opal TrendTube Overview

  - Opal URL: https://opal.google/edit/1bJiv2obqCSnVgJzBMWY_KTHJ1PA0wdcT

  - TrendTube App
    ![TrendTube App](images/trendtube-app.jpg)

## TrendTube Features

### Enter URL: ask_user_youtube_trends_url

  - Placeholder: Enter a YouTube trends URL
  - Advanced settings: 
    - input type : any
    - Input is required: true

### Add Idea: cff759ae-2d81-4307-a198-bef85bda4309

  - Placeholder: 아이디어를 추가하세요
  - Advanced settings: 
    - input type : text
    - Input is required: true

### Add Image: 96d6332f-1919-43c6-80ce-ede8cdba44bc

  - Placeholder: 이미지 파일을 추가하세요
  - Advanced settings: 
    - input type : image
    - Input is required: false

### Extract YouTube Trends: node_step_youtube_trends_content

  - Model: Gemini 3 Pro
  - Prompt:
    - Objective: Use the text generation tool with grounding to retrieve the full webpage content from {{"type": "in", "path": "ask_user_youtube_trends_url", "title": "Enter URL"}}. Analyze the retrieved content to extract specific trending information, including popular topics and themes, to facilitate video idea generation.
  
    - Output Format: Provide a summary of the extracted trending data. Signal the completion of the task using the system_objective_fulfilled tool. You are done when you have successfully retrieved the content and presented the trending analysis.
  
    - User Input / Context: The YouTube trends URL to be processed is 
    {{"type": "in", "path": "ask_user_youtube_trends_url", "title": "Enter URL"}}. 
    {{"type": "in", "path": "cff759ae-2d81-4307-a198-bef85bda4309", "title": "Add Idea"}}

  - Advanced settings: 
    - System Instruction : You are working as part of an AI system, so no chit-chat and no explaining what you're doing and why. DO NOT start with "Okay", or "Alright" or any preambles. Just the output, please.
    - Review with user: false

### Generate Video Ideas: node_step_generated_ideas

  - Model: Gemini 3 Pro
  - Prompt:
    - Objective: Identify popular topics, styles, and themes by analyzing the provided YouTube trends content. Generate creative and viral video ideas based on this analysis.

    - Output Format: A detailed textual description of the video ideas. Verify that the ideas are directly informed by the trends identified in the analysis.

    - User Input / Context: 
    {{"type": "in", "path": "node_step_youtube_trends_content", "title": "Extract YouTube Trends"}} 
    {{"type": "in", "path": "96d6332f-1919-43c6-80ce-ede8cdba44bc", "title": "Add Image"}}

  - Advanced settings: 
    - System Instruction : You are working as part of an AI system, so no chit-chat and no explaining what you're doing and why. DO NOT start with "Okay", or "Alright" or any preambles. Just the output, please.
    - Review with user: false

### Generate YouTube Video: node_step_generate_youtube_video

  - Model: Veo
  - Prompt:
    - Objective: Use the generate_video tool to create a high-quality video based on the provided viral video ideas. Ensure the video incorporates appropriate scene composition, visual style, and transitions that align with the content of the ideas. You are done when the video generation process is complete and the file is available.

    - Output Format: Provide a confirmation that the video has been generated and call system_objective_fulfilled.

    - User Input / Context: Viral video ideas: 
    {{"type": "in", "path": "node_step_generated_ideas", "title": "Generate Video Ideas"}}

  - Advanced settings: 
    - Model Version: Veo3
    - Aspect Ratio: 16:9
    - Disable prompt expansion: false

### Generate Background Music: node_step_generate_video_music

  - Model: Lyria 2
  - Prompt:
    - Objective: Create an instrumental background music track that matches the mood, style, and energy of the video ideas provided in the user input. Analyze the input to determine the appropriate tempo and atmosphere, then use the generate_music_from_text tool to produce a track that enhances the video's impact without overpowering a voiceover.

    - Output Format: A generated music file. Use system_objective_fulfilled once the audio has been successfully generated.

    - User Input / Context: 
    {{"type": "in", "path": "node_step_generated_ideas", "title": "Generate Video Ideas"}}

## Write Narration Script: node_step_generate_video_script

  - Model: Gemini 3 Pro
  - Prompt:
    - Objective: Develop a compelling, engaging, and concise narration script for a video based on the provided viral video ideas. The script should be informative and specifically tailored for a voiceover to effectively convey the core message of the viral concepts.

    - Output Format: A plain text narration script. The response should be formatted as a professional voiceover script ready for production. Call system_objective_fulfilled once the script is generated.

    - User Input / Context:
    {{"type": "in", "path": "node_step_generated_ideas", "title": "Generate Video Ideas"}}

  - Advanced settings: 
    - System Instruction: You are working as part of an AI system, so no chit-chat and no explaining what you're doing and why. DO NOT start with "Okay", or "Alright" or any preambles. Just the output, please.
    - Review with user: false

## Generate Video Voiceover: node_step_generate_video_voiceover

  - Model: AudioLM
  - Prompt:
    - Objective: Use the generate_speech_from_text tool to synthesize the provided script into a professional audio track. Ensure the voiceover is clear, articulate, and paced appropriately for a YouTube video.

    - Output Format: A generated audio file containing the speech synthesis of the script. Confirm completion using the system_objective_fulfilled tool once the audio is created.

    - User Input / Context: 
    {{"type": "in", "path": "node_step_generate_video_script", "title": "Write Narration Script"}}

  - Advanced settings: 
    - Voice: [Male(English), Female(English)]

## Display Video Results Webpage

  - Webpage with auto-layout
  - Prompt:
    - The webpage should present the generated video, music, voiceover, script, and ideas in a sleek, modern, and highly engaging layout.

    - **Layout Organization**: The page will adopt a multi-section, responsive layout designed to prioritize media display while ensuring text content is highly readable.

      1.  **Header**: A clean, fixed header at the top featuring the "TrendTube" logo/title prominently on the left and a page title "Your Viral Video Project Results" centered or on the right.
      2.  **Hero Video Section**: Immediately below the header, a large, prominent section dedicated to the `generate_youtube_video`. This video player should be the focal point, occupying significant horizontal space, ideally centered and scaling responsively.
      3.  **Media Controls Section**: Below the hero video, a dedicated section for the audio elements. This section will display two distinct, clearly labeled audio players: one for `generate_video_music` (Background Music) and another for `generate_video_voiceover` (Voiceover Narration). On larger screens, these players should be arranged side-by-side; on smaller screens, they should stack vertically.
      4.  **Content Details Section**: Following the media controls, a section presenting the textual content.
          *   **Viral Video Ideas**: A concise and prominent display of `generate_viral_video_ideas` at the top of this section, perhaps in a visually distinct card or banner, serving as the introduction to the project.
          *   **Video Script**: Below the ideas, a dedicated, scrollable area or collapsible section for the `generate_video_script`. This ensures long scripts don't overwhelm the page but are easily accessible for review.
      5.  **Overall Flow**: Content should flow logically from the main video to supporting audio, then to the foundational text ideas, and finally the detailed script. Each major section (`Video`, `Audio`, `Ideas`, `Script`) should be visually distinct with clear headings.

    - **Style Design Language**: The visual design approach will be **Modern & Dynamic**, aiming for a **Premium** and **Creative Media Studio** aesthetic.

      *   **Aesthetic Goal**: To create a high-tech, polished, and intuitive interface that feels cutting-edge and effectively showcases the creative output.
      *   **Color Scheme**: A sophisticated dark mode palette. Use deep, desaturated grays or nearly black as primary background colors. Incorporate vibrant, energetic accent colors (e.g., electric blue, neon green, or a rich purple) sparingly to highlight interactive elements, media player controls, and important titles. Text should be light contrasting colors for readability (soft whites, light grays).
      *   **Typography Style**: A clean, modern sans-serif font family (e.g., Inter, Poppins, Lato, or Rubik) for all text, ensuring excellent readability on dark backgrounds. Headings should use a bolder weight or a slightly more impactful sans-serif from the same family to create a strong hierarchy. Body text should be well-spaced for comfort.
      *   **Spacing and Layout Principles**: Generous use of whitespace and consistent padding/margins around all elements to give content room to breathe and reduce visual clutter. Content blocks should have subtle, rounded corners for a softer, more modern feel.
      *   **Visual Elements**: Subtle gradients or shadows on cards/containers to add depth. Smooth transitions and hover effects on interactive elements.

    - **Component Guidelines**:

      *   **Video Player**: Embed the `generate_youtube_video` using a standard HTML5 video player, ensuring it has play/pause, volume, and fullscreen controls. It should scale to fit its container without distortion.
      *   **Audio Players**: For `generate_video_music` and `generate_video_voiceover`, use simple, elegant HTML5 audio players with essential controls (play/pause, progress bar, volume). These should be styled minimally to integrate with the dark theme and accented with the primary accent color.
      *   **Text Display**: The `generate_viral_video_ideas` and `generate_video_script` should be presented in well-structured text blocks, ideally within distinct card-like containers with clear, descriptive headings. The script section should be scrollable if its content is extensive, with a defined maximum height.
      *   **Responsive Design**: Implement a mobile-first approach. All layouts should be flexible, utilizing CSS Grid or Flexbox to adapt seamlessly across various screen sizes, stacking content vertically on smaller devices and arranging it in multi-column layouts on larger screens. Media players should maintain aspect ratios.

    - generate_youtube_video: 
    {{"type": "in", "path": "node_step_generate_youtube_video", "title": "Generate Video"}}

    - generate_video_music: 
    {{"type": "in", "path": "node_step_generate_video_music", "title": "Generate Background Music"}}

    - generate_video_voiceover: 
    {{"type": "in", "path": "node_step_generate_video_voiceover", "title": "Generate Video Voiceover"}}

    - generate_video_script: 
    {{"type": "in", "path": "node_step_generate_video_script", "title": "Write Narration Script"}}

    - generate_viral_video_ideas: 
    {{"type": "in", "path": "node_step_generated_ideas", "title": "Generate Video Ideas"}}

  - Advanced settings: 
    - Model: Gemini 2.5 Pro
    - System Instruction:
      - You are an AI Web Developer. Your task is to generate a single, self-contained HTML document for rendering in an iframe, based on user instructions and data.

      **Visual aesthetic:**
        * Aesthetics are crucial. Make the page look amazing, especially on mobile.
        * Respect any instructions on style, color palette, or reference examples provided by the user.
        * **CRITICAL: Aim for premium, state-of-the-art designs. Avoid simple minimum viable products.**
        * **Use Rich Aesthetics**: The USER should be wowed at first glance by the design. Use best practices in modern web design (e.g. vibrant colors, dark modes, glassmorphism, and dynamic animations) to create a stunning first impression. Failure to do this is UNACCEPTABLE.
        * **Prioritize Visual Excellence**: Implement designs that will WOW the user and feel extremely premium:
            - Avoid generic colors (plain red, blue, green). Use curated, harmonious color palettes (e.g., HSL tailored colors, sleek dark modes).
            - Using modern typography (e.g., from Google Fonts like Inter, Roboto, or Outfit) instead of browser defaults.
            - Use smooth gradients.
            - Add subtle micro-animations for enhanced user experience.
        * **Use a Dynamic Design**: An interface that feels responsive and alive encourages interaction. Achieve this with hover effects and interactive elements. Micro-animations, in particular, are highly effective for improving user engagement.
        * **Thematic Specificity**: Do not just create a generic layout. Define a clear "vibe" or theme based on the content. Use specific aesthetic keywords (e.g., "Glassmorphism", "Neobrutalism", "Minimalist", "Comic Book Style") to guide the design.
        * **Typography Hierarchy**: Explicitly import and use font pairings. Use a distinct Display Font for headers and a highly readable Body Font for text.
        * **Readability**: Pay extra attention to readability. Ensure the text is always readable with sufficient contrast against the background. Choose fonts and colors that enhance legibility.

      **Design and Functionality:**
        * **Component-Based Design**: Do not just dump text into blocks. Semanticize the content into distinct UI components.
        * **Layout Dynamics**: Break the grid. Avoid strict, identical grid columns. Use asymmetrical layouts, Bento grids, or responsive flexbox layouts where some elements span full width to create visual interest and emphasize key content.
        * **Tailwind Configuration**: Extend the Tailwind configuration within a `<script>` block to define custom font families and color palettes that match the theme.
          * Thoroughly analyze the user's instructions to determine the desired type of webpage, application, or visualization. What are the key features, layouts, or functionality?
          * Analyze any provided data to identify the most compelling layout or visualization of it. For example, if the user requests a visualization, select an appropriate chart type (bar, line, pie, scatter, etc.) to create the most insightful and visually compelling representation. Or if user instructions say `use a carousel format`, you should consider how to break the content and any media into different card components to display within the carousel.
          * If requirements are underspecified, make reasonable assumptions to complete the design and functionality. Your goal is to deliver a working product with no placeholder content.
          * Ensure the generated code is valid and functional. Return only the code, and open the HTML codeblock with the literal string "```html".
          * The output must be a complete and valid HTML document with no placeholder content for the developer to fill in.

      **Libraries:** Unless otherwise specified, use:
        * Tailwind for CSS
          * **CRITICAL: Use the Tailwind CDN from `https://cdn.tailwindcss.com`. Do NOT use `tailwind.min.css` or any other local Tailwind file. Always include Tailwind using: `<script src="https://cdn.tailwindcss.com"></script>`**

      **Constraints:**
        * **External Links:** You ARE allowed to generate external links (`<a href="...">` and `window.open(...)`) to external websites (e.g. google.com, wikipedia.org) for user navigation.
        * **NO External Embeds:** Do NOT embed any external resources (e.g. `<script src="...">`, `<img src="...">`, `<iframe src="...">`, `<link href="...">`) from external URLs. Content Security Policy (CSP) will block them.
        * **Media Restriction:** ONLY use media URLs that are explicitly passed in the input. Do NOT generate or hallucinate any other media URLs (e.g. from placeholder sites or external CDNs).
        * **Render All Media:** You MUST render ALL media (images, videos, audio) that are passed in. Do NOT skip or omit any provided media items. Every passed-in media URL must appear in the final HTML output.
        * **Navigation Restriction:** Do NOT generate unneeded fake links or buttons to sub-pages (e.g. "About", "Contact", "Learn More") unless explicitly requested. Stick to the plan and the provided content.
        * **Footer Restriction:** **NEVER** generate any footer content, including legal footers like "All rights reserved" or "Copyright 2024". [It is a violation of Google's policies to hallucinate legal footers.]
