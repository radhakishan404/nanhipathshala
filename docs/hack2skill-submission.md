# Hack2skill Submission

## Track

Track 1: Build and deploy AI agents using Gemini, ADK, and Cloud Run

## Project Title

NanhiPathshala

## One-Line Pitch

NanhiPathshala is a Hindi-first AI voice tutor for Indian mothers and children that explains homework simply, answers by voice, and supports photo-based learning using Gemini, ADK, and Cloud Run.

## Problem Statement

Many Indian mothers want to support their children’s learning at home, but most digital learning tools are English-first, expensive, or too complex for young children. Children often need simple Hindi explanations, patient repetition, and emotional encouragement. Mothers need a quick and practical summary of what the child learned and where help is still needed.

## Solution

NanhiPathshala gives families a Hindi-first AI tutor that can listen to a child’s question, understand a homework photo, explain concepts in simple language, answer by voice, and ask one short follow-up question to reinforce learning. It also creates a concise summary for the mother after each interaction.

## What We Built

- Google ADK tutoring agent with a real `root_agent`
- Gemini on Vertex AI for reasoning and lesson generation
- Cloud Run deployment for the agent API and the web app
- Hindi-first mobile interface for moms and kids
- Speech-to-Text for voice questions
- Text-to-Speech for spoken replies
- Photo upload and camera capture for homework help
- Parent summary and follow-up question flow

## Key Features

- Voice-first tutoring in Hindi
- Audio reply by default for voice-led questions
- Homework photo understanding
- Child-friendly follow-up questions
- Parent-friendly summary
- Mobile-first UI designed for low-friction use

## Target Users

- Indian mothers supporting children in classes 1 to 5
- Young learners who are more comfortable in Hindi than English
- Families looking for a low-cost home learning companion

## Google Technology Used

- Google Agent Development Kit (ADK)
- Gemini 2.5 Flash
- Vertex AI
- Cloud Run
- Cloud Build
- Google Cloud Speech-to-Text
- Google Cloud Text-to-Speech

## Why This Fits Track 1

NanhiPathshala is a real AI agent built with Google ADK, powered by Gemini on Vertex AI, and deployed on Cloud Run. It uses tool-based teaching flows and real runtime deployment, which aligns directly with Track 1.

## Impact

NanhiPathshala reduces learning stress at home by giving children a patient AI teacher and giving mothers a simple summary instead of a complicated dashboard. It is designed as a low-cost side-project MVP that can be used on a phone without requiring expensive infrastructure.

## Future Scope

- Native Gemini Live audio conversations
- More Indian language support
- Session history synced across devices
- School-aligned topic packs by class level

## Submission Links

- GitHub repo: https://github.com/radhakishan404/nanhipathshala
- Live app: https://nanhipathshala-web-766923141169.us-central1.run.app
- Agent API: https://nanhipathshala-agent-766923141169.us-central1.run.app
- License: MIT
