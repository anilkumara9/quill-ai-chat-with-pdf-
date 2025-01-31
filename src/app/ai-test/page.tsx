"use client";

import { useState } from 'react';
import { AIService } from '@/lib/ai-service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Image as ImageIcon, FileText } from 'lucide-react';

export default function AITestPage() {
    const [input, setInput] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [useGroq, setUseGroq] = useState(false);

    const handleTextSubmit = async () => {
        try {
            setLoading(true);
            const result = await AIService.generateTextCompletion(input, useGroq);
            setResponse(result);
        } catch (error) {
            console.error('Error:', error);
            setResponse('Error processing your request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageAnalysis = async (file: File) => {
        try {
            setLoading(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                if (e.target?.result) {
                    const imageData = e.target.result.toString();
                    const result = await AIService.analyzeImage(
                        imageData,
                        input || 'Describe this image in detail'
                    );
                    setResponse(result);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error:', error);
            setResponse('Error processing the image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handlePDFAnalysis = async (file: File) => {
        try {
            setLoading(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                if (e.target?.result) {
                    const pdfText = e.target.result.toString();
                    const result = await AIService.analyzePDF(pdfText, useGroq);
                    setResponse(result);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Error:', error);
            setResponse('Error processing the PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">AI Assistant Test Interface</h1>
            
            <div className="space-y-4">
                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <input
                            type="checkbox"
                            checked={useGroq}
                            onChange={(e) => setUseGroq(e.target.checked)}
                            id="useGroq"
                        />
                        <label htmlFor="useGroq">Use Groq (instead of Gemini)</label>
                    </div>

                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter your prompt or question here..."
                        className="min-h-[100px] mb-4"
                    />

                    <div className="flex space-x-4 mb-4">
                        <Button
                            onClick={handleTextSubmit}
                            disabled={loading || !input}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Send
                        </Button>

                        <div className="flex items-center space-x-2">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <Button
                                variant="outline"
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Upload File
                            </Button>
                            {selectedFile && (
                                <Button
                                    onClick={() => {
                                        if (selectedFile.type.includes('image')) {
                                            handleImageAnalysis(selectedFile);
                                        } else if (selectedFile.type.includes('pdf')) {
                                            handlePDFAnalysis(selectedFile);
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <FileText className="w-4 h-4 mr-2" />
                                    )}
                                    Analyze {selectedFile.type.includes('image') ? 'Image' : 'PDF'}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {response && (
                    <Card className="p-4 mt-4">
                        <h2 className="text-xl font-semibold mb-2">Response:</h2>
                        <div className="whitespace-pre-wrap">{response}</div>
                    </Card>
                )}
            </div>
        </div>
    );
}
