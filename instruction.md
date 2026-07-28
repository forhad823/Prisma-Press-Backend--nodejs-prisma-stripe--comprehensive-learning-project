# Project Memory & Analysis Instructions

To ensure that the AI coding assistant maintains full context throughout the lifecycle of this project without forgetting or hallucinating details, the following instructions must be strictly followed:

## 1. Directory Structure
- Create a folder named `agy` in the root of the project.
  ```
  [Project Root]
  ├── agy/
  │   ├── project_overview.md
  │   └── chat_001_initial_analysis.md (example)
  ├── instruction.md
  └── ...
  ```

## 2. Memory Files
- **Project Overview (`agy/project_overview.md`)**:
  - Contains a high-level summary of the project structure, technology stack, and current state.
  - Lists the completed features, pending tasks, database schema models, and ongoing issues.
  - Must be kept up-to-date with every prompt, chat interaction, and code change.
- **Chat/Prompt Summaries (`agy/chat_XXX_<topic>.md`)**:
  - After **every** chat turn or prompt execution, create a new markdown file in the `agy/` folder.
  - Use a sequential numbering scheme (e.g., `chat_001_initial_analysis.md`, `chat_002_comment_service.md`, etc.).
  - Document:
    1. The user's input/request/question.
    2. The analysis and key decisions made.
    3. The files created or modified.
    4. The summary of the response/answers.
    5. Next steps.

## 3. Usage of Memory
- These files serve as the persistent, explicit memory for the agent.
- Before beginning new tasks, the agent should read `agy/project_overview.md` and the recent chat files to restore context.
