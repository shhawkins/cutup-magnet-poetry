import React, { useState, useEffect, useRef } from 'react';
import {
  ChakraProvider, Box, Flex, VStack, HStack, Button, IconButton, Input,
  Text, Divider, useToast, extendTheme,
  Icon, Popover, PopoverTrigger, PopoverContent, PopoverBody, CloseButton,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, 
  ModalCloseButton, ModalFooter, useDisclosure,
  FormControl, FormLabel, List, ListItem, Link, Image, PopoverArrow, PopoverCloseButton, PopoverHeader
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { 
  FaCut, FaRandom, FaDownload, FaTrash, FaPlus, FaMinus, FaCopy, FaDice, FaExpand, FaCompress, FaTimes, FaCloudDownloadAlt, FaChevronDown,
  FaChevronUp, FaChevronDown as FaChevronExpand, FaUndo, FaRedo, FaSave, FaFolderOpen, FaSyncAlt, FaPlay, FaPause
} from 'react-icons/fa';
import Draggable from 'react-draggable';
import html2canvas from 'html2canvas';
import { textSources } from './data/textSources';
import { FaDiceFive } from "react-icons/fa6";



function App() {
  const [selectedSources, setSelectedSources] = useState([]);
  const [customTexts, setCustomTexts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [tiles, setTiles] = useState([]);
  const boardRef = useRef(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const toast = useToast({
    position: "top-middle",
    duration: 1600,
    isClosable: true,
  });
  const [showSourceSection, setShowSourceSection] = useState(true);
  const appContainerRef = useRef(null);
  const footerRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);
  const [savedCanvases, setSavedCanvases] = useState([]);
  const [canvasName, setCanvasName] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalMode, setModalMode] = useState('save'); // 'save' or 'load'
  const [selectedSourceForDetails, setSelectedSourceForDetails] = useState(null);
  const [isSourceDetailsOpen, setIsSourceDetailsOpen] = useState(false);
  const [previewCanvas, setPreviewCanvas] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [pauseQuotes, setPauseQuotes] = useState(false);
  const [showSavedCanvases, setShowSavedCanvases] = useState(true);

  // Literary quotes that cycle in the footer
  const quotes = [
    { text: `🛸 "Language is a virus from outer space."`, author: "William S. Burroughs" },
    { text: `⭐ "The poet doesn't invent. He listens."`, author: "Jean Cocteau" },
    { text: `🎨 "If there's a voice in your head saying, 'You can't paint,' you must surely paint, and silence that voice."`, author: "Vincent Van Gogh" },
    { text: `✂️ "All writing is in fact cut-ups."`, author: "William S. Burroughs" },
    { text: `⏲️ "If I waited for perfection, I wouldn't write a thing."`, author: "Margaret Atwood" },
    { text: `🖋️ "You can always edit a bad page. You can't edit a blank page."`, author: "Jodi Picoult" },
    { text: `🧵 "Art is never finished, only abandoned."`, author: "Leonardo da Vinci" },
    { text: `☠️ "Have no fear of perfection, you'll never reach it."`, author: "Salvador Dali" },
    { text: `🗣️ "Creativity is contagious, pass it on."`, author: "Albert Einstein" },
    { text: `🩸 "Writing is easy. You only need to stare at a blank piece of paper until drops of blood form on your forehead."`, author: "Gene Fowler" },
    { text: `📚 "Originality is nothing but judicious imitation."`, author: "Voltaire" },
    { text: `🌈 "I never paint dreams or nightmares. I paint my own reality."`, author: "Frida Kahlo" },
    { text: `🔍 "Creativity is piercing the mundane to find the marvelous."`, author: "Bill Moyers" },
    { text: `☀️ "A man is a success if he gets up in the morning and gets to bed at night, and in between he does what he wants to do."`, author: "Bob Dylan" },
    { text: `🌌 "The world of reality has its limits; the world of imagination is boundless."`, author: "Jean-Jacques Rousseau" },
    { text: `🌀 "Those who do not want to imitate anything, produce nothing."`, author: "Salvador Dali" },
    { text: `🗨️ "Be who you are and say what you feel because those who mind don't matter and those who matter don't mind."`, author: "Dr. Seuss" },
    { text: `🌍 "The artist's world is limitless. It can be found anywhere, far from where he lives or a few feet away. It is always on his doorstep."`, author: "Paul Strand" },
    { text: `🔍 "Creativity is piercing the mundane to find the marvelous."`, author: "Bill Moyers" },
    { text: `🎯 "Creativity is allowing yourself to make mistakes. Art is knowing which ones to keep."`, author: "Scott Adams" },
    { text: `🌪️ "I accept chaos, I'm not sure whether it accepts me."`, author: "Bob Dylan" },
    { text: `💡 "My reality needs imagination like a bulb needs a socket. My imagination needs reality like a blind man needs a cane."`, author: "Tom Waits" },
    { text: `🚫 "Don't try."`, author: "Charles Bukowski" },
    { text: `🧭 "To create one's own world takes courage."`, author: "Georgia O'Keefe" },
    { text: `🌱 "To practice any art, no matter how well or how badly, is a way to make your soul grow, for heaven's sake. So do it."`, author: "Kurt Vonnegut" },
    { text: `🧠 "In the future, everyone will be famous for 15 minutes."`, author: "Andy Warhol" },
    { text: `🕳️ "I am not strange. I am just not normal."`, author: "Salvador Dali" },
    { text: `🩹 "When you cut into the present, the future leaks out."`, author: "William S. Burroughs" },
    { text: `📼 "Nothing is original. Steal from anywhere that resonates with inspiration or fuels your imagination."`, author: "Jim Jarmusch" },
    { text: `💭 "Dreams are today's answers to tomorrow's questions."`, author: "Edgar Cayce" },
  ];
  
  

const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

// Add this useEffect to change quotes periodically
useEffect(() => {
  if (pauseQuotes) return; // Don't set up the interval if paused
  
  const interval = setInterval(() => {
    setCurrentQuoteIndex(prevIndex => 
      prevIndex === quotes.length - 1 ? 0 : prevIndex + 1
    );
  }, 12000);
  
  return () => clearInterval(interval);
}, [pauseQuotes, quotes.length]);
  
  // Custom theme for fonts
const theme = extendTheme({
  styles: {
    global: {
      html: {
        height: '100%',
        overflow: 'hidden',
      },
      body: {
        height: '100%',
        margin: 0,
        overflow: 'hidden',
      },
      '#root': {
        height: '100%',
      },
    },
  },
  fonts: {
    heading: 'Helvetica, sans-serif',
    body: 'Helvetica, sans-serif',
    tile: 'Courier, monospace',
  },
});

// Function to shuffle an array
const shuffleArray = (arr) => {
  const array = [...arr]; // avoid mutating original array
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Function to get random sequential sentences
const getRandomSnippet = (text) => {
  // Split by sentence endings (., !, ?)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 3) return text;
  const startIndex = Math.floor(Math.random() * (sentences.length - 3));
  return sentences.slice(startIndex, startIndex + 3).join(' ');
};

// Function to refresh a specific source's snippet with a new random selection
const refreshSourceSnippet = (sourceId) => {
  // Find the source in the selected sources array
  setSelectedSources(prevSources => {
    return prevSources.map(source => {
      // Only update the targeted source
      if (source.id === sourceId) {
        // Get the full text based on source type
        const fullText = source.category === 'custom' 
          ? source.text 
          : textSources[source.category].sources[source.key].text;
          
        // Extract a different snippet from the text
        // Split by sentence endings (., !, ?)
        const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
        
        // Choose a different random starting point if possible
        let newStartIndex;
        if (sentences.length <= 3) {
          newStartIndex = 0; // Not enough sentences for variety
        } else {
          // Try to get a different starting point than current snippet
          const currentFirstSentence = source.snippet.split(/[.!?]/)[0];
          let attempts = 0;
          
          do {
            newStartIndex = Math.floor(Math.random() * (sentences.length - 3));
            attempts++;
          } while (
            sentences[newStartIndex].includes(currentFirstSentence) && 
            attempts < 5
          );
        }
        
        // Extract the new snippet
        const newSnippet = sentences.length <= 3 
          ? fullText 
          : sentences.slice(newStartIndex, newStartIndex + 3).join(' ');
          
        // Show a subtle notification
        toast({
          title: "Snippet refreshed",
          status: "info",
          duration: 1000,
          isClosable: true,
        });
        
        // Return updated source with new snippet
        return {
          ...source,
          snippet: newSnippet
        };
      }
      
      // Return other sources unchanged
      return source;
    });
  });
};

// Handle dragging the divider to resize sections
const handleDividerDrag = (clientY) => {
  // Don't process if source section is hidden
  if (!showSourceSection) return;
  
  // Get the current position
  const mouseY = clientY;
  
  // Get container position and dimensions
  const containerRect = appContainerRef.current.getBoundingClientRect();
  const containerTop = containerRect.top;
  const containerHeight = containerRect.height;
  
  // Calculate the new height as a percentage of the container
  // We constrain the source section size between 5% and 95% of the container height
  const newHeightPercent = Math.max(12, Math.min(95, 
    ((mouseY - containerTop) / containerHeight) * 100
  ));
  
  // Apply the new height to the source section if it's visible
  if (appContainerRef.current) {
    // Find the source section element (first child of the container)
    const sourceSection = appContainerRef.current.querySelector('div > div.chakra-stack');
    
    if (sourceSection) {
      sourceSection.style.maxHeight = `${newHeightPercent}vh`;
      sourceSection.style.height = `${newHeightPercent}vh`;
    }
  }
  
  // Update board size after resize
  updateBoardSize();
};

// Mouse event handlers
const handleMouseMove = (e) => {
  handleDividerDrag(e.clientY);
};

const handleTouchMove = (e) => {
  e.preventDefault(); // Prevent scrolling while dragging
  if (e.touches && e.touches[0]) {
    handleDividerDrag(e.touches[0].clientY);
  }
};

const startDrag = (e) => {
  // Only allow dragging if source section is visible
  if (!showSourceSection) return;
  
  e.preventDefault();
  
  // For mouse events
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', stopDrag);
  
  // For touch events
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', stopDrag);
};

const stopDrag = () => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', handleTouchMove);
  window.removeEventListener('touchend', stopDrag);
};


// Cut-up logic using Intl.Segmenter
const cutUpText = (text) => {
  const segmenter = new Intl.Segmenter('en', { granularity: 'word' });
  const segments = Array.from(segmenter.segment(text)).map(s => s.segment);
  const words = segments.filter(s => /[a-zA-Z]/.test(s));
  const punctuation = [',', '.', '!', '?', '—'];
  const tiles = [];

  // Weighted phrase lengths (1-8), favoring shorter lengths
  const weightedLengths = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // more likely to get 1-word phrases
    2, 2, 2, 2, 2, 2, 2, 2,    // some 2-word phrases
    3, 3, 3, 3, 3, 3,          // occasional 3-word phrase
    4, 4, 4, 5, 5, 6, 6, 7  // rare longer phrases
  ];

  // Parse words/phrases and add to tiles
  for (let i = 0; i < words.length; i++) {
    const phraseLength = weightedLengths[Math.floor(Math.random() * weightedLengths.length)];

    if (phraseLength > 1 && i + phraseLength <= words.length) {
      tiles.push(words.slice(i, i + phraseLength).join(' '));
      i += phraseLength - 1;
    } else {
      tiles.push(words[i]);
    }

    if (Math.random() < 0.1) {
      tiles.push(punctuation[Math.floor(Math.random() * punctuation.length)]); // ocassionally add punctuation tiles
    }
  }

  return tiles;
};

  // Add a source to selected sources
  const addSource = (category, sourceKey, onClose) => {
    // Check if source is already selected
    const sourceId = `${category}-${sourceKey}`;
    if (selectedSources.some(s => s.id === sourceId)) {
      return;
    }
  
    const sourceInfo = textSources[category].sources[sourceKey];
    const snippet = getRandomSnippet(sourceInfo.text);
    
    const newSource = {
      id: sourceId,
      category,
      key: sourceKey,
      title: sourceInfo.title,
      snippet,
      color: textSources[category].color,
      icon: sourceInfo.icon,
      author: sourceInfo.author,
      year: sourceInfo.year,
      language: sourceInfo.language,
      gutenbergLink: sourceInfo.gutenbergLink,
      context: sourceInfo.context,
      influence: sourceInfo.influence
    };
    
    setSelectedSources(prev => [...prev, newSource]);
    
    // Close the popover when an item is selected
    if (onClose) {
      onClose();
    }
  };

  // Remove a source
  const removeSource = (sourceId) => {
    setSelectedSources(prev => prev.filter(s => s.id !== sourceId));
  };

  // Add custom text
  const addCustomText = () => {
    if (inputText.trim()) {
      const customId = `custom-${Date.now()}`;
      const snippet = getRandomSnippet(inputText);
      
      const newCustomText = {
        id: customId,
        category: 'custom',
        key: customId,
        title: `Custom Text #${customTexts.length + 1}`,
        text: inputText,
        snippet,
        color: 'teal.100'
      };
      
      setCustomTexts(prev => [...prev, newCustomText]);
      setSelectedSources(prev => [...prev, newCustomText]);
      setInputText('');
    }
  };

  // Remove a tile from the board
  const removeTile = (tileId) => {
    setTiles(prev => prev.filter(tile => tile.id !== tileId));
  };

  // Update board dimensions
  const updateBoardSize = () => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setBoardSize({
        width: rect.width,
        height: rect.height
      });
    }
  };

  // Calculate average tile size for better distribution and make smaller for mobile
  const calculateTileSize = (text) => {
    const isMobile = window.innerWidth < 768;
    const baseWidth = isMobile ? 60 : 120; // Smaller width on mobile
    const baseHeight = isMobile ? 20 : 60; // Smaller height on mobile
    
    // Scale based on text length
    const length = text.length;
    let width = baseWidth;
    let height = baseHeight;
    
    if (length > 30) {
      width = baseWidth * 1.3;
      height = baseHeight * 1.2;
    } else if (length > 15) {
      width = baseWidth * 1;
      height = baseHeight * .9;
    }
    
    return { width, height };
  };

  // Generates new tiles and distributes them on the board with absolute positioning
  const generateTiles = () => {

    // Hide source section on mobile
    if (showSourceSection && window.innerWidth < 768) {
      setShowSourceSection(false);
    }
    
    updateBoardSize();

    // Combine text from all selected sources
    const allText = selectedSources.map(source => {
      return source.category === 'custom' 
        ? source.text 
        : textSources[source.category].sources[source.key].text;
    }).join(' ');

    // Cut up text and limit to max tiles
    const MAX_TILES = 25;
    const shuffledTiles = shuffleArray(cutUpText(allText)).slice(0, MAX_TILES);

    // Get board dimensions with fallbacks
    const boardWidth = boardRef.current?.clientWidth || window.innerWidth * 0.9;
    const boardHeight = boardRef.current?.clientHeight || window.innerHeight * 0.6;

    // Conservative padding to keep tiles fully visible
    const padding = 30;

    const positionedTiles = shuffledTiles.map((text, i) => {
      // Get tile size first so we can use it for positioning
      const tileSize = calculateTileSize(text);
      
      // Calculate safe boundaries accounting for tile width/height
      const safeMaxX = boardWidth - padding - tileSize.width;
      const safeMaxY = boardHeight - padding - tileSize.height;
      const safeMinX = padding;
      const safeMinY = padding;
      
      // Generate random position within safe boundaries
      const x = safeMinX + Math.random() * (safeMaxX - safeMinX);
      const y = safeMinY + Math.random() * (safeMaxY - safeMinY);
      
      return {
        id: `tile-${Date.now()}-${i}`,
        text,
        x,
        y,
        width: tileSize.width,
        height: tileSize.height
    
      };

  });

  setTiles(positionedTiles);
  saveToHistory(positionedTiles);
  };

// Add more tiles to the existing board
const addTiles = () => {
  // Validate source selection
  if (selectedSources.length < 1) {
    toast({
      title: 'Select at least 1 source!',
      status: 'warning'
    });
    return;
  }

  updateBoardSize();

  // Combine text from all selected sources
  const allText = selectedSources.map(source => {
    return source.category === 'custom' 
      ? source.text 
      : textSources[source.category].sources[source.key].text;
  }).join(' ');

  // Cut up text 
  const cutUpTiles = cutUpText(allText);
  
  // Shuffle and select 5-15 new tiles
  const numNewTiles = 5 + Math.floor(Math.random() * 11); // Random number between 5-15
  const shuffledTiles = shuffleArray(cutUpTiles).slice(0, numNewTiles);

  // Get board dimensions with fallbacks
  const boardWidth = boardRef.current?.clientWidth || window.innerWidth * 0.9;
  const boardHeight = boardRef.current?.clientHeight || window.innerHeight * 0.6;

  // Conservative padding to keep tiles fully visible
  const padding = 30;

  const newTiles = shuffledTiles.map((text, i) => {
    // Get tile size first so we can use it for positioning
    const tileSize = calculateTileSize(text);
    
    // Calculate safe boundaries accounting for tile width/height
    const safeMaxX = boardWidth - padding - tileSize.width;
    const safeMaxY = boardHeight - padding - tileSize.height;
    const safeMinX = padding;
    const safeMinY = padding;
    
    // Generate random position within safe boundaries
    const x = safeMinX + Math.random() * (safeMaxX - safeMinX);
    const y = safeMinY + Math.random() * (safeMaxY - safeMinY);
    
    return {
      id: `tile-${Date.now()}-${i}-add`,
      text,
      x,
      y,
      width: tileSize.width,
      height: tileSize.height
    };
  });

  // Add new tiles to existing tiles
  setTiles(prev => [...prev, ...newTiles]);
  toast({ 
    title: `Added ${newTiles.length} new tiles!`, 
    status: 'success', 
    duration: 650
  });
  saveToHistory(newTiles);
};

// Remove a random selection of tiles from the board
const removeRandomTiles = () => {
  // Get the current number of tiles
  const tileCount = tiles.length;
  
  // If there are no tiles, show a warning and return
  if (tileCount === 0) {
    toast({
      title: 'No tiles to remove!',
      status: 'warning'
    });
    return;
  }
  
  // Calculate how many tiles to remove (1-15, but not more than exist)
  const maxRemoval = Math.min(tileCount, 15);
  const removalCount = 1 + Math.floor(Math.random() * maxRemoval);
  
  // Create a copy of the current tiles and shuffle it
  const shuffledTiles = shuffleArray([...tiles]);
  
  // Keep only the tiles that won't be removed
  const remainingTiles = shuffledTiles.slice(removalCount);
  
  // Update the tiles state
  setTiles(remainingTiles);
  
  // Show notification
  toast({ 
    title: `Removed ${removalCount} tile${removalCount !== 1 ? 's' : ''}!`, 
    status: 'info', 
    duration: 700
  });
  saveToHistory(remainingTiles);
};
  // Repositions existing tiles to random locations on the board
  const shuffleTiles = () => {
    // Make sure we have the latest board size
    updateBoardSize();
    
    // Only proceed if there are tiles to reposition
    if (tiles.length === 0) {
      toast({
        title: 'No tiles to shuffle!',
        status: 'warning'
      });
      return;
    }
    
    // Get board dimensions with fallbacks
    const boardWidth = boardRef.current?.clientWidth || window.innerWidth * 0.9;
    const boardHeight = boardRef.current?.clientHeight || window.innerHeight * 0.6;
    
    // Conservative padding to keep tiles fully visible
    const padding = 30;
    
    // Create new tiles with the same content but new positions and IDs
    // This forces React to re-render the Draggable components
    const repositionedTiles = tiles.map(tile => {
      // Calculate safe boundaries accounting for tile width/height
      const safeMaxX = boardWidth - padding - tile.width;
      const safeMaxY = boardHeight - padding - tile.height;
      const safeMinX = padding;
      const safeMinY = padding;
      
      // Generate random position within safe boundaries
      const x = safeMinX + Math.random() * (safeMaxX - safeMinX);
      const y = safeMinY + Math.random() * (safeMaxY - safeMinY);

      // Return a new tile object with a new ID but the same text content
      return {
        id: `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: tile.text,
        x,
        y,
        width: tile.width,
        height: tile.height
      };
    });
    
    // Update state with new tile objects
    setTiles(repositionedTiles);
    saveToHistory(repositionedTiles);
  };

  // Export as image with temporary header and no toolbar
  const exportImage = () => {
    // Create temporary header element
    const header = document.createElement('div');
    header.id = 'temp-export-header';
    header.style.position = 'absolute';
    header.style.top = '10px';
    header.style.left = '10px';
    header.style.fontWeight = 'bold';
    header.style.fontSize = '24px';
    header.style.color = '#333';
    header.style.zIndex = '1000';
    header.innerHTML = '✂️ cut up';
    
    // Hide all toolbar buttons temporarily
    const toolbarButtons = document.querySelectorAll('.source-toolbar, .canvas-toolbar');
    toolbarButtons.forEach(el => {
      el.style.display = 'none';
    });
    
    // Add the temporary header to the board
    boardRef.current.appendChild(header);
    
    // Capture the canvas
    html2canvas(boardRef.current, { backgroundColor: '#f7fafc' }).then(canvas => {
      // Create and click download link
      const link = document.createElement('a');
      link.download = 'cut-up-poetry.jpg';
      link.href = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG at 70% quality
      link.click();
      
      // Restore original UI
      boardRef.current.removeChild(header);
      toolbarButtons.forEach(el => {
        el.style.display = '';
      });
      
      toast({ title: 'Canvas saved to disk!', status: 'success'});
    });
  };
  

  // Clear tiles
  const clearTiles = () => {
    setTiles([]);
    toast({ title: 'Tiles cleared!', status: 'error'});
  };

  // Toggle source section
  const toggleSourceSection = () => {
    console.log("Toggle source section from", showSourceSection, "to", !showSourceSection);
    setShowSourceSection(prev => !prev);
  };

  // Function to randomly select up to 10 new sources
const randomizeSources = () => {
  // Clear existing sources first
  setSelectedSources([]);
  setCustomTexts([]);
  
  // Get all categories and their sources
  const allCategories = Object.keys(textSources);
  const availableSources = [];
  
  // Create a flat list of all available sources with their category and key
  allCategories.forEach(category => {
    Object.keys(textSources[category].sources).forEach(sourceKey => {
      availableSources.push({
        category,
        sourceKey
      });
    });
  });
  
  // Shuffle the list of sources
  const shuffledSources = shuffleArray([...availableSources]);
  
  // Select up to 10 sources
  const maxSources = Math.min(20, shuffledSources.length);
  const selectedCount = 2 + Math.floor(Math.random() * (maxSources - 1)); // At least 2, up to 10
  
  // Add each selected source
  const newSources = shuffledSources.slice(0, selectedCount);
  
  const sourcesToAdd = newSources.map(source => {
    const sourceId = `${source.category}-${source.sourceKey}`;
    const sourceInfo = textSources[source.category].sources[source.sourceKey];
    const snippet = getRandomSnippet(sourceInfo.text);
    
    return {
      id: sourceId,
      category: source.category,
      key: source.sourceKey,
      title: sourceInfo.title,
      snippet,
      color: textSources[source.category].color,
      icon: sourceInfo.icon
    };
  });
  
  setSelectedSources(sourcesToAdd);
  
  // Show notification
  toast({ 
    title: `Randomly selected ${selectedCount} sources`, 
    status: 'success',
    duration: 2000
  });
  

};

  // Update board size when window is resized
  useEffect(() => {
    const handleResize = () => {
      updateBoardSize();
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update board size when sources change (which affects layout)
  useEffect(() => {
    updateBoardSize();
  }, [selectedSources, showSourceSection]);

  // Add this function to save state to history
  const saveToHistory = (newTiles) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    
    // If we're not at the end of history, truncate it
    if (historyIndex !== history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1));
    }
    
    // Add the new state to history
    setHistory(prev => [...prev, [...newTiles]]);
    setHistoryIndex(prev => prev + 1);
  };

  // Add these undo/redo functions
  const undo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      setHistoryIndex(prev => prev - 1);
      setTiles(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      setHistoryIndex(prev => prev + 1);
      setTiles(history[historyIndex + 1]);
    }
  };

  // Load saved canvases from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem('savedCanvases');
    if (saved) {
      setSavedCanvases(JSON.parse(saved));
    }
  }, []);

  // Save canvas with thumbnail
  const saveCanvas = () => {
    if (!canvasName.trim()) {
      toast({
        title: 'Please enter a name for your canvas',
        status: 'warning'
      });
      return;
    }

    // Create temporary header element
    const header = document.createElement('div');
    header.id = 'temp-export-header';
    header.style.position = 'absolute';
    header.style.top = '10px';
    header.style.left = '10px';
    header.style.fontWeight = 'bold';
    header.style.fontSize = '16px';
    header.style.color = '#333';
    header.style.zIndex = '1000';
    header.innerHTML = '✂️ cut up';
    
    // Hide all toolbar buttons temporarily
    const toolbarButtons = document.querySelectorAll('.source-toolbar, .canvas-toolbar');
    toolbarButtons.forEach(el => {
      el.style.display = 'none';
    });
    
    // Add the temporary header to the board
    boardRef.current.appendChild(header);

    // Capture thumbnail of current canvas
    html2canvas(boardRef.current, { backgroundColor: '#f7fafc' }).then(canvas => {
      // Remove header and restore UI
      boardRef.current.removeChild(header);
      toolbarButtons.forEach(el => {
        el.style.display = '';
      });
      
      const thumbnail = canvas.toDataURL('image/jpeg', 0.3); // Low quality for thumbnail
      
      const newCanvas = {
        id: Date.now(),
        name: canvasName,
        tiles: [...tiles],
        sources: [...selectedSources],
        date: new Date().toISOString(),
        thumbnail // Store the thumbnail data URL
      };
      
      const updatedCanvases = [...savedCanvases, newCanvas];
      setSavedCanvases(updatedCanvases);
      localStorage.setItem('savedCanvases', JSON.stringify(updatedCanvases));
      
      setCanvasName('');
      onClose();
      
      toast({
        title: 'Canvas saved!',
        status: 'success'
      });
    });
  };

  const loadCanvas = (canvas) => {
    setTiles(canvas.tiles);
    setSelectedSources(canvas.sources);
    
    // Update history
    saveToHistory(canvas.tiles);
    
    onClose();
    
    toast({
      title: `Loaded "${canvas.name}"`,
      status: 'success'
    });
  };

  const deleteCanvas = (id, e) => {
    e.stopPropagation();
    const updatedCanvases = savedCanvases.filter(canvas => canvas.id !== id);
    setSavedCanvases(updatedCanvases);
    localStorage.setItem('savedCanvases', JSON.stringify(updatedCanvases));
    
    toast({
      title: 'Canvas deleted',
      status: 'info'
    });
  };

  // Add this function to handle clicking on a source card
  const viewSourceDetails = (source) => {
    setSelectedSourceForDetails(source);
    setIsSourceDetailsOpen(true);
  };

  // Add this function to close the source details modal
  const closeSourceDetails = () => {
    setSelectedSourceForDetails(null);
    setIsSourceDetailsOpen(false);
  };

  // Add this function to handle preview
  const openCanvasPreview = (canvas, e) => {
    if (e) e.stopPropagation();
    setPreviewCanvas(canvas);
    setIsPreviewOpen(true);
  };

  // Add this function to close the preview
  const closeCanvasPreview = () => {
    setPreviewCanvas(null);
    setIsPreviewOpen(false);
  };

  // Add this function to load a canvas from the preview
  const loadFromPreview = () => {
    if (previewCanvas) {
      loadCanvas(previewCanvas);
      closeCanvasPreview();
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Flex
        ref={appContainerRef}
        direction="column"
        height="100vh"
        width="100vw"
        bg="gray.50"
        overflow="hidden"
      >
{/* App Header with Toggle Button */}
<Flex 
  width="100%" 
  bg="white" 
  pt={4}
  pb={3}
  px={6}
  alignItems="center"
  justifyContent="space-between"
  borderBottom="1px solid"
  borderColor="gray.200"
>
  <Box>
    <Text 
      fontSize={{ base: "3xl", md: "4xl" }}
      fontFamily="'Courier New', Courier, monospace"
      fontWeight="bold"
      color="black"
      lineHeight="1"
    >
    ✂️cut up
    </Text>
    <Text
      fontSize="xs"
      color="gray.500"
      fontStyle="italic"
      ml={20}
      mt={-1}
      fontFamily="'Courier New', Courier, monospace"
    >
      remix language
    </Text>
  </Box>
  
  {/* Toggle Source Section button - only show when sources are visible */}
  {showSourceSection && (
    <Button
      size="sm"
      variant="ghost"
      leftIcon={<FaExpand />}
      rightIcon={<FaChevronUp />}
      onClick={toggleSourceSection}
      _hover={{ bg: "gray.100" }}
      title="📺 Toggle fullscreen"
    >
      Hide Sources
    </Button>
  )}
</Flex>
        
        {/* Sources Section - Collapsible */}
        {showSourceSection && (
          <VStack 
            p={{ base: 2, md: 4 }} 
            spacing={{ base: 2, md: 4 }} 
            maxH={{ base: "45vh", md: "auto" }}
            overflowY="auto"
            bg="white"
            borderBottom="2px solid"
            borderColor="gray.300"
          >
            {/* Text Input Box */}
            <HStack width="full" mb={2}>
              <IconButton
                icon={<FaDiceFive />}
                onClick={randomizeSources}
                colorScheme="blue"
                title="🎲 Select random sources"
              />
              <Input
                placeholder="Paste text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                flex="1"
              />

            </HStack>
            
            {/* Category Buttons and Cut Up Button */}
            <Box width="full">
              <Flex
                width="full"
                flexDirection="column"
                gap={2}
              >
                {/* Category Buttons - Wrapping flexbox */}
                <Box 
                  display="flex"
                  flexWrap="wrap"
                  gap={2}
                  width="full"
                >
                  {Object.keys(textSources).map(category => (
                    <Popover key={category} placement="bottom-start">
                      {({ isOpen, onClose }) => (
                        <>
                          <PopoverTrigger>
                            <Button
                              colorScheme={textSources[category].color.split('.')[0]}
                              variant="solid"
                              leftIcon={<Icon as={textSources[category].icon} />}
                              rightIcon={<FaChevronDown />}
                              size="lg"
                              width={{ base: "calc(50% - 4px)", md: "auto" }}
                              flexGrow={{ md: 1 }}
                              height="50px"
                            >
                              {textSources[category].name}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent width="220px" boxShadow="md">
                            <PopoverBody p={2}>
                              <Flex justify="space-between" align="center" mb={2}>
                                <Text fontWeight="bold" fontSize="sm">
                                  {textSources[category].name}
                                </Text>
                                <IconButton
                                  icon={<FaSyncAlt />}
                                  size="xs"
                                  variant="ghost"
                                  aria-label="Refresh sources"
                                  title="🔄 Refresh sources list"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast({
                                      title: "Coming soon!",
                                      description: "In the future, this will refresh the list with new random sources.",
                                      status: "info",
                                      duration: 2000,
                                    });
                                  }}
                                />
                              </Flex>
                              <VStack align="stretch" spacing={1}>
                                {Object.keys(textSources[category].sources).map(sourceKey => (
                                  <Button
                                    key={sourceKey}
                                    leftIcon={<Icon as={textSources[category].sources[sourceKey].icon} />}
                                    justifyContent="flex-start"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => addSource(category, sourceKey, onClose)}
                                    isDisabled={selectedSources.some(s => s.id === `${category}-${sourceKey}`)}
                                  >
                                    {textSources[category].sources[sourceKey].title}
                                  </Button>
                                ))}
                              </VStack>
                            </PopoverBody>
                          </PopoverContent>
                        </>
                      )}
                    </Popover>
                  ))}
                </Box>
                
                {/* Cut Up Button */}
                <HStack>
                <Button 
                  leftIcon={<FaCut />} 
                  colorScheme="teal" 
                  onClick={generateTiles}
                  isDisabled={selectedSources.length < 1}
                  size="lg"
                  height="50px"
                  width="100%"
                  fontSize="xl"
                  title="✂️ Cut sources up into magnetic tiles"
                >
                  Cut!
                </Button>
              </HStack>
              </Flex>
            </Box>
            
            {/* Selected Sources Cards */}
            <Box 
              width="full"
              padding="4"
              position="relative"
            >
              <Flex
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                width="full"
                mb={2}
              >
                <Text fontSize="md" fontWeight="semibold">
                  Sources: {selectedSources.length}
                </Text>
                {selectedSources.length > 0 && (
                  <HStack spacing={2}>
                    <IconButton
                      icon={<FaDiceFive />}
                      onClick={randomizeSources}
                      size="sm" 
                      colorScheme="blue"
                      title="🎲 Select random sources"
                    />
                    <IconButton
                      icon={<FaTrash />}
                      onClick={() => {
                        setSelectedSources([]);
                        setCustomTexts([]);
                        toast({ title: 'All sources cleared!', status: 'info'});
                      }}
                      size="sm" 
                      colorScheme="red"
                      className="toolbar-element"
                      title="☠️ Clear all sources"
                    />
                  </HStack>
                )}
              </Flex>
              
              {selectedSources.length === 0 ? (
                <Flex
                  width="100px"
                  height="100px"
                  justifyContent="center"
                  alignItems="center"
                  borderRadius="lg"
                  bg="gray.50"
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor="gray.300"
                  padding="20px"
                >
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    color="gray.500"
                    textAlign="center"
                    px={4}
                  >
                    ↗️ Select a source...
                  </Text>
                </Flex>
              ) : (
                <Box position="relative">
                  <Flex 
                    flexWrap="wrap" 
                    gap={3} 
                    justify={{ base: "center", md: "flex-start" }}
                    mb={4}
                  >
                    {selectedSources.map(source => (
                      <Box
                        key={source.id}
                        bg={source.color}
                        borderRadius="md"
                        boxShadow="sm"
                        p={3}
                        width={{ base: "120px", md: "150px" }}
                        height={{ base: "120px", md: "150px" }}
                        position="relative"
                        overflow="hidden"
                        onClick={() => viewSourceDetails(source)}
                        cursor="pointer"
                        transition="transform 0.2s"
                        _hover={{ transform: "scale(1.03)" }}
                      >
                        <IconButton
                          icon={<FaDiceFive/>}
                          size="xs"
                          position="absolute"
                          right="20px" 
                          top="2px"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the card click event
                            refreshSourceSnippet(source.id);
                          }}
                          aria-label="Refresh snippet"
                          variant="ghost"
                          _focus={{ boxShadow: "none" }}
                          _hover={{ outline: "none" }}
                          _focusVisible={{ boxShadow: "none" }}
                          mr="5px"
                          title="🔄 Get new snippet"
                        />
                        <CloseButton
                          size="sm"
                          position="absolute"
                          right="2px"
                          top="2px"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the card click event
                            removeSource(source.id);
                          }}
                          title="❌ Close source"
                        />
                        <VStack height="full" align="start" spacing={1}>
                          <HStack>
                            {source.icon && <Icon as={source.icon} />}
                            <Text 
                              fontWeight="bold" 
                              fontSize="xs"
                              noOfLines={2}
                              wordBreak="break-word"
                              width="calc(100% - 20px)"
                              paddingRight="6px"
                              paddingTop="11px"
                            >
                              {source.title}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" noOfLines={5}>
                            {source.snippet}...
                          </Text>
                        </VStack>
                      </Box>
                    ))}
                  </Flex>
                </Box>
              )}
            </Box>
          </VStack>
        )}

        {/* Minimized Source Section Indicator (when hidden) */}
        {!showSourceSection && (
          <Flex 
            width="100%"
            bg="gray.100"
            px={4} 
            py={2} 
            alignItems="center"
            justifyContent="space-between"
            borderBottom="2px solid"
            borderColor="gray.300"
          >
            <Text fontSize="sm" fontWeight="medium">
              {selectedSources.length} sources selected
            </Text>
            
            <Flex align="center" gap={6}>
              {/* Group 1: Main actions */}
              <HStack spacing={1}>
                <IconButton
                  size="xs"
                  variant="outline"
                  colorScheme="red"
                  onClick={clearTiles}
                  icon={<FaTrash />}
                  className="toolbar-element"
                  title="☠️ Clear all tiles"
                />
                <IconButton
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  onClick={exportImage}
                  icon={<FaCloudDownloadAlt />}
                  title="⬇️ Save canvas to disk"
                />
                <IconButton
                  size="xs"
                  variant="outline"
                  colorScheme="green"
                  onClick={() => {
                    setModalMode('save');
                    onOpen();
                  }}
                  icon={<FaSave />}
                  title="💾 Save canvas"
                />
                <IconButton
                  size="xs"
                  variant="outline"
                  colorScheme="yellow"
                  onClick={() => {
                    setModalMode('load');
                    onOpen();
                  }}
                  icon={<FaFolderOpen />}
                  title="📂 Load canvas"
                />
              </HStack>
              
              {/* Group 2: Tile count management */}
              <HStack spacing={1}>
                <IconButton
                  size="xs"
                  variant="outline"
                  colorScheme="red"
                  onClick={removeRandomTiles}
                  icon={<FaMinus />}
                  title="➖ Remove some tiles"
                />
                <IconButton
                  size="xs"
                  variant="outline"
                  colorScheme="teal"
                  onClick={addTiles}
                  icon={<FaPlus />}
                  title="➕ Add more tiles"
                />
              </HStack>
              
              {/* Group 3: History and shuffle */}
              <HStack spacing={1}>
                <IconButton
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  onClick={undo}
                  isDisabled={historyIndex <= 0}
                  icon={<FaUndo />}
                  title="↩️ Undo"
                />
                <IconButton
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  onClick={redo}
                  isDisabled={historyIndex >= history.length - 1}
                  icon={<FaRedo />}
                  title="↪️ Redo"
                />
                <IconButton
                  size="xs"
                  variant="outline"
                  colorScheme="pink"
                  onClick={shuffleTiles}
                  icon={<FaRandom />}
                  title="🔀 Shuffle tiles"
                />
              </HStack>
              
              {/* Show Sources button */}
              <Button
                size="xs"
                leftIcon={<FaChevronExpand />}
                onClick={() => setShowSourceSection(true)}
                variant="outline"
              >
                Show Sources
              </Button>
            </Flex>
          </Flex>
        )}

        {/* Adjustable Divider with larger hit area */}
        <Box 
          position="relative" 
          width="100%" 
          height={showSourceSection ? "12px" : "2px"} // Increased height for larger touch target
          cursor={showSourceSection ? "ns-resize" : "default"}
          _hover={showSourceSection ? { '& > hr': { borderColor: "teal.400", borderWidth: "3px" } } : {}}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <Divider
            position="absolute"
            top="50%"
            transform="translateY(-50%)"
            borderColor="gray.400"
            borderWidth="3px"
            width="100%"
            pointerEvents="none" // The parent Box handles events
          />
        </Box>

        {/* Cutting Board Section */}
        <Box
          ref={boardRef}
          flex="1"
          p={4}
          bg="gray.100"
          position="relative"
          overflowX="hidden"
          overlowY="scroll"
        >
          {/* Only show toolbar when source section is visible */}
          {showSourceSection && (
            <Flex 
              width="100%" 
              justifyContent="center" 
              mb={4} 
              mt={2}
            >
              <Flex 
                align="center" 
                gap={6} 
                justifyContent="center" 
                bg="gray.50"
                p={3}
                borderRadius="md"
                boxShadow="sm"
              >
                {/* Group 1: Main actions */}
                <HStack spacing={1}>
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorScheme="red"
                    onClick={clearTiles}
                    icon={<FaTrash />}
                    title="☠️ Clear all tiles"
                  />
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    onClick={exportImage}
                    icon={<FaCloudDownloadAlt />}
                    title="⬇️ Save canvas to disk"
                  />
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorScheme="green"
                    onClick={() => {
                      setModalMode('save');
                      onOpen();
                    }}
                    icon={<FaSave />}
                    title="💾 Save canvas"
                  />
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorScheme="yellow"
                    onClick={() => {
                      setModalMode('load');
                      onOpen();
                    }}
                    icon={<FaFolderOpen />}
                    title="📂 Load canvas"
                  />
                </HStack>
                
                {/* Group 2: Tile count management */}
                <HStack spacing={1}>
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorScheme="red"
                    onClick={removeRandomTiles}
                    icon={<FaMinus />}
                    title="➖ Remove some tiles"
                  />
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorScheme="teal"
                    onClick={addTiles}
                    icon={<FaPlus />}
                    title="➕ Add more tiles"
                  />
                </HStack>
                
                {/* Group 3: History and shuffle */}
                <HStack spacing={1}>
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    onClick={undo}
                    isDisabled={historyIndex <= 0}
                    icon={<FaUndo />}
                    title="↩️ Undo"
                  />
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    onClick={redo}
                    isDisabled={historyIndex >= history.length - 1}
                    icon={<FaRedo />}
                    title="↪️ Redo"
                  />
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorScheme="pink"
                    onClick={shuffleTiles}
                    icon={<FaRandom />}
                    title="🔀 Shuffle tiles"
                  />
                </HStack>
              </Flex>
            </Flex>
          )}

          {tiles.map(tile => (
            <Draggable
              key={tile.id}
              defaultPosition={{ x: tile.x, y: tile.y }}
              bounds="parent"
              onStop={updateBoardSize}
              cancel=".tile-delete-btn"
            >
              <Box
                bg="white"
                p={2}
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                boxShadow="sm"
                fontFamily="tile"
                fontSize={{ base: "sm", md: "md" }}
                cursor="move"
                userSelect="none"
                _hover={{ boxShadow: 'md' }}
                display="inline-block"
                maxW="fit-content"
                position="absolute"
                className="tile-box"
                minH={{ base: "30px", md: "auto" }}
                minW={{ base: "40px", md: "auto" }}
                role="group"
              >
                {tile.text}
                <CloseButton
                  size="xs"
                  position="absolute"
                  right="-8px"
                  top="-8px"
                  bg="black"
                  color="white"
                  borderRadius="full"
                  opacity="0"
                  _groupHover={{ opacity: "1" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTile(tile.id);
                  }}
                  className="tile-delete-btn"
                />
              </Box>
            </Draggable>
          ))}
        </Box>

{/* Action Buttons and Footer */}
<Box 
  position="absolute" 
  bottom="0" 
  left="0" 
  right="0" 
  width="100%"
  bg="gray.50"
  borderTop="1px solid"
  borderColor="gray.200"
  zIndex={10}
>
  <HStack 
    p={{ base: 2, md: 2 }} 
    spacing={{ base: 2, md: 4 }}
    justifyContent="center"
  >
    {/* <IconButton
      icon={<FaPlus />}
      onClick={addTiles}
      aria-label="Add more tiles"
      colorScheme="green"
      title="Add more tiles to the board"
    />
    <IconButton
      icon={<FaCut />}
      onClick={generateTiles}
      aria-label="Recut from Sources"
      colorScheme="teal"
      title="Generate new tiles to replace current tiles"
    />
    <IconButton
      icon={<FaRandom />}
      onClick={() => {
        shuffleTiles()
      }}
      aria-label="Shuffle Tiles"
      colorScheme="pink"
      title="Shuffle tiles"
    /> */}
    {/* <IconButton
      icon={<FaCloudDownloadAlt />}
      onClick={exportImage}
      aria-label="Export as image"
      colorScheme="blue"
      title="Download canvas"
    />
    <IconButton
      icon={<FaTrash />}
      onClick={clearTiles}
      aria-label="Clear all tiles"
      colorScheme="red"
      title="Clear unused tiles"
    /> */}
  </HStack>
  
{/* Quote Footer with proper hide/show functionality */}
<Box
  as="footer"
  display={showFooter ? { base: "none", md: "block" } : "none"}
  mt={3}
  mb={7}
  textAlign="center"
  fontStyle="italic"
  color="gray.600"
  fontSize="sm"
  ref={footerRef}
  position="relative"
  bottom="0"
>
  <Flex justify="center" align="center">
    <Text>
      {quotes[currentQuoteIndex].text} - {quotes[currentQuoteIndex].author}
    </Text>
    
    {/* Subtle controls */}
    <HStack 
      position="absolute" 
      right="2" 
      opacity="0.4" 
      _hover={{ opacity: "1" }}
      transition="opacity 0.2s"
    >
      <IconButton
        icon={pauseQuotes ? <FaPlay size="8px" /> : <FaPause size="8px" />}
        size="xs"
        variant="ghost"
        onClick={() => setPauseQuotes(!pauseQuotes)}
        color="gray.600"
        aria-label={pauseQuotes ? "Resume quotes" : "Pause quotes"}
        title={pauseQuotes ? "Resume quotes" : "Pause quotes"}
      />
      <IconButton
        icon={<FaChevronDown size="8px" />}
        size="xs"
        variant="ghost"
        onClick={() => setShowFooter(false)}
        color="gray.600"
        aria-label="Hide footer"
        title="Hide footer"
      />
    </HStack>
  </Flex>
</Box>

{/* Add a button to show the footer when hidden */}
{!showFooter && (
  <IconButton
    position="fixed"
    bottom="2"
    right="2"
    size="xs"
    icon={<FaChevronUp size="10px" />}
    onClick={() => setShowFooter(true)}
    variant="outline"
    color="gray.500"
    bg="white"
    opacity="0.6"
    _hover={{ opacity: "1" }}
    aria-label="Show footer"
    title="Show footer"
    zIndex={10}
  />
)}
</Box>

{/* Save/Load Canvas Modal */}
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>
      {modalMode === 'save' ? 'Save Canvas' : 'Load Canvas'}
    </ModalHeader>
    <ModalCloseButton />
    <ModalBody>
      {modalMode === 'load' ? (
        savedCanvases.length > 0 ? (
          <List spacing={3}>
            {savedCanvases.map(canvas => (
              <ListItem 
                key={canvas.id}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                cursor="pointer"
                onClick={(e) => openCanvasPreview(canvas, e)}
                _hover={{ bg: "gray.100" }}
              >
                <Flex align="center">
                  {canvas.thumbnail ? (
                    <Image 
                      src={canvas.thumbnail} 
                      alt={canvas.name}
                      boxSize="60px"
                      mr={3}
                      borderRadius="md"
                      objectFit="cover"
                    />
                  ) : (
                    <Box 
                      boxSize="60px"
                      mr={3}
                      borderRadius="md"
                      bg="gray.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={FaDice} boxSize={4} color="gray.400" />
                    </Box>
                  )}
                  
                  <Box flex="1">
                    <Text fontWeight="bold">{canvas.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(canvas.date).toLocaleString()}
                    </Text>
                  </Box>
                </Flex>
              </ListItem>
            ))}
          </List>
        ) : (
          <Text>No saved canvases found.</Text>
        )
      ) : (
        <FormControl>
          <FormLabel>Canvas Name</FormLabel>
          <Input 
            value={canvasName}
            onChange={(e) => setCanvasName(e.target.value)}
            placeholder="My Canvas"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveCanvas();
              }
            }}
          />
        </FormControl>
      )}
    </ModalBody>
    <ModalFooter>
      {modalMode === 'save' && (
        <Button 
          colorScheme="blue" 
          mr={3} 
          onClick={saveCanvas}
          isDisabled={!canvasName.trim() || tiles.length === 0}
        >
          Save
        </Button>
      )}
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>

{/* Source Details Modal */}
<Modal isOpen={isSourceDetailsOpen} onClose={closeSourceDetails} size="lg">
  <ModalOverlay />
  <ModalContent>
    {selectedSourceForDetails && (
      <>
        <ModalHeader>
          <Flex align="center">
            {selectedSourceForDetails.icon && <Icon as={selectedSourceForDetails.icon} mr={2} />}
            {selectedSourceForDetails.title}
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Source metadata */}
            <Box bg={selectedSourceForDetails.color} p={4} borderRadius="md">
              <HStack spacing={4} wrap="wrap">
                {selectedSourceForDetails.author && (
                  <Box>
                    <Text fontWeight="bold">Author</Text>
                    <Text>{selectedSourceForDetails.author}</Text>
                  </Box>
                )}
                {selectedSourceForDetails.year && (
                  <Box>
                    <Text fontWeight="bold">Year</Text>
                    <Text>{selectedSourceForDetails.year}</Text>
                  </Box>
                )}
                {selectedSourceForDetails.language && (
                  <Box>
                    <Text fontWeight="bold">Original Language</Text>
                    <Text>{selectedSourceForDetails.language}</Text>
                  </Box>
                )}
              </HStack>
            </Box>
            
            {/* Source context and influence */}
            {selectedSourceForDetails.context && (
              <Box>
                <Text fontWeight="bold">Context</Text>
                <Text>{selectedSourceForDetails.context}</Text>
              </Box>
            )}
            {selectedSourceForDetails.influence && (
              <Box>
                <Text fontWeight="bold">Influence</Text>
                <Text>{selectedSourceForDetails.influence}</Text>
              </Box>
            )}
            
            {/* Text snippet */}
            <Box>
              <Text fontWeight="bold">Text Snippet</Text>
              <Box maxH="200px" overflowY="auto" bg="gray.50" p={3} borderRadius="md">
                <Text>{selectedSourceForDetails.snippet}</Text>
              </Box>
            </Box>
            
            {/* Project Gutenberg link */}
            {selectedSourceForDetails.gutenbergLink && (
              <Link href={selectedSourceForDetails.gutenbergLink} isExternal color="blue.500">
                Download from Project Gutenberg <Icon as={FaExternalLinkAlt} mx="2px" />
              </Link>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={closeSourceDetails}>
            Close
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>

{/* Canvas Preview Modal */}
<Modal isOpen={isPreviewOpen} onClose={closeCanvasPreview} size="xl">
  <ModalOverlay />
  <ModalContent>
    {previewCanvas && (
      <>
        <ModalHeader>
          {previewCanvas.name}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Canvas preview */}
            <Box 
              borderWidth="1px" 
              borderRadius="md" 
              overflow="hidden"
              bg="gray.50"
              p={2}
            >
              {previewCanvas.thumbnail ? (
                <Image 
                  src={previewCanvas.thumbnail} 
                  alt={previewCanvas.name}
                  width="100%"
                  maxHeight="400px"
                  objectFit="contain"
                  borderRadius="md"
                />
              ) : (
                <Box 
                  width="100%" 
                  height="300px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="gray.100"
                >
                  <Icon as={FaDice} boxSize={8} color="gray.400" />
                </Box>
              )}
            </Box>
            
            {/* Canvas metadata */}
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.500">
                Created: {new Date(previewCanvas.date).toLocaleString()}
              </Text>
              <Text fontSize="sm">
                {previewCanvas.tiles?.length || 0} tiles
              </Text>
            </Flex>
            
            {/* Source badges, if any */}
            {previewCanvas.sources && previewCanvas.sources.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>Sources:</Text>
                <Flex flexWrap="wrap" gap={2}>
                  {previewCanvas.sources.map(source => (
                    <Popover
                      key={source.id}
                      trigger="hover"
                      placement="auto"
                      isLazy
                      openDelay={300}
                      closeDelay={200}
                    >
                      <PopoverTrigger>
                        <Box
                          key={source.id}
                          bg={source.color || "gray.100"}
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontSize="xs"
                          cursor="pointer"
                          _hover={{ transform: "scale(1.05)" }}
                          transition="transform 0.2s"
                        >
                          {source.title}
                        </Box>
                      </PopoverTrigger>
                      <PopoverContent>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader>
                          <Flex align="center">
                            {source.icon && <Icon as={source.icon} mr={2} />}
                            <Text fontWeight="bold" fontSize="sm">{source.title}</Text>
                          </Flex>
                        </PopoverHeader>
                        <PopoverBody>
                          <VStack align="start" spacing={2}>
                            {source.author && (
                              <Text fontSize="xs" fontStyle="italic">
                                by {source.author} {source.year && `(${source.year})`}
                              </Text>
                            )}
                            <Box maxH="150px" overflowY="auto" fontSize="sm" bg="gray.50" p={2} borderRadius="md" width="100%">
                              {source.snippet}
                            </Box>
                          </VStack>
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>
                  ))}
                </Flex>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            onClick={loadFromPreview}
          >
            Load Canvas
          </Button>
          <IconButton
            icon={<FaCloudDownloadAlt />}
            colorScheme="teal"
            mr={3}
            onClick={() => {
              // Create a temporary canvas with the preview canvas data
              // and export it as an image
              const tempTiles = previewCanvas.tiles || [];
              const currentTiles = [...tiles];
              setTiles(tempTiles);
              
              // Use setTimeout to ensure the DOM has updated
              setTimeout(() => {
                exportImage();
                // Restore the original tiles
                setTiles(currentTiles);
              }, 100);
            }}
            title="⬇️ Save canvas to disk"
            aria-label="Download canvas as image"
          />
          <Button variant="ghost" onClick={closeCanvasPreview}>
            Cancel
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>

{/* Update the saved canvases display with conditional margin */}
{savedCanvases.length > 0 && (
  <Box 
    mt={4} 
    width="full"
    mb={showSavedCanvases ? 4 : (showFooter ? 20 : 4)} // Only add extra margin when footer is visible
    position="relative"
  >
    <Flex 
      justifyContent="space-between" 
      alignItems="center" 
      width="full" 
      mb={2}
      bg=""
      p={2}
      borderRadius="md"
      cursor="pointer"
      onClick={() => setShowSavedCanvases(!showSavedCanvases)}
      _hover={{ bg: "gray.50" }}
    >
      <Text fontSize="md" fontWeight="semibold">
        My Canvases ({savedCanvases.length})
      </Text>
      
      <HStack spacing={2}>
        <IconButton
          icon={showSavedCanvases ? <FaChevronUp /> : <FaChevronDown />}
          size="xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setShowSavedCanvases(!showSavedCanvases);
          }}
          aria-label={showSavedCanvases ? "Collapse saved canvases" : "Expand saved canvases"}
        />
      </HStack>
    </Flex>
    
    {showSavedCanvases && (
      <Flex 
        flexWrap="wrap" 
        gap={3} 
        justify={{ base: "center", md: "flex-start" }}
        mb={4}
        bg="white"
        borderRadius="md"
        p={2}
      >
        {savedCanvases.map(canvas => (
          <Box
            key={canvas.id}
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            width={{ base: "120px", md: "150px" }}
            height={{ base: "140px", md: "170px" }}
            position="relative"
            overflow="hidden"
            onClick={(e) => openCanvasPreview(canvas, e)}
            cursor="pointer"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.03)" }}
          >
            {/* Title now at the top */}
            <Box 
              width="100%"
              p={1}
              bg="white"
              borderBottom="1px"
              borderColor="gray.100"
            >
              <Text
                fontSize="xs"
                fontWeight="medium"
                noOfLines={1}
                textAlign="center"
                color="gray.700"
              >
                {canvas.name}
              </Text>
            </Box>
            
            <CloseButton
              size="sm"
              position="absolute"
              right="2px"
              top="2px"
              onClick={(e) => {
                e.stopPropagation();
                deleteCanvas(canvas.id, e);
              }}
              title="❌ Delete canvas"
              zIndex={1}
            />
            
            {canvas.thumbnail ? (
              <Image 
                src={canvas.thumbnail} 
                alt={canvas.name}
                width="100%"
                height="80%"
                objectFit="cover"
              />
            ) : (
              <Box 
                width="100%" 
                height="80%"
                bg="gray.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FaDice} boxSize={6} color="gray.400" />
              </Box>
            )}
          </Box>
        ))}
      </Flex>
    )}
  </Box>
)}

</Flex>
</ChakraProvider>
  );
}

export default App;