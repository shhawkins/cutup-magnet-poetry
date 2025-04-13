import React, { useState, useEffect, useRef } from 'react';
import {
  ChakraProvider, Box, Flex, VStack, HStack, Button, IconButton, Input,
  Text, Divider, useToast, extendTheme,
  Icon, Popover, PopoverTrigger, PopoverContent, PopoverBody, CloseButton
} from '@chakra-ui/react';
import { 
  FaCut, FaRandom, FaDownload, FaTrash, FaPlus, FaDice, FaChevronDown,
  FaChevronUp, FaChevronDown as FaChevronExpand
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
      icon: sourceInfo.icon
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
    // Validate source selection
    if (selectedSources.length < 2) {
      toast({
        title: 'Select at least 2 sources!',
        status: 'warning'
      });
      return;
    }

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
    status: 'success' 
  });
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
  };

  // Export as image
  const exportImage = () => {
    html2canvas(boardRef.current, { backgroundColor: '#f7fafc' }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'cut-up-poetry.jpg';
      link.href = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG at 70% quality
      link.click();
    });
    toast({ title: 'Cutting board saved to disk!', status: 'success'});
  };

  // Clear tiles
  const clearTiles = () => {
    setTiles([]);
    toast({ title: 'Tiles cleared!', status: 'error'});
  };

  // Toggle source section
  const toggleSourceSection = () => {
    setShowSourceSection(!showSourceSection);
    
    // After toggling, update board size
    setTimeout(updateBoardSize, 100);
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
  const maxSources = Math.min(10, shuffledSources.length);
  const selectedCount = 2 + Math.floor(Math.random() * (maxSources - 1)); // At least 2, up to 10
  
  // Add each selected source
  const newSources = shuffledSources.slice(0, selectedCount);
  
  // Add each source (using your existing addSource function)
  newSources.forEach(source => {
    const sourceId = `${source.category}-${source.sourceKey}`;
    const sourceInfo = textSources[source.category].sources[source.sourceKey];
    const snippet = getRandomSnippet(sourceInfo.text);
    
    const newSource = {
      id: sourceId,
      category: source.category,
      key: source.sourceKey,
      title: sourceInfo.title,
      snippet,
      color: textSources[source.category].color,
      icon: sourceInfo.icon
    };
    
    setSelectedSources(prev => [...prev, newSource]);
  });
  
  // Show notification
  toast({ 
    title: `Randomly selected ${selectedCount} sources!`, 
    status: 'success',
    duration: 2000
  });
  
  // Automatically generate new cut-up tiles
  setTimeout(() => {
    generateTiles();
  }, 500);
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
          <Text 
            fontSize={{ base: "3xl", md: "4xl" }}
            fontFamily="'Courier New', Courier, monospace"
            fontWeight="bold"
            color="black"
          >
            cut up
          </Text>
          
          <Button
            size="sm"
            variant="ghost"
            rightIcon={showSourceSection ? <FaChevronUp /> : <FaChevronExpand />}
            onClick={toggleSourceSection}
            _hover={{ bg: "gray.100" }}
          >
            {showSourceSection ? "Hide Sources" : "Show Sources"}
          </Button>
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
            <HStack width="full">
              <Input
                placeholder="Enter text or select a source below..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomText()}
              />
              {/* <IconButton
                icon={<FaPlus />}
                onClick={addCustomText}
                aria-label="Add custom text"
                colorScheme="teal"
              /> */}
              <IconButton
                icon={<FaDiceFive />}
                onClick={randomizeSources}
                aria-label="Add random sources"
                colorScheme="blue"
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
                    <Popover key={category} placement="bottom" closeOnBlur={true}>
                      {({ onClose }) => (
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
                <Button 
                  leftIcon={<FaCut />} 
                  colorScheme="teal" 
                  onClick={generateTiles}
                  size="lg"
                  height="50px"
                  fontSize="xl"
                >
                  Cut!
                </Button>
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
                  <Button
                    size="xs"
                    colorScheme="red"
                    borderRadius="full"
                    onClick={() => {
                      setSelectedSources([]);
                      setCustomTexts([]);
                      toast({ title: 'All sources cleared!', status: 'info'});
                    }}
                  >
                    Remove All
                  </Button>
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
                    Select 2+ Sources
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
                      >
                        <IconButton
                          icon={<FaDiceFive/>}
                          size="xs"
                          position="absolute"
                          right="20px" 
                          top="2px"
                          onClick={() => refreshSourceSnippet(source.id)}
                          aria-label="Refresh snippet"
                          variant="ghost"
                          _hover={{ bg: "blackAlpha.200" }}
                          title="Get new snippet"
                        />
                        <CloseButton
                          size="sm"
                          position="absolute"
                          right="2px"
                          top="2px"
                          onClick={() => removeSource(source.id)}
                          title="Close source"
                        />
                        <VStack height="full" align="start" spacing={1}>
                          <HStack>
                            {source.icon && <Icon as={source.icon} />}
                            <Text 
                              fontWeight="bold" 
                              fontSize="xs"        // Smaller font size (from "sm" to "xs")
                              noOfLines={2}        // Allow up to 2 lines instead of 1
                              wordBreak="break-word" // Force word wrapping
                              width="calc(100% - 20px)" // Allow space for the icon
                              paddingRight="3px"
                              paddingTop="8px"
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
        {!showSourceSection && selectedSources.length > 0 && (
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
            <Button
              size="xs"
              variant="outline"
              colorScheme="teal"
              onClick={generateTiles}
              leftIcon={<FaCut />}
            >
              Cut Again
            </Button>
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
    <IconButton
      icon={<FaPlus />}
      onClick={addTiles}
      aria-label="Recut from Sources"
      colorScheme="green"
      title="Generate new tiles to replace current tiles"
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
    />
    <IconButton
      icon={<FaDownload />}
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
    />
  </HStack>
  
  {/* Quote Footer - Hide on small screens */}
  <Box
    as="footer"
    display={{ base: "none", md: "block" }}
    mb={6}
    textAlign="center"
    fontStyle="italic"
    color="gray.600"
    fontSize="sm"
  >
    "Language is a virus from outer space." -William S. Burroughs
  </Box>
</Box>

</Flex>
</ChakraProvider>
  );
}

export default App;