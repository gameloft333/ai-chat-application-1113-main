# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.19.3] - 2024-04-03

### Added
- Added voice support for AI characters. Users can now choose to receive responses as text, voice, or both.
- Implemented a voice synthesis service to handle text-to-speech functionality.

### Changed
- Updated ChatInterface to handle different response modes based on configuration.

## [0.16.0] - 2024-03-31

### Changed
- Removed occupation-based prompt files from the prompts folder
- Updated CharacterSelector to use character names from nameDatabase
- Modified character configurations to use new prompt file names

## [0.15.0] - 2024-03-30

### Changed
- Updated character names to use the nameDatabase instead of role names
- Renamed prompt files to match character IDs (e.g., bertha.txt instead of doctor.txt)
- Updated CharacterSelector component to use the new naming scheme
- Modified llm-config.ts to use character IDs instead of roles

### Fixed
- Resolved issue with loading character prompts

## [0.14.0] - 2024-03-29

### Added
- Implemented name database with 100 female names
- Updated CharacterSelector to use names from the database for character display
- Re-enabled Zhipu API support

### Changed
- Modified character images to use specific URLs instead of dynamic Unsplash URLs
- Updated prompt loading to use character IDs instead of names
- Refactored CharacterSelector component for better readability and maintainability
- Updated llm-config.ts to randomly select available LLMs for each character

### Fixed
- Resolved issue with loading character prompts
- Fixed error handling in llm-service.ts

## [0.13.0] - 2024-03-28

### Added
- Implemented name database with 100 female names
- Updated CharacterSelector to use names from the database for character display

### Changed
- Modified character images to use specific URLs instead of dynamic Unsplash URLs
- Updated prompt loading to use character IDs instead of names
- Refactored CharacterSelector component for better readability and maintainability

### Fixed
- Resolved issue with loading character prompts

## [0.12.0] - 2024-03-27

### Changed
- Re-enabled Zhipu API in .env file
- Updated application name to "AI Chat Tavern" in App.tsx

## [0.11.0] - 2024-03-26

### Changed
- Implemented random LLM selection for each character
- Updated error handling in llm-service.ts
- Removed Zhipu API calls from llm-service.ts

### Fixed
- Corrected error messages in ChatInterface component

## [0.10.0] - 2024-03-25

### Added
- Implemented character selection functionality
- Added basic chat interface for interacting with selected character

## [0.9.0] - 2024-03-23

### Added
- Implemented actual API calls for Zhipu, Moonshot, and Gemini AI services
- Added error handling for API calls in ChatInterface component

### Changed
- Updated llm-service.ts to use real API endpoints instead of mock responses
- Modified llm-config.ts to use environment variables for API keys
- Updated ChatInterface to handle potential errors from API calls

### Security
- Implemented use of environment variables for API keys to enhance security

## [0.8.0] - 2024-03-22

### Added
- Created basic project structure using Vite and React
- Implemented initial UI components for the chat interface
- Added placeholder character selection functionality

### Changed
- Updated README.md with project description and setup instructions

## [0.7.0] - 2024-03-21

### Added
- Set up basic Vite project with React and TypeScript
- Installed necessary dependencies
- Created initial project structure

### Changed
- Configured Vite for optimal development experience
- Updated tsconfig.json and package.json with appropriate settings

## [0.6.0] - 2024-03-20

### Added
- Initialized Git repository
- Created .gitignore file

### Changed
- Set up project directory structure

## [0.5.0] - 2024-03-19

### Added
- Conceptualized project idea
- Created initial project planning documents

## [0.4.0] - 2024-03-18

### Added
- Researched potential AI APIs for integration
- Drafted initial API integration plans

## [0.3.0] - 2024-03-17

### Added
- Explored UI/UX design options for chat interface
- Created wireframes for main application screens

## [0.2.0] - 2024-03-16

### Added
- Conducted market research on existing AI chat applications
- Identified unique selling points for the project

## [0.1.0] - 2024-03-15

### Added
- Initial project ideation
- Defined project goals and target audience

## [0.18.0] - 2024-04-02

### Changed
- Updated character prompts to prevent AI from revealing its virtual nature
- Added additional filtering in llm-service.ts to remove content that might expose AI identity
