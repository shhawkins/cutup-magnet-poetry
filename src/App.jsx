import React, { useState, useEffect, useRef } from 'react';
import {
  ChakraProvider, Box, Flex, VStack, HStack, Button, IconButton, Input,
  Text, Divider, useToast, extendTheme, Menu, MenuButton, MenuList, MenuItem,
  Icon, Popover, PopoverTrigger, PopoverContent, PopoverBody, CloseButton
} from '@chakra-ui/react';
import { 
  FaCut, FaFileExport, FaClipboard, FaTrash, FaPlus, FaChevronDown,
  FaChevronUp, FaChevronDown as FaChevronExpand
} from 'react-icons/fa';
import Draggable from 'react-draggable';
import html2canvas from 'html2canvas';
import { textSources } from './data/textSources';

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

function App() {
  const [selectedSources, setSelectedSources] = useState([]);
  const [customTexts, setCustomTexts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [tiles, setTiles] = useState([]);
  const boardRef = useRef(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const toast = useToast({
    position: "bottom-right",
    duration: 2000,
    isClosable: true,
  });
  const [showSourceSection, setShowSourceSection] = useState(true);
  const appContainerRef = useRef(null);
  

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
    const baseWidth = isMobile ? 80 : 120; // Smaller width on mobile
    const baseHeight = isMobile ? 40 : 60; // Smaller height on mobile
    
    // Scale based on text length
    const length = text.length;
    let width = baseWidth;
    let height = baseHeight;
    
    if (length > 30) {
      width = baseWidth * 1.5;
      height = baseHeight * 1.3;
    } else if (length > 15) {
      width = baseWidth * 1.2;
      height = baseHeight * 1.1;
    }
    
    return { width, height };
  };

  // Improved tile generation with better positioning
  const generateTiles = () => {
    // Validate source selection
    if (selectedSources.length < 2) {
      toast({
        title: 'Select at least 2 sources!',
        status: 'warning',
        duration: 2000
      });
      return;
    }
    
    // Combine text from all selected sources
    const allText = selectedSources.map(source => {
      return source.category === 'custom' 
        ? source.text 
        : textSources[source.category].sources[source.key].text;
    }).join(' ');
    
    // Cut up text and limit number of tiles
    const MAX_TILES = 25;
    const shuffledTiles = shuffleArray(cutUpText(allText)).slice(0, MAX_TILES);
    
    // Ensure board dimensions are up to date
    updateBoardSize();
    
    // Get board dimensions
    const boardWidth = boardRef.current ? boardRef.current.clientWidth : window.innerWidth * 0.95;
    const boardHeight = boardRef.current ? boardRef.current.clientHeight : window.innerHeight * 0.5;
    
    // Set padding and create positioning boundaries
    const padding = 20;
    const minX = padding;
    const maxX = boardWidth - padding;
    const minY = boardHeight / 2; // Start in lower half of the canvas
    const maxY = boardHeight - padding;
    
    // Create positioned tiles with random distribution
    const positionedTiles = shuffledTiles.map((text, i) => {
      const tileSize = calculateTileSize(text);
      
      // Random position within the lower half
      const x = minX + Math.random() * (maxX - minX - tileSize.width);
      const y = minY + Math.random() * (maxY - minY - tileSize.height);
      
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
    
    // Hide source section after generating tiles to give more space to the board
    if (showSourceSection && window.innerWidth < 768) { // Only auto-hide on mobile
      setShowSourceSection(false);
    }
  };

  // Export as image
  const exportImage = () => {
    html2canvas(boardRef.current, { backgroundColor: '#f7fafc' }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'cut-up-poetry.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    html2canvas(boardRef.current, { backgroundColor: '#f7fafc' }).then(canvas => {
      canvas.toBlob(blob => {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast({ title: 'Copied to clipboard!', status: 'success', duration: 2000 });
      });
    });
  };

  // Clear tiles
  const clearTiles = () => {
    setTiles([]);
    toast({ title: 'All tiles cleared!', status: 'info', duration: 2000 });
  };

  // Toggle source section
  const toggleSourceSection = () => {
    setShowSourceSection(!showSourceSection);
    
    // After toggling, update board size
    setTimeout(updateBoardSize, 100);
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

  // Add pinch-to-zoom functionality
useEffect(() => {
  if (!boardRef.current) return;
  
  let currentScale = 1;
  let startDistance = 0;
  
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      startDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };
  
  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default scrolling when pinching
      
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (startDistance > 0) {
        const newScale = currentScale * (currentDistance / startDistance);
        currentScale = Math.max(0.5, Math.min(newScale, 2)); // Limit scale between 0.5 and 2
        
        // Apply the scale transformation to the board content
        const contentElement = boardRef.current.querySelector('.board-content');
        if (contentElement) {
          contentElement.style.transform = `scale(${currentScale})`;
          contentElement.style.transformOrigin = 'center center';
        }
        
        startDistance = currentDistance;
      }
    }
  };
  
  const board = boardRef.current;
  board.addEventListener('touchstart', handleTouchStart);
  board.addEventListener('touchmove', handleTouchMove, { passive: false });
  
  return () => {
    board.removeEventListener('touchstart', handleTouchStart);
    board.removeEventListener('touchmove', handleTouchMove);
  };
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
              <IconButton
                icon={<FaPlus />}
                onClick={addCustomText}
                aria-label="Add custom text"
                colorScheme="teal"
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
                      toast({ title: 'All sources cleared!', status: 'info', duration: 2000 });
                    }}
                  >
                    Remove All Sources
                  </Button>
                )}
              </Flex>
              {selectedSources.length === 0 ? (
                <Flex
                  width="150px"
                  height="150px"
                  justifyContent="center"
                  alignItems="center"
                  borderRadius="lg"
                  bg="gray.50"
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor="gray.300"
                >
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    color="gray.500"
                    textAlign="center"
                    px={4}
                  >
                    Select 2+ Sources to Begin
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
                        <CloseButton
                          size="sm"
                          position="absolute"
                          right="2px"
                          top="2px"
                          onClick={() => removeSource(source.id)}
                        />
                        <VStack height="full" align="start" spacing={1}>
                          <HStack>
                            {source.icon && <Icon as={source.icon} />}
                            <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
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
<Flex 
  direction="column" 
  align="center" 
  w="full"
>
  <HStack 
    p={{ base: 2, md: 4 }} 
    spacing={{ base: 2, md: 4 }} 
    bg="gray.50" 
    justifyContent="center"
  >
    <IconButton
      icon={<FaTrash />}
      onClick={clearTiles}
      aria-label="Clear all tiles"
      colorScheme="red"
      title="Clear unused tiles"
    />
    <IconButton
      icon={<FaFileExport />}
      onClick={exportImage}
      aria-label="Export as image"
      colorScheme="blue"
    />
    <IconButton
      icon={<FaClipboard />}
      onClick={copyToClipboard}
      aria-label="Copy to clipboard"
      colorScheme="green"
    />
  </HStack>
  
  {/* Quote Footer */}
  <Box
    as="footer"
    mt={10}
    mb={6}
    textAlign="center"
    fontStyle="italic"
    color="gray.600"
    fontSize="sm"
  >
    "Language is a virus from outer space." -William S. Burroughs
  </Box>
</Flex>

</Flex>
</ChakraProvider>
  );
}

export default App;