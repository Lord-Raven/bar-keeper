# Stage Template for Chub

This is a template stage that does nothing, to be used as a base
when developing stages. Please clone it [from GitHub](https://github.com/CharHubAI/stage-template) to use as a template.

# Overview

A Stage is a software component written by other people that can be used within a chat with a language model. They are meant to add functionality like expression packs (showing a character's emotional state with a set of images), UIs for mini-games, special prompt handling, or even interacting with third-party APIs. If you're familiar with React and/or TypeScript, you can write a stage yourself.

### Stage Use Cases
- Creating a UI for a world, character, or setting
- Making RPGs and other multimedia experiences
- Custom stat blocks that can do math and handle state correctly
- Specific input/output handling in code to deal with quirks of a particular model

### Why develop a stage instead of making something from scratch?
- **Intuitive Development:** The stages framework and platform were created with developers in mind from the ground up, resulting in as straightforward an interface as possible with a negligible learning curve. 
- **Cross-Platform:** Stages are write once, run everywhere. When you commit, your stage is immediately built and available on the web, iOS and Android mobile devices, and the Vision Pro, with support for more platforms incoming. 
- **Multimedia:** Language, imagery, audio, and everything else can add up to a half-dozen or more APIs and interfaces that need to be set up, tested, monitored. With a stage, a unified interface for all of it is built in.
- **Audience Reach:** Many gaming and multimedia platforms ban GenAI content outright, or have userbases hostile to it. Chub has millions of people specifically here for generative AI.
- **Peace of Mind:** It has become a trope for passion projects using OpenAI and other APIs to get destroyed by hostiles reverse engineering it into a free proxy. If developed as a stage, it's not your problem, and you can focus on what matters.
- **Actively Developed Platform:** This is just the beginning. Scheduling, full VR/AR support, non-React implementations, and more are incoming.

