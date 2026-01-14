/**
 * Template Analyzer - Handles image and PDF template analysis
 * Extracts layout dimensions, colors, typography, and design elements
 */

class TemplateAnalyzer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.analysisResults = {
            dimensions: null,
            colorPalette: [],
            fonts: [],
            layout: {
                sections: [],
                textBlocks: [],
                imageAreas: []
            },
            designElements: {
                icons: [],
                dividers: [],
                borders: []
            }
        };
    }

    /**
     * Analyze uploaded template file
     * @param {File} file - The uploaded template file
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeTemplate(file) {
        try {
            if (file.type.startsWith('image/')) {
                return await this.analyzeImage(file);
            } else if (file.type === 'application/pdf') {
                return await this.analyzePDF(file);
            } else {
                throw new Error('Unsupported file type');
            }
        } catch (error) {
            console.error('Template analysis failed:', error);
            throw error;
        }
    }

    /**
     * Analyze image template
     * @param {File} imageFile - The image file
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeImage(imageFile) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    // Set canvas dimensions
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;
                    
                    // Draw image to canvas
                    this.ctx.drawImage(img, 0, 0);
                    
                    // Extract image data
                    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
                    
                    // Perform analysis
                    this.analysisResults.dimensions = {
                        width: img.width,
                        height: img.height,
                        aspectRatio: (img.width / img.height).toFixed(2)
                    };
                    
                    this.extractColorPalette(imageData);
                    this.detectTextRegions(imageData);
                    this.analyzeLayout(imageData);
                    this.detectDesignElements(imageData);
                    
                    resolve(this.analysisResults);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(imageFile);
        });
    }

    /**
     * Analyze PDF template
     * @param {File} pdfFile - The PDF file
     * @returns {Promise<Object>} Analysis results
     */
    async analyzePDF(pdfFile) {
        try {
            // Convert PDF to image for analysis
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const page = await pdf.getPage(1); // Analyze first page
            
            const viewport = page.getViewport({ scale: 2.0 });
            this.canvas.width = viewport.width;
            this.canvas.height = viewport.height;
            
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Extract image data from rendered PDF
            const imageData = this.ctx.getImageData(0, 0, viewport.width, viewport.height);
            
            // Perform analysis
            this.analysisResults.dimensions = {
                width: viewport.width,
                height: viewport.height,
                aspectRatio: (viewport.width / viewport.height).toFixed(2)
            };
            
            this.extractColorPalette(imageData);
            this.detectTextRegions(imageData);
            this.analyzeLayout(imageData);
            this.detectDesignElements(imageData);
            
            // Extract text content from PDF
            const textContent = await page.getTextContent();
            this.analyzeTextContent(textContent);
            
            return this.analysisResults;
        } catch (error) {
            console.error('PDF analysis failed:', error);
            throw error;
        }
    }

    /**
     * Extract dominant colors from image data
     * @param {ImageData} imageData - Canvas image data
     */
    extractColorPalette(imageData) {
        const colorMap = new Map();
        const data = imageData.data;
        const sampleRate = 10; // Sample every 10th pixel for performance
        
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Group similar colors
            const colorKey = `${Math.floor(r/20)*20},${Math.floor(g/20)*20},${Math.floor(b/20)*20}`;
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        }
        
        // Sort colors by frequency and take top 8
        const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([color, count]) => {
                const [r, g, b] = color.split(',').map(Number);
                return {
                    rgb: `rgb(${r}, ${g}, ${b})`,
                    hex: this.rgbToHex(r, g, b),
                    frequency: count
                };
            });
        
        this.analysisResults.colorPalette = sortedColors;
    }

    /**
     * Detect text regions in the image
     * @param {ImageData} imageData - Canvas image data
     */
    detectTextRegions(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Simple text detection based on edge detection and pattern recognition
        const textRegions = [];
        const blockSize = 20;
        
        for (let y = 0; y < height - blockSize; y += blockSize) {
            for (let x = 0; x < width - blockSize; x += blockSize) {
                const textScore = this.calculateTextScore(data, x, y, blockSize, width);
                
                if (textScore > 0.3) { // Threshold for text detection
                    textRegions.push({
                        x: x,
                        y: y,
                        width: blockSize,
                        height: blockSize,
                        confidence: textScore
                    });
                }
            }
        }
        
        // Merge adjacent text regions
        this.analysisResults.layout.textBlocks = this.mergeTextRegions(textRegions);
    }

    /**
     * Calculate text likelihood score for a region
     * @param {Uint8ClampedArray} data - Image data
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} size - Block size
     * @param {number} width - Image width
     * @returns {number} Text score (0-1)
     */
    calculateTextScore(data, x, y, size, width) {
        let edgeCount = 0;
        let totalPixels = 0;
        let contrastSum = 0;
        
        for (let dy = 0; dy < size - 1; dy++) {
            for (let dx = 0; dx < size - 1; dx++) {
                const idx = ((y + dy) * width + (x + dx)) * 4;
                const nextIdx = ((y + dy) * width + (x + dx + 1)) * 4;
                const belowIdx = ((y + dy + 1) * width + (x + dx)) * 4;
                
                if (idx >= data.length || nextIdx >= data.length || belowIdx >= data.length) continue;
                
                const current = this.getGrayscale(data, idx);
                const right = this.getGrayscale(data, nextIdx);
                const below = this.getGrayscale(data, belowIdx);
                
                const horizontalEdge = Math.abs(current - right);
                const verticalEdge = Math.abs(current - below);
                
                if (horizontalEdge > 30 || verticalEdge > 30) {
                    edgeCount++;
                }
                
                contrastSum += Math.max(horizontalEdge, verticalEdge);
                totalPixels++;
            }
        }
        
        const edgeRatio = edgeCount / totalPixels;
        const avgContrast = contrastSum / totalPixels;
        
        // Text regions typically have moderate edge density and good contrast
        return Math.min(edgeRatio * 2, 1) * Math.min(avgContrast / 100, 1);
    }

    /**
     * Get grayscale value from RGB
     * @param {Uint8ClampedArray} data - Image data
     * @param {number} idx - Pixel index
     * @returns {number} Grayscale value
     */
    getGrayscale(data, idx) {
        return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    /**
     * Merge adjacent text regions
     * @param {Array} regions - Text regions
     * @returns {Array} Merged regions
     */
    mergeTextRegions(regions) {
        const merged = [];
        const used = new Set();
        
        for (let i = 0; i < regions.length; i++) {
            if (used.has(i)) continue;
            
            const group = [regions[i]];
            used.add(i);
            
            // Find adjacent regions
            for (let j = i + 1; j < regions.length; j++) {
                if (used.has(j)) continue;
                
                if (this.areRegionsAdjacent(regions[i], regions[j])) {
                    group.push(regions[j]);
                    used.add(j);
                }
            }
            
            // Calculate bounding box for the group
            const boundingBox = this.calculateBoundingBox(group);
            merged.push(boundingBox);
        }
        
        return merged;
    }

    /**
     * Check if two regions are adjacent
     * @param {Object} region1 - First region
     * @param {Object} region2 - Second region
     * @returns {boolean} Whether regions are adjacent
     */
    areRegionsAdjacent(region1, region2) {
        const threshold = 30; // pixels
        
        const horizontalOverlap = !(region1.x + region1.width < region2.x - threshold || 
                                   region2.x + region2.width < region1.x - threshold);
        const verticalOverlap = !(region1.y + region1.height < region2.y - threshold || 
                                 region2.y + region2.height < region1.y - threshold);
        
        return horizontalOverlap && verticalOverlap;
    }

    /**
     * Calculate bounding box for a group of regions
     * @param {Array} regions - Group of regions
     * @returns {Object} Bounding box
     */
    calculateBoundingBox(regions) {
        const minX = Math.min(...regions.map(r => r.x));
        const minY = Math.min(...regions.map(r => r.y));
        const maxX = Math.max(...regions.map(r => r.x + r.width));
        const maxY = Math.max(...regions.map(r => r.y + r.height));
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            confidence: Math.max(...regions.map(r => r.confidence))
        };
    }

    /**
     * Analyze overall layout structure
     * @param {ImageData} imageData - Canvas image data
     */
    analyzeLayout(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        
        // Detect major sections based on whitespace and content distribution
        const sections = this.detectSections(imageData);
        this.analysisResults.layout.sections = sections;
        
        // Analyze grid structure
        const gridInfo = this.detectGridStructure(imageData);
        this.analysisResults.layout.grid = gridInfo;
        
        // Detect margins and padding
        const margins = this.detectMargins(imageData);
        this.analysisResults.layout.margins = margins;
    }

    /**
     * Detect major sections in the layout
     * @param {ImageData} imageData - Canvas image data
     * @returns {Array} Detected sections
     */
    detectSections(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Analyze horizontal and vertical content distribution
        const horizontalProfile = new Array(height).fill(0);
        const verticalProfile = new Array(width).fill(0);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const brightness = this.getGrayscale(data, idx);
                
                // Count non-white pixels as content
                if (brightness < 240) {
                    horizontalProfile[y]++;
                    verticalProfile[x]++;
                }
            }
        }
        
        // Find section boundaries based on content gaps
        const sections = [];
        const minSectionHeight = height * 0.05; // Minimum 5% of height
        
        let sectionStart = 0;
        let inSection = false;
        
        for (let y = 0; y < height; y++) {
            const hasContent = horizontalProfile[y] > width * 0.1; // 10% of width has content
            
            if (hasContent && !inSection) {
                sectionStart = y;
                inSection = true;
            } else if (!hasContent && inSection) {
                const sectionHeight = y - sectionStart;
                if (sectionHeight > minSectionHeight) {
                    sections.push({
                        type: 'content',
                        x: 0,
                        y: sectionStart,
                        width: width,
                        height: sectionHeight
                    });
                }
                inSection = false;
            }
        }
        
        // Add final section if needed
        if (inSection) {
            sections.push({
                type: 'content',
                x: 0,
                y: sectionStart,
                width: width,
                height: height - sectionStart
            });
        }
        
        return sections;
    }

    /**
     * Detect grid structure
     * @param {ImageData} imageData - Canvas image data
     * @returns {Object} Grid information
     */
    detectGridStructure(imageData) {
        // Simplified grid detection - look for consistent spacing patterns
        const textBlocks = this.analysisResults.layout.textBlocks;
        
        if (textBlocks.length < 2) {
            return { columns: 1, rows: 1, gutters: { horizontal: 0, vertical: 0 } };
        }
        
        // Analyze horizontal alignment
        const leftAlignments = textBlocks.map(block => block.x).sort((a, b) => a - b);
        const uniqueLefts = [...new Set(leftAlignments.map(x => Math.round(x / 10) * 10))];
        
        // Analyze vertical spacing
        const topAlignments = textBlocks.map(block => block.y).sort((a, b) => a - b);
        const verticalGaps = [];
        for (let i = 1; i < topAlignments.length; i++) {
            verticalGaps.push(topAlignments[i] - topAlignments[i-1]);
        }
        
        const avgVerticalGap = verticalGaps.length > 0 ? 
            verticalGaps.reduce((a, b) => a + b, 0) / verticalGaps.length : 0;
        
        return {
            columns: uniqueLefts.length,
            rows: Math.ceil(textBlocks.length / uniqueLefts.length),
            gutters: {
                horizontal: avgVerticalGap,
                vertical: uniqueLefts.length > 1 ? uniqueLefts[1] - uniqueLefts[0] : 0
            }
        };
    }

    /**
     * Detect margins and padding
     * @param {ImageData} imageData - Canvas image data
     * @returns {Object} Margin information
     */
    detectMargins(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Find content boundaries
        let topMargin = 0, bottomMargin = 0, leftMargin = 0, rightMargin = 0;
        
        // Top margin
        for (let y = 0; y < height; y++) {
            let hasContent = false;
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (this.getGrayscale(data, idx) < 240) {
                    hasContent = true;
                    break;
                }
            }
            if (hasContent) {
                topMargin = y;
                break;
            }
        }
        
        // Bottom margin
        for (let y = height - 1; y >= 0; y--) {
            let hasContent = false;
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (this.getGrayscale(data, idx) < 240) {
                    hasContent = true;
                    break;
                }
            }
            if (hasContent) {
                bottomMargin = height - 1 - y;
                break;
            }
        }
        
        // Left margin
        for (let x = 0; x < width; x++) {
            let hasContent = false;
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                if (this.getGrayscale(data, idx) < 240) {
                    hasContent = true;
                    break;
                }
            }
            if (hasContent) {
                leftMargin = x;
                break;
            }
        }
        
        // Right margin
        for (let x = width - 1; x >= 0; x--) {
            let hasContent = false;
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                if (this.getGrayscale(data, idx) < 240) {
                    hasContent = true;
                    break;
                }
            }
            if (hasContent) {
                rightMargin = width - 1 - x;
                break;
            }
        }
        
        return {
            top: topMargin,
            bottom: bottomMargin,
            left: leftMargin,
            right: rightMargin
        };
    }

    /**
     * Detect design elements like icons, dividers, borders
     * @param {ImageData} imageData - Canvas image data
     */
    detectDesignElements(imageData) {
        // Simplified design element detection
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        const elements = {
            horizontalLines: [],
            verticalLines: [],
            shapes: []
        };
        
        // Detect horizontal lines
        for (let y = 0; y < height; y += 5) {
            let lineStart = -1;
            let lineLength = 0;
            
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const brightness = this.getGrayscale(data, idx);
                
                if (brightness < 200) { // Dark pixel
                    if (lineStart === -1) lineStart = x;
                    lineLength++;
                } else {
                    if (lineLength > width * 0.1) { // Line is at least 10% of width
                        elements.horizontalLines.push({
                            x: lineStart,
                            y: y,
                            length: lineLength,
                            thickness: 1
                        });
                    }
                    lineStart = -1;
                    lineLength = 0;
                }
            }
        }
        
        this.analysisResults.designElements = elements;
    }

    /**
     * Analyze text content from PDF
     * @param {Object} textContent - PDF text content
     */
    analyzeTextContent(textContent) {
        const fonts = new Set();
        const textItems = textContent.items;
        
        textItems.forEach(item => {
            if (item.fontName) {
                fonts.add(item.fontName);
            }
        });
        
        this.analysisResults.fonts = Array.from(fonts);
    }

    /**
     * Convert RGB to hex
     * @param {number} r - Red value
     * @param {number} g - Green value
     * @param {number} b - Blue value
     * @returns {string} Hex color
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Get analysis results
     * @returns {Object} Analysis results
     */
    getResults() {
        return this.analysisResults;
    }

    /**
     * Reset analyzer for new template
     */
    reset() {
        this.analysisResults = {
            dimensions: null,
            colorPalette: [],
            fonts: [],
            layout: {
                sections: [],
                textBlocks: [],
                imageAreas: []
            },
            designElements: {
                icons: [],
                dividers: [],
                borders: []
            }
        };
    }
}

// Export for use in other modules
window.TemplateAnalyzer = TemplateAnalyzer;