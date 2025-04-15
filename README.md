# Cut-Up Machine

A modern web application for creating literary cut-ups, inspired by the technique popularized by William S. Burroughs and Brion Gysin.

![Cut-Up Machine Screenshot](screenshot.png)

## Overview

The Cut-Up Machine allows users to create textual collages by cutting up and recombining text from various sources. This technique, known as the "cut-up method," has been used by artists and writers to generate new creative works and discover unexpected connections between texts.

## Features

- **Multiple Text Sources**: Choose from a curated library of classic literary works
- **Custom Text**: Add your own text to mix with the classics
- **Interactive Canvas**: Drag and drop text tiles to create your composition
- **Save & Load**: Store your creations and revisit them later
- **Export**: Save your compositions as images
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. **Select Sources**: Choose from the category buttons at the top to add source texts
2. **Cut Up Text**: Click the "Cut up selected sources" button to generate text tiles
3. **Arrange Tiles**: Drag and drop tiles to create your composition
4. **Save Your Work**: Click the save button to store your canvas
5. **Export**: Click the download button to save your composition as an image

## Advanced Features

- **Customize Tiles**: Add more tiles or remove some with the + and - buttons
- **Shuffle**: Randomly rearrange all tiles on the canvas
- **Undo/Redo**: Track your changes with full history support
- **Source Preview**: Hover over source badges to see text snippets

## Technical Details

The Cut-Up Machine is built with:

- **React**: Front-end UI framework
- **Chakra UI**: Component library for consistent design
- **html2canvas**: For exporting compositions as images
- **Draggable**: For tile manipulation
- **Intl.Segmenter**: For intelligent text splitting
- **LocalStorage**: For saving canvases between sessions

## Future Plans

- **Backend Integration**: Python FastAPI backend for expanded source library
- **User Accounts**: Save your work to the cloud
- **Social Sharing**: Share your compositions with others
- **Advanced Text Analysis**: Smart text suggestions and patterns
- **Collaborative Editing**: Work with others in real-time

## Development

### Setup
