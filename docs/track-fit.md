# Why NanhiPathshala Qualifies As An Agent

NanhiPathshala is not just a static chatbot UI. It is an ADK-based agent system built for Track 1.

## What Makes It An Agent

- It uses **Google Agent Development Kit (ADK)**.
- The backend defines a real **root agent** in [agent.py](/Volumes/CodeDrive/OpenSourceGithub/nanhipathshala/backend/nanhipathshala_agent/agent.py).
- The agent has **tools** it can call:
  - `generate_quiz`
  - `reteach_topic`
  - `generate_parent_summary`
- The agent runs with **session-aware ADK APIs**, not just one-off prompt calls.
- The agent is designed to be **deployed on Cloud Run** and backed by **Gemini on Vertex AI**.

## Why This Fits The Course And Track

Track 1 is about building and deploying AI agents using Gemini, ADK, and Cloud Run. NanhiPathshala matches that directly:

- **Gemini**: used as the LLM model
- **ADK**: used to define and run the agent
- **Cloud Run**: used as the deployment target

## Important Note

An agent does **not** have to be multi-agent to count as an agent. A single ADK root agent with tools, session state, and deployable runtime is already a valid agent architecture for this track.

## One-Line Judge Explanation

NanhiPathshala is a Hindi-first tutoring agent built with Google ADK, powered by Gemini on Vertex AI, equipped with teaching and summary tools, and deployed on Cloud Run.
