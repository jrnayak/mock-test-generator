'use client'

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, Plus, Settings, Trash2, Edit2 } from 'lucide-react';

const MockTestApp = () => {
  const [timeLeft, setTimeLeft] = useState(360);
  const [customTime, setCustomTime] = useState(6);
  const [isActive, setIsActive] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showTopicManager, setShowTopicManager] = useState(false);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicQuestions, setTopicQuestions] = useState('');
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestionsToGenerate, setNumQuestionsToGenerate] = useState(10);

  // Load topics from localStorage
  useEffect(() => {
    const loadTopics = () => {
      try {
        const stored = localStorage.getItem('quiz-topics');
        if (stored) {
          const loadedTopics = JSON.parse(stored);
          setTopics(loadedTopics);
          if (loadedTopics.length > 0) {
            setSelectedTopic(loadedTopics[0].name);
          }
        }
      } catch (error) {
        console.log('No topics found, starting fresh');
      }
    };
    loadTopics();
  }, []);

  // Save topics to localStorage
  const saveTopics = (updatedTopics) => {
    try {
      localStorage.setItem('quiz-topics', JSON.stringify(updatedTopics));
      setTopics(updatedTopics);
    } catch (error) {
      console.error('Error saving topics:', error);
      alert('Error saving topics. Please try again.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setIsProcessingPDF(true);

    try {
      // Read file as text using FileReader
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      
      // If text extraction worked, use it
      if (text && text.trim()) {
        setTopicQuestions(text.trim());
        if (!editingTopic || !editingTopic.name) {
          const fileName = file.name.replace('.pdf', '').replace(/_/g, ' ');
          setEditingTopic({ name: fileName, questions: [] });
        }
        setIsProcessingPDF(false);
        alert('PDF content extracted! Review the questions below.');
        return;
      }
    } catch (error) {
      console.log('Text extraction failed, trying binary method');
    }

    // Fallback: Try binary reading
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(uint8Array);
      
      // Extract readable text from PDF binary
      const cleanText = text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (cleanText) {
        setTopicQuestions(cleanText);
        if (!editingTopic || !editingTopic.name) {
          const fileName = file.name.replace('.pdf', '').replace(/_/g, ' ');
          setEditingTopic({ name: fileName, questions: [] });
        }
      }
      
      setIsProcessingPDF(false);
      alert('PDF processed! Please review and clean up the extracted text below. You can also use AI to generate questions from these samples.');
    } catch (error) {
      console.error('Error:', error);
      setIsProcessingPDF(false);
      alert('Could not extract from PDF automatically. Please paste sample questions manually and use AI to generate more questions.');
    }
  };

  const startNewTopic = () => {
    setEditingTopic({ name: '', questions: [] });
    setTopicQuestions('');
    setShowTopicManager(true);
  };

  const editTopic = (topic) => {
    setEditingTopic(topic);
    setTopicQuestions(topic.questions && topic.questions.length ? topic.questions.join('\n') : '');
    setShowTopicManager(true);
  };

  const generateQuestionsWithAI = async () => {
    if (!topicQuestions.trim()) {
      alert('Please provide some sample questions first');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Based on these sample questions, generate ${numQuestionsToGenerate} similar questions for a Year 5 math test. Keep the same style, difficulty level, and format.

Sample questions:
${topicQuestions}

Generate ONLY the questions, one per line, without numbering or explanations.`
            }
          ],
        })
      });

      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        const generatedQuestions = data.content[0].text.trim();
        const existingQuestions = topicQuestions.trim();
        const combined = existingQuestions + '\n' + generatedQuestions;
        setTopicQuestions(combined);
        alert(`${numQuestionsToGenerate} questions generated successfully!`);
      } else {
        alert('Could not generate questions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveTopic = () => {
    if (!editingTopic.name.trim() || !topicQuestions.trim()) {
      alert('Please enter both topic name and questions');
      return;
    }

    const questionsList = topicQuestions.split('\n').filter(q => q.trim());
    
    if (questionsList.length === 0) {
      alert('Please add at least one question');
      return;
    }

    const updatedTopic = {
      name: editingTopic.name.trim(),
      questions: questionsList,
      dateModified: new Date().toISOString()
    };

    let updatedTopics;
    const existingIndex = topics.findIndex(t => t.name === editingTopic.originalName || t.name === editingTopic.name);
    
    if (existingIndex >= 0) {
      updatedTopics = [...topics];
      updatedTopics[existingIndex] = updatedTopic;
    } else {
      updatedTopics = [...topics, updatedTopic];
    }

    saveTopics(updatedTopics);
    setSelectedTopic(updatedTopic.name);
    setEditingTopic(null);
    setTopicQuestions('');
    setShowTopicManager(false);
    alert('Topic saved successfully!');
  };

  const addMoreQuestions = () => {
    const topic = topics.find(t => t.name === selectedTopic);
    if (topic) {
      editTopic({ ...topic, originalName: topic.name, questions: topic.questions || [] });
    }
  };

  const deleteTopic = (topicName) => {
    if (confirm(`Are you sure you want to delete "${topicName}"?`)) {
      const updatedTopics = topics.filter(t => t.name !== topicName);
      saveTopics(updatedTopics);
      if (selectedTopic === topicName) {
        setSelectedTopic(updatedTopics.length > 0 ? updatedTopics[0].name : '');
      }
    }
  };

  const generateQuestionsFromTopic = () => {
    const topic = topics.find(t => t.name === selectedTopic);
    if (!topic || !topic.questions || topic.questions.length === 0) {
      return generateDefaultQuestions();
    }

    const newQuestions = [];
    const availableQuestions = [...topic.questions];
    
    for (let i = 0; i < Math.min(10, availableQuestions.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions.splice(randomIndex, 1)[0];
      newQuestions.push({
        id: i,
        question: question,
        answer: '',
        type: 'input'
      });
    }

    return newQuestions;
  };

  const generateDefaultQuestions = () => {
    const questionTypes = [
      {
        generate: () => {
          const denominators = [2, 4, 5, 8, 10, 20, 25, 50, 100];
          const denom = denominators[Math.floor(Math.random() * denominators.length)];
          const num = Math.floor(Math.random() * (denom - 1)) + 1;
          return {
            question: `Convert ${num}/${denom} to a decimal`,
            answer: (num / denom).toFixed(2).replace(/\.?0+$/, ''),
            type: 'input'
          };
        }
      },
      {
        generate: () => {
          const decimals = [0.25, 0.5, 0.75, 0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.7];
          const dec = decimals[Math.floor(Math.random() * decimals.length)];
          const fractions = {
            0.25: '1/4', 0.5: '1/2', 0.75: '3/4',
            0.2: '1/5', 0.4: '2/5', 0.6: '3/5', 0.8: '4/5',
            0.1: '1/10', 0.3: '3/10', 0.7: '7/10'
          };
          return {
            question: `Convert ${dec} to a fraction in its simplest form`,
            answer: fractions[dec],
            type: 'input'
          };
        }
      },
      {
        generate: () => {
          const percentages = [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
          const perc = percentages[Math.floor(Math.random() * percentages.length)];
          return {
            question: `Convert ${perc}% to a decimal`,
            answer: (perc / 100).toString(),
            type: 'input'
          };
        }
      },
      {
        generate: () => {
          const percentages = [10, 20, 25, 50, 75];
          const amounts = [100, 200, 400, 500, 800, 1000];
          const perc = percentages[Math.floor(Math.random() * percentages.length)];
          const amount = amounts[Math.floor(Math.random() * amounts.length)];
          return {
            question: `Calculate ${perc}% of ${amount}`,
            answer: ((perc / 100) * amount).toString(),
            type: 'input'
          };
        }
      }
    ];

    const newQuestions = [];
    for (let i = 0; i < 10; i++) {
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      newQuestions.push({ id: i, ...questionType.generate() });
    }
    return newQuestions;
  };

  const generateQuestions = () => {
    const newQuestions = generateQuestionsFromTopic();
    setQuestions(newQuestions);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setTimeLeft(customTime * 60);
    setIsActive(false);
  };

  useEffect(() => {
    if (topics.length === 0) {
      generateQuestions();
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startTest = () => {
    if (questions.length === 0) {
      generateQuestions();
    }
    setIsActive(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = () => {
    setIsActive(false);
    setSubmitted(true);
    let correctCount = 0;
    questions.forEach(q => {
      if (q.answer) {
        const userAnswer = (answers[q.id] || '').trim().toLowerCase();
        const correctAnswer = q.answer.toLowerCase();
        if (userAnswer === correctAnswer) {
          correctCount++;
        }
      }
    });
    setScore(correctCount);
  };

  const resetTest = () => {
    generateQuestions();
  };

  const updateTimer = () => {
    setTimeLeft(customTime * 60);
    setShowSettings(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-2 text-purple-700">
          Mock Test Generator
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Customizable Math Tests
        </p>

        {/* Topic Selection and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              disabled={isActive}
            >
              <option value="">Default FDP Questions</option>
              {topics.map((topic, idx) => (
                <option key={idx} value={topic.name}>
                  {topic.name} ({topic.questions && topic.questions.length ? topic.questions.length : 0} questions)
                </option>
              ))}
            </select>
            <button
              onClick={startNewTopic}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
              disabled={isActive}
            >
              <Plus size={18} />
              New Topic
            </button>
            <button
              onClick={addMoreQuestions}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              disabled={isActive || !selectedTopic}
            >
              <Plus size={18} />
              Add Questions
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
              disabled={isActive}
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h3 className="font-bold mb-3 text-blue-700">Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold">Timer Duration (minutes):</label>
                  <input
                    type="number"
                    value={customTime}
                    onChange={(e) => setCustomTime(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="1"
                    max="120"
                  />
                  <button
                    onClick={updateTimer}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Apply
                  </button>
                </div>
                
                {selectedTopic && (
                  <div className="pt-3 border-t border-blue-200">
                    <h4 className="font-semibold mb-2 text-blue-700">Manage Current Topic</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTopic(topics.find(t => t.name === selectedTopic))}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <Edit2 size={16} />
                        Edit Topic
                      </button>
                      <button
                        onClick={() => deleteTopic(selectedTopic)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <Trash2 size={16} />
                        Delete Topic
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Topic Manager Panel */}
          {showTopicManager && (
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <h3 className="font-bold mb-3 text-green-700">
                {editingTopic?.originalName ? 'Edit Topic' : 'Create New Topic'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">Upload PDF:</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                    disabled={isProcessingPDF}
                  />
                  {isProcessingPDF && (
                    <p className="text-sm text-blue-600 mt-1 animate-pulse">Processing PDF, please wait...</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">Upload a PDF with sample questions, or paste questions below</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Topic Name:</label>
                  <input
                    type="text"
                    value={editingTopic?.name || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                    placeholder="e.g., Year 5 Algebra"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Sample Questions (one per line):</label>
                  <textarea
                    value={topicQuestions}
                    onChange={(e) => setTopicQuestions(e.target.value)}
                    placeholder="Paste or type sample questions here, one per line&#10;e.g., Convert 3/4 to a decimal&#10;What is 25% of 80?"
                    rows="8"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {topicQuestions.split('\n').filter(q => q.trim()).length} questions entered
                  </p>
                </div>
                
                {/* AI Generation Section */}
                <div className="p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h4 className="font-semibold mb-2 text-purple-700">AI Question Generator</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    AI will analyze your sample questions and generate similar ones
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold">Generate:</label>
                    <input
                      type="number"
                      value={numQuestionsToGenerate}
                      onChange={(e) => setNumQuestionsToGenerate(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                      className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      min="1"
                      max="50"
                    />
                    <span className="text-sm">questions</span>
                    <button
                      onClick={generateQuestionsWithAI}
                      disabled={isGenerating || !topicQuestions.trim()}
                      className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : '✨ Generate with AI'}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={saveTopic}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
                  >
                    Save Topic
                  </button>
                  <button
                    onClick={() => {
                      setShowTopicManager(false);
                      setEditingTopic(null);
                      setTopicQuestions('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timer and Controls */}
        <div className="flex justify-between items-center mb-6 p-4 bg-blue-100 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" />
            <span className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {!isActive && !submitted && (
            <button
              onClick={startTest}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
            >
              Start Test
            </button>
          )}

          {submitted && (
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold text-purple-600">
                Score: {score}/10 ({Math.round((score / 10) * 100)}%)
              </div>
              <button
                onClick={resetTest}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                <RefreshCw size={18} />
                New Test
              </button>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.length === 0 && !isActive && (
            <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-gray-200">
              <p className="text-gray-600">Click "Start Test" to generate questions</p>
            </div>
          )}
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={`p-4 rounded-lg border-2 ${
                submitted && q.answer
                  ? (answers[q.id] || '').trim().toLowerCase() === q.answer.toLowerCase()
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="font-bold text-lg text-purple-600 min-w-8">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <p className="text-lg mb-3">{q.question}</p>
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    disabled={!isActive || submitted}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
                    placeholder="Your answer"
                  />
                  {submitted && q.answer && (
                    <div className="mt-2 flex items-center gap-2">
                      {(answers[q.id] || '').trim().toLowerCase() === q.answer.toLowerCase() ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} />
                          <span className="font-semibold">Correct!</span>
                        </div>
                      ) : (
                        <div className="text-red-600">
                          <div className="flex items-center gap-2">
                            <XCircle size={20} />
                            <span className="font-semibold">Incorrect</span>
                          </div>
                          <p className="mt-1 text-sm">Correct answer: {q.answer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isActive && !submitted && (
          <button
            onClick={handleSubmit}
            className="w-full mt-6 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold text-lg"
          >
            Submit Test
          </button>
        )}
      </div>
    </div>
  );
};

export default MockTestApp;
